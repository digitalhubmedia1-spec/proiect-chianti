-- Fix RLS for product_extras to allow Admin (client-side) management
-- The previous policy required 'authenticated' role, but the Admin panel uses client-side auth,
-- so requests appear as 'anon' to Supabase. This policy opens access to match other admin tables.

ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist (to be safe)
DROP POLICY IF EXISTS "Admin manage extras" ON product_extras;
DROP POLICY IF EXISTS "Public read extras" ON product_extras;

-- Allow ALL operations (select, insert, update, delete) for 'anon' and 'authenticated' roles
-- Note: In a production app with proper backend auth, this should be restricted. 
-- But for this specific client-side admin setup, this is the consistent pattern used.

CREATE POLICY "Enable all operations for extras"
ON product_extras
FOR ALL
USING (true)
WITH CHECK (true);
