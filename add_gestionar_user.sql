-- 1. Drop existing check constraint if it impedes new role
-- Only if the simplified constraint name was used, otherwise we recreate it.
-- Let's try to add the new constraint. We first drop the likely constraint name.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_role_check') THEN
        ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check;
    END IF;
END $$;

-- 2. Add updated constraint
ALTER TABLE admin_users
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN ('admin_app', 'operator', 'chef', 'contabil', 'achizitor', 'cost_productie', 'gestionar'));

-- 3. Insert new user
INSERT INTO admin_users (username, password, role, name)
VALUES (
    'gestionar',
    'Gestionar#2026', -- Password to provide to user
    'gestionar',
    'Gestionar Depozit'
) ON CONFLICT (username) DO UPDATE SET 
    role = EXCLUDED.role, -- Update role if exists but maybe limited
    password = EXCLUDED.password;
