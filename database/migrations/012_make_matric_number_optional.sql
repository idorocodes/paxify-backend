-- Make matric_number optional
ALTER TABLE users
    ALTER COLUMN matric_number DROP NOT NULL,
    DROP CONSTRAINT matric_format;