-- Add student profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS matric_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add comment to explain the fields
COMMENT ON COLUMN users.matric_number IS 'Student''s matriculation number';
COMMENT ON COLUMN users.department IS 'Student''s department';