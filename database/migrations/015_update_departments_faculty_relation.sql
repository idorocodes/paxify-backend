-- First, add the new faculty_id column
ALTER TABLE departments
ADD COLUMN faculty_id UUID REFERENCES faculties(id);

-- Copy existing faculty names to a temporary column to maintain data
UPDATE departments d
SET faculty_id = (
    SELECT id 
    FROM faculties f 
    WHERE f.name = d.faculty 
    LIMIT 1
);

-- Make faculty_id required for new departments
ALTER TABLE departments
ALTER COLUMN faculty_id SET NOT NULL;

-- Drop the old faculty column
ALTER TABLE departments
DROP COLUMN faculty;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id);

-- Add comment
COMMENT ON COLUMN departments.faculty_id IS 'Foreign key reference to faculties table';