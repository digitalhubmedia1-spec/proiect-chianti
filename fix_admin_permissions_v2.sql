-- 1. Grant explicit permissions to the 'anon' and 'authenticated' roles for the public schema
-- This ensures they can access the table structure
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. Grant table permissions explicitly using public schema
GRANT ALL ON TABLE public.admin_users TO anon;
GRANT ALL ON TABLE public.admin_users TO authenticated;
GRANT ALL ON TABLE public.admin_users TO service_role;

-- 3. Enable RLS on the table (ensure it is enabled)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Drop potentially conflicting policies
DROP POLICY IF EXISTS "Allow full access to admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow public access to admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow insert for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow update for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow delete for all users" ON public.admin_users;

-- 5. Create a comprehensive policy for all operations
CREATE POLICY "Allow full access to admin_users"
ON public.admin_users
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 6. Verify permissions (Optional - for debugging)
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'admin_users';
