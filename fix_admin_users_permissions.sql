-- Enable RLS on the table (ensure it is enabled)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop the specific policy if it exists (Fixes ERROR: 42710)
DROP POLICY IF EXISTS "Allow full access to admin_users" ON admin_users;

-- Drop other potential legacy policies to clean up
DROP POLICY IF EXISTS "Allow public access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow read access for all users" ON admin_users;
DROP POLICY IF EXISTS "Allow insert for all users" ON admin_users;
DROP POLICY IF EXISTS "Allow update for all users" ON admin_users;
DROP POLICY IF EXISTS "Allow delete for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for all users" ON admin_users;

-- Create a comprehensive policy for all operations (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow full access to admin_users"
ON admin_users
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verify the change
-- SELECT * FROM pg_policies WHERE tablename = 'admin_users';
