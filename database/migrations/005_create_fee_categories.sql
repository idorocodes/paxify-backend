-- Create fee categories table
CREATE TABLE IF NOT EXISTS fee_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT false,
    frequency VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_amount CHECK (amount >= 0),
    CONSTRAINT valid_frequency CHECK (frequency IN ('once', 'semester', 'annual', 'monthly') OR frequency IS NULL)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fee_categories_name ON fee_categories(name);
CREATE INDEX IF NOT EXISTS idx_fee_categories_is_active ON fee_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_categories_frequency ON fee_categories(frequency);

-- Add trigger for updating updated_at
CREATE TRIGGER update_fee_categories_updated_at
    BEFORE UPDATE ON fee_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE fee_categories IS 'Stores different types of fees that can be assigned to students';