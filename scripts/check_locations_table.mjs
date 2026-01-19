
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocations() {
    console.log("Checking `locations` table...");
    const { data: locations, error } = await supabase.from('locations').select('*');

    if (error) {
        console.error("❌ Error accessing `locations` table:", error.message);
        console.log("Table likely does not exist.");
    } else {
        console.log("✅ `locations` table exists.");
        console.log("Data:", locations);
    }
}

checkLocations();
