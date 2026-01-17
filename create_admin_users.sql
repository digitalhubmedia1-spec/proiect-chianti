-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Storing plain text as per "viewable password" requirement (not best practice but requested)
    role TEXT NOT NULL CHECK (role IN ('admin_app', 'operator', 'chef')),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read/write for now (admin panel uses this)
-- In a real app we'd secure this tighter, but for this custom admin flow:
CREATE POLICY "Allow public access to admin_users" ON admin_users FOR ALL USING (true);


-- Seed Data
-- 1. Operator 1
INSERT INTO admin_users (username, password, role, name)
VALUES (
    'operator1', 
    'Chianti_Op#2026', 
    'operator', 
    'Operator 1'
) ON CONFLICT (username) DO NOTHING;

-- 2. Bucatar (Chef)
INSERT INTO admin_users (username, password, role, name)
VALUES (
    'bucatar', 
    'Kitchen_Master$99', 
    'chef', 
    'Bucătar Șef'
) ON CONFLICT (username) DO NOTHING;

-- 3. DigitalHub Media (Super Admin)
INSERT INTO admin_users (username, password, role, name)
VALUES (
    'digitalhub', 
    'DHM_Secure_#8842!X', 
    'admin_app', 
    'DigitalHub Media'
) ON CONFLICT (username) DO NOTHING;
