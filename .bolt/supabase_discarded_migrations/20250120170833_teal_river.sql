-- Add type and filename columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
ADD COLUMN IF NOT EXISTS filename TEXT;

-- Update existing messages to have type 'text'
UPDATE messages SET type = 'text' WHERE type IS NULL;