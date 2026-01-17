-- Add the specific secure operator account requested
INSERT INTO admin_users (username, password, role, name)
VALUES (
    'admin_chianti_secure_2026', 
    'Xy9#mP2$Lk@8qR5!zVw4', 
    'operator', 
    'Operator Securizat'
) ON CONFLICT (username) DO NOTHING;
