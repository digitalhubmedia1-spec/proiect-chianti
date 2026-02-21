-- 1. IMPORTANT: Grant table permissions to the 'anon' and 'authenticated' roles
-- RLS policies only work if the role has basic privileges on the table first.
GRANT ALL ON TABLE admin_users TO anon;
GRANT ALL ON TABLE admin_users TO authenticated;
GRANT ALL ON TABLE admin_users TO service_role;

-- 2. Enable RLS on the table (ensure it is enabled)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Drop the specific policy if it exists (Fixes ERROR: 42710)
DROP POLICY IF EXISTS "Allow full access to admin_users" ON admin_users;

-- 4. Drop other potential legacy policies to clean up
DROP POLICY IF EXISTS "Allow public access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow read access for all users" ON admin_users;
DROP POLICY IF EXISTS "Allow insert for all users" ON admin_users;
DROP POLICY IF EXISTS "Allow update for all users" ON admin_users;
DROP POLICY IF EXISTS "Allow delete for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for all users" ON admin_users;

-- 5. Create a comprehensive policy for all operations (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow full access to admin_users"
ON admin_users
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verify the change
-- SELECT * FROM pg_policies WHERE tablename = 'admin_users';
