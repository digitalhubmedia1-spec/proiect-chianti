-- Fix RLS Policies for Recipes
-- The error "column recipes.product_id does not exist" suggests a Policy or Trigger is still trying to reference the dropped column.

-- 1. Reset Policies on 'recipes'
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated" ON recipes;
DROP POLICY IF EXISTS "Enable read access for all" ON recipes;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON recipes;
DROP POLICY IF EXISTS "Enable update for authenticated" ON recipes;
DROP POLICY IF EXISTS "Enable delete for authenticated" ON recipes;
DROP POLICY IF EXISTS "Recipes Full Access" ON recipes;

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipes Full Access" ON recipes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 2. Reset Policies on 'defined_recipes' (just in case)
ALTER TABLE defined_recipes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON defined_recipes;
DROP POLICY IF EXISTS "Defined Recipes Full Access" ON defined_recipes;

ALTER TABLE defined_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Defined Recipes Full Access" ON defined_recipes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
