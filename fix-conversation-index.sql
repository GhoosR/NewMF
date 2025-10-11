-- Drop existing index if it exists
DROP INDEX IF EXISTS conversations_direct_participants_idx;

-- Create function to sort arrays
CREATE OR REPLACE FUNCTION sort_array(arr anyarray)
RETURNS anyarray AS $$
BEGIN
    RETURN ARRAY(SELECT unnest(arr) ORDER BY 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create unique index for direct conversations that is order-independent
CREATE UNIQUE INDEX conversations_direct_participants_idx 
ON conversations ((sort_array(participant_ids)))
WHERE type = 'direct' AND array_length(participant_ids, 1) = 2;

