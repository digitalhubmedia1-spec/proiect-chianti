
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) envConfig[key.trim()] = val.trim();
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_KEY || envConfig.VITE_SUPABASE_ANON_KEY;
// The file shows VITE_SUPABASE_KEY, but previous code might have used ANON_KEY. Using fallback.

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking `categories` table columns...");

    // Try to select the new columns
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, parent_id, is_visible')
        .limit(1);

    if (error) {
        console.error("❌ Error selecting new columns:", error.message);
        console.log("It seems the database migration `update_categories.sql` was NOT executed correctly.");
    } else {
        console.log("✅ Columns `parent_id` and `is_visible` exist!");
        console.log("Sample Data:", data);
    }
}

checkSchema();
