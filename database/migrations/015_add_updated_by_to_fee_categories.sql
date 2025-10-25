-- Add updated_by column to fee_categories
ALTER TABLE fee_categories 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Update the trigger to maintain updated_by
CREATE OR REPLACE FUNCTION update_fee_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it's using the latest function definition
DROP TRIGGER IF EXISTS update_fee_categories_updated_at ON fee_categories;

CREATE TRIGGER update_fee_categories_updated_at
BEFORE UPDATE ON fee_categories
FOR EACH ROW
EXECUTE FUNCTION update_fee_categories_updated_at();

-- Add comment for the new column
COMMENT ON COLUMN fee_categories.updated_by IS 'ID of the admin who last updated this record';
