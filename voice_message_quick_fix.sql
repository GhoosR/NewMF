-- Quick fix for voice messages - run this in Supabase SQL Editor
-- This will add the necessary fields to the messages table

-- Add voice message fields to messages table (if they don't exist)
DO $$ 
BEGIN
    -- Add message_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
        ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file'));
    END IF;
    
    -- Add audio_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'audio_url') THEN
        ALTER TABLE messages ADD COLUMN audio_url TEXT;
    END IF;
    
    -- Add audio_duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'audio_duration') THEN
        ALTER TABLE messages ADD COLUMN audio_duration INTEGER;
    END IF;
    
    -- Add file_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_url') THEN
        ALTER TABLE messages ADD COLUMN file_url TEXT;
    END IF;
    
    -- Add file_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_name') THEN
        ALTER TABLE messages ADD COLUMN file_name TEXT;
    END IF;
    
    -- Add file_size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_size') THEN
        ALTER TABLE messages ADD COLUMN file_size INTEGER;
    END IF;
    
    -- Add file_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_type') THEN
        ALTER TABLE messages ADD COLUMN file_type TEXT;
    END IF;
END $$;

-- Update existing messages to have 'text' type
UPDATE messages SET message_type = 'text' WHERE message_type IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_audio_url ON messages(audio_url) WHERE audio_url IS NOT NULL;

-- Create validation function
CREATE OR REPLACE FUNCTION validate_voice_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate voice message has required fields
  IF NEW.message_type = 'voice' THEN
    IF NEW.audio_url IS NULL THEN
      RAISE EXCEPTION 'Voice messages must have an audio_url';
    END IF;
    
    IF NEW.audio_duration IS NULL OR NEW.audio_duration <= 0 THEN
      RAISE EXCEPTION 'Voice messages must have a valid duration';
    END IF;
    
    -- Limit voice message duration to 5 minutes (300 seconds)
    IF NEW.audio_duration > 300 THEN
      RAISE EXCEPTION 'Voice messages cannot exceed 5 minutes';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate message data
DROP TRIGGER IF EXISTS validate_message_data ON messages;
CREATE TRIGGER validate_message_data
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_voice_message();

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('message_type', 'audio_url', 'audio_duration', 'file_url', 'file_name', 'file_size', 'file_type')
ORDER BY column_name;




