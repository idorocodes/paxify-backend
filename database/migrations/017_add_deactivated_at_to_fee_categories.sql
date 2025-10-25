-- Add deactivated_at column to fee_categories
ALTER TABLE fee_categories
ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deactivated_by UUID REFERENCES users(id);

-- Update existing records to set deactivated_at for inactive categories
UPDATE fee_categories 
SET deactivated_at = updated_at 
WHERE is_active = false AND deactivated_at IS NULL;

-- Add comments for the new columns
COMMENT ON COLUMN fee_categories.deactivated_at IS 'Timestamp when the fee category was deactivated';
COMMENT ON COLUMN fee_categories.deactivated_by IS 'ID of the admin who deactivated the fee category';

-- Create index for better query performance on deactivated status
CREATE INDEX IF NOT EXISTS idx_fee_categories_deactivated ON fee_categories(deactivated_at);

-- Update the update trigger to handle deactivation
CREATE OR REPLACE FUNCTION update_fee_category_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    -- If is_active is being set to false and deactivated_at is null, set deactivated_at
    IF NEW.is_active = false AND OLD.is_active = true AND NEW.deactivated_at IS NULL THEN
        NEW.deactivated_at = NOW();
        NEW.deactivated_by = NEW.updated_by;
    -- If is_active is being set to true, clear deactivated_at and deactivated_by
    ELSIF NEW.is_active = true AND OLD.is_active = false THEN
        NEW.deactivated_at = NULL;
        NEW.deactivated_by = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS update_fee_categories_updated_at ON fee_categories;

-- Create the new trigger
CREATE TRIGGER update_fee_categories_status
    BEFORE UPDATE ON fee_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_fee_category_status();
