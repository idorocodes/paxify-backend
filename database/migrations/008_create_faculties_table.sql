-- Create faculties table
CREATE TABLE IF NOT EXISTS faculties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_faculties_name ON faculties(name);
CREATE INDEX IF NOT EXISTS idx_faculties_code ON faculties(code);

-- Add comment
COMMENT ON TABLE faculties IS 'Stores academic faculties information';