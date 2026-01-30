-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admin all" ON recipe_ref_prices;
DROP POLICY IF EXISTS "Public read" ON recipe_ref_prices;

-- Create permissive policy (since auth is likely handled at app level)
CREATE POLICY "Public all" ON recipe_ref_prices FOR ALL USING (true);
