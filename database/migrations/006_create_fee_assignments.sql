-- Create fee assignments table
CREATE TABLE IF NOT EXISTS fee_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    fee_category_id UUID NOT NULL REFERENCES fee_categories(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fee_assignments_user ON fee_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_fee_assignments_category ON fee_assignments(fee_category_id);
CREATE INDEX IF NOT EXISTS idx_fee_assignments_status ON fee_assignments(status);
CREATE INDEX IF NOT EXISTS idx_fee_assignments_due_date ON fee_assignments(due_date);

-- Add comment
COMMENT ON TABLE fee_assignments IS 'Stores fee assignments to students with tracking of who created them';