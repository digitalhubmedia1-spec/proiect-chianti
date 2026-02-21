-- 1. Drop existing check constraint
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- 2. Add new check constraint including 'ospatar'
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
CHECK (role IN ('admin_app', 'operator', 'chef', 'contabil', 'achizitor', 'gestionar', 'cost_productie', 'ospatar'));

-- 3. Insert 'ospatar' user
INSERT INTO admin_users (username, password, role, name)
VALUES (
    'ospatar', 
    'ospatar1234', 
    'ospatar', 
    'Ospătar Principal'
) ON CONFLICT (username) DO NOTHING;
