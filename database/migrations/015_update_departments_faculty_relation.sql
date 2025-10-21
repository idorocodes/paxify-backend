-- First ensure the Faculty of Computing Sciences exists
INSERT INTO faculties (name, code, is_active)
VALUES ('Faculty of Computing Sciences', 'FCS', true)
ON CONFLICT (name) DO NOTHING;

-- Add the new faculty_id column
ALTER TABLE departments
ADD COLUMN faculty_id UUID REFERENCES faculties(id);

-- Set faculty_id for CSC department
UPDATE departments d
SET faculty_id = (
    SELECT id 
    FROM faculties 
    WHERE name = 'Faculty of Computing Sciences'
);

-- Make faculty_id required
ALTER TABLE departments
ALTER COLUMN faculty_id SET NOT NULL;

-- Drop the old faculty column
ALTER TABLE departments
DROP COLUMN faculty;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id);

-- Add comment
COMMENT ON COLUMN departments.faculty_id IS 'Foreign key reference to faculties table';