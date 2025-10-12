-- Add nullable phone_number and level columns to users table if they don't exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS level VARCHAR(10);

-- Optional: create indexes for performance if needed
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
