-- Update existing notifications to have the correct type based on conversation type
UPDATE notifications n
SET type = CASE 
  WHEN (n.data->>'conversation_type')::text = 'group' THEN 'new_group_message'
  ELSE 'new_message'
END
WHERE n.type = 'new_message'
  AND n.data->>'conversation_type' IS NOT NULL;

-- Add a check constraint to ensure notification type matches conversation type
ALTER TABLE notifications
ADD CONSTRAINT check_message_notification_type
CHECK (
  (type NOT IN ('new_message', 'new_group_message')) OR
  (
    type = CASE 
      WHEN (data->>'conversation_type')::text = 'group' THEN 'new_group_message'
      ELSE 'new_message'
    END
  )
);




