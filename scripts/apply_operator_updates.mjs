
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) envConfig[key.trim()] = val.trim();
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_KEY || envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUpdates() {
    console.log("Applying operator updates...");

    // 1. Update Contabil
    console.log("Updating Contabil...");
    const { error: err1 } = await supabase
        .from('admin_users')
        .update({ role: 'contabil', name: 'Contabil' })
        .eq('username', 'admin_chianti_secure_2026');
    if (err1) console.error("Error updating contabil:", err1);
    else console.log("Contabil updated.");

    // 2. Insert Achizitor
    console.log("Inserting Achizitor...");
    // Check if exists first to avoid duplicate errors if run multiple times
    const { data: existingAchizitor } = await supabase.from('admin_users').select('id').eq('username', 'achizitor').single();
    if (!existingAchizitor) {
        const { error: err2 } = await supabase.from('admin_users').insert([{
            username: 'achizitor',
            password: 'achizitor2026',
            name: 'Achizitor',
            role: 'achizitor'
        }]);
        if (err2) console.error("Error inserting Achizitor:", err2);
        else console.log("Achizitor inserted.");
    } else {
        console.log("Achizitor already exists.");
    }

    // 3. Insert Admin Chianti
    console.log("Inserting Admin Chianti...");
    const { data: existingAdmin } = await supabase.from('admin_users').select('id').eq('username', 'admin_chianti').single();
    if (!existingAdmin) {
        const { error: err3 } = await supabase.from('admin_users').insert([{
            username: 'admin_chianti',
            password: 'chianti_admin_2026!',
            name: 'Administrator Chianti',
            role: 'admin_app'
        }]);
        if (err3) console.error("Error inserting Admin Chianti:", err3);
        else console.log("Admin Chianti inserted.");
    } else {
        console.log("Admin Chianti already exists.");
    }
}

applyUpdates();
