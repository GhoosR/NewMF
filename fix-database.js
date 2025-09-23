import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://afvltpqnhmaxanirwnqz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdmx0cHFuaG1heGFuaXJ3bnF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTEzODU2MSwiZXhwIjoyMDUwNzE0NTYxfQ.aVY4Ukq5gRrkHX8a6mTCJaASy_FJkeKWXvkzuNcF_wI'
);

async function fixDatabase() {
  try {
    // 1. Fix the update_conversation_last_viewed function
    const { error: dropFuncError } = await supabase.rpc('drop_function_if_exists', {
      function_name: 'update_conversation_last_viewed',
      param_types: ['uuid', 'uuid']
    });
    if (dropFuncError) console.log('Drop function error:', dropFuncError);

    const { error: createFuncError } = await supabase.rpc('create_function', {
      function_body: `
        CREATE OR REPLACE FUNCTION update_conversation_last_viewed(
          p_conversation_id uuid,
          p_user_id uuid
        )
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          -- Verify the user is a participant
          IF NOT EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = p_conversation_id
            AND p_user_id = ANY(c.participant_ids)
          ) THEN
            RETURN;
          END IF;

          -- Update the last viewed timestamp
          UPDATE conversations c
          SET 
            last_viewed_by = p_user_id,
            last_viewed_at = now()
          WHERE c.id = p_conversation_id;

          -- Also update the conversation_participants table
          UPDATE conversation_participants cp
          SET last_viewed_at = now()
          WHERE cp.conversation_id = p_conversation_id
          AND cp.user_id = p_user_id;
        END;
        $$;
      `
    });
    if (createFuncError) console.log('Create function error:', createFuncError);

    // 2. Create storage bucket if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket('group-chat-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.log('Create bucket error:', bucketError);
    }

    // 3. Fix conversation constraints
    const { error: fixConstraintsError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Drop existing constraints
        ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
        ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;
        DROP INDEX IF EXISTS conversations_participant_ids_direct_idx;

        -- Add new type check constraint
        ALTER TABLE conversations ADD CONSTRAINT conversations_type_check
          CHECK (type IN ('direct', 'group'));

        -- Update any existing 'dm' types to 'direct'
        UPDATE conversations SET type = 'direct' WHERE type = 'dm';

        -- Add new participant_ids check constraint
        ALTER TABLE conversations ADD CONSTRAINT conversations_participant_ids_check
          CHECK (
            CASE
              WHEN type = 'direct' THEN array_length(participant_ids, 1) = 2
              WHEN type = 'group' THEN array_length(participant_ids, 1) >= 2 AND array_length(participant_ids, 1) <= COALESCE(max_participants, 5)
              ELSE false
            END
          );

        -- Create a unique index for direct conversations to prevent duplicates
        CREATE OR REPLACE FUNCTION array_sort(anyarray)
        RETURNS anyarray AS $$
          SELECT array_agg(x ORDER BY x)
          FROM unnest($1) x;
        $$ LANGUAGE SQL IMMUTABLE;

        CREATE UNIQUE INDEX conversations_direct_participants_idx ON conversations (
          (array_sort(participant_ids))
        ) WHERE type = 'direct';
      `
    });
    if (fixConstraintsError) console.log('Fix constraints error:', fixConstraintsError);

    console.log('Database fixes completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDatabase();
