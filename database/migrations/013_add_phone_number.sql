-- Add phone_number column to users table (nullable)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Optional: create index for faster lookups by phone_number
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users (phone_number);