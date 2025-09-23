/*
  # Remove Chat Functionality
  
  1. Changes
    - Drop all chat-related tables
    - Drop related functions and triggers
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS on_chat_message_created ON chat_messages;
DROP TRIGGER IF EXISTS on_chat_participant_created ON chat_participants;

-- Drop functions
DROP FUNCTION IF EXISTS update_chat_timestamp();
DROP FUNCTION IF EXISTS create_chat_tab();

-- Drop tables in correct order
DROP TABLE IF EXISTS chat_tabs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chats CASCADE;