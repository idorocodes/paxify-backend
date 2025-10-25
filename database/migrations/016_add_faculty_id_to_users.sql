-- Add faculty_id column to users table
ALTER TABLE users
ADD COLUMN faculty_id UUID;

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_faculty
FOREIGN KEY (faculty_id) 
REFERENCES faculties(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_faculty_id ON users(faculty_id);

-- Update existing users if needed (this is just an example, adjust as needed)
-- UPDATE users SET faculty_id = 'default-faculty-id' WHERE faculty_id IS NULL;

-- Add comment
COMMENT ON COLUMN users.faculty_id IS 'References the faculty this user belongs to (for students)';

-- Update the updated_at trigger if it exists
-- This ensures the updated_at column is automatically updated when a row is modified
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END
$$;
