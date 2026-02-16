-- Fix RLS permissions for Recipe System
-- The Admin Panel uses custom authentication, so database requests might appear as 'anon' (unauthenticated) to Supabase.
-- We need to allow public access to these tables so the Admin Panel can write to them.

-- 1. Defined Recipes (Header)
ALTER TABLE defined_recipes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Defined Recipes Full Access" ON defined_recipes;
DROP POLICY IF EXISTS "Enable all for authenticated" ON defined_recipes;

-- Create a permissive policy (Public)
CREATE POLICY "Public Full Access" ON defined_recipes
    FOR ALL
    USING (true)
    WITH CHECK (true);

ALTER TABLE defined_recipes ENABLE ROW LEVEL SECURITY;

-- 2. Recipes (Ingredients)
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recipes Full Access" ON recipes;
DROP POLICY IF EXISTS "Enable all for authenticated" ON recipes;

CREATE POLICY "Public Full Access" ON recipes
    FOR ALL
    USING (true)
    WITH CHECK (true);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 3. Reload Config
NOTIFY pgrst, 'reload config';
