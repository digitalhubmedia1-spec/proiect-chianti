
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

async function checkIdTypes() {
    console.log("Checking ID types...");

    // Check inventory_items
    const { data: items, error: err1 } = await supabase.from('inventory_items').select('id').limit(1);
    if (items && items.length > 0) {
        console.log("inventory_items ID sample:", items[0].id, "Type:", typeof items[0].id);
    } else {
        console.log("inventory_items empty, assuming bigint from error message.");
    }

    // Check suppliers
    const { data: suppliers, error: err2 } = await supabase.from('suppliers').select('id').limit(1);
    if (suppliers && suppliers.length > 0) {
        console.log("suppliers ID sample:", suppliers[0].id, "Type:", typeof suppliers[0].id);
    } else {
        console.log("suppliers empty, likely bigint too.");
    }
}

checkIdTypes();
