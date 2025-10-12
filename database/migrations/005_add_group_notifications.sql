-- Add group notification capabilities
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
ADD COLUMN IF NOT EXISTS target_criteria JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_target 
ON notifications(target_type, (target_criteria->>'level'));

-- Update comment
COMMENT ON COLUMN notifications.target_type IS 'INDIVIDUAL, LEVEL, or CUSTOM_GROUP';
COMMENT ON COLUMN notifications.target_criteria IS 'Criteria for group notifications (e.g., level, department, etc.)';