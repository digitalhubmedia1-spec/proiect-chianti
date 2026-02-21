-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to restaurant_tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Allow full access to restaurant_tables for authenticated users" ON public.restaurant_tables;

-- Create a single policy for full public access
-- Since the application manages authentication via RPC/LocalStorage and not Supabase Auth for this part,
-- we need to allow the 'anon' role to perform operations.
CREATE POLICY "Allow full access to restaurant_tables for public"
ON public.restaurant_tables
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Grant permissions explicitly just in case
GRANT ALL ON TABLE public.restaurant_tables TO anon;
GRANT ALL ON TABLE public.restaurant_tables TO authenticated;
GRANT ALL ON TABLE public.restaurant_tables TO service_role;
