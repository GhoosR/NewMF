/*
  # Verify existing practitioners with certifications

  1. Updates
    - Set `verified = true` for all users who have approved practitioner listings with certification documents
    - This ensures existing practitioners who were approved before the verification system get their verified badges

  2. Security
    - Only updates users who have both approved practitioner listings AND certification documents
    - Uses safe UPDATE with proper WHERE conditions
*/

-- Update users to verified status if they have approved practitioner listings with certifications
UPDATE users 
SET verified = true, updated_at = now()
WHERE id IN (
  SELECT DISTINCT p.user_id 
  FROM practitioners p 
  WHERE p.approval_status = 'approved' 
    AND p.certification_url IS NOT NULL 
    AND p.certification_url != ''
    AND users.verified IS NOT TRUE  -- Only update if not already verified
);