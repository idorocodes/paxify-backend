-- Add roles column first
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50);

-- Create default super admin user
INSERT INTO users (
    first_name,
    last_name,
    email,
    password_hash,
    is_admin,
    role,
    is_active,
    created_at
) VALUES (
    'Super',
    'Admin',
    'admin@paxify.com',
    -- Default password is 'Admin@123' - please change after first login
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdCsn7j.DHLHBHe',
    true,
    'super_admin',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create default student user
INSERT INTO users (
    first_name,
    last_name,
    email,
    matric_number,
    password_hash,
    is_admin,
    is_active,
    created_at
) VALUES (
    'John',
    'Doe',
    'student@paxify.com',
    'CSC/2023/001',
    -- Default password is 'Student@123' - please change after first login
    '$2b$12$k8Y1THPD8KYbBSGYrR/cc.FJY8/9ZPV1y6jR.PPwYmSH.X0y6Cs6.',
    false,
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;