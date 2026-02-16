-- 1. Extrage lista completă a conturilor de operatori (din tabela custom admin_users)
-- Această interogare returnează ID-ul, numele, username-ul, rolul și parola (care este stocată în clar)
SELECT 
    id,
    name as nume,
    username,
    role as rol,
    password as parola_curenta,
    created_at as data_creare
FROM 
    admin_users
ORDER BY 
    created_at DESC;

-- 2. Verifică activitatea recentă a operatorilor (din tabela admin_logs)
-- Aceasta arată ultimele acțiuni efectuate de fiecare administrator/operator
SELECT 
    admin_name,
    admin_role,
    action,
    details,
    created_at
FROM 
    admin_logs
WHERE 
    created_at > NOW() - INTERVAL '30 days'
ORDER BY 
    created_at DESC;

-- 3. (Opțional) Resetare parolă pentru un utilizator specific
-- Înlocuiește 'username_aici' cu username-ul dorit și 'noua_parola' cu noua parolă
-- UPDATE admin_users 
-- SET password = 'noua_parola' 
-- WHERE username = 'username_aici';
