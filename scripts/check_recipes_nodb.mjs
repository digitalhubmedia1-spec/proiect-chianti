
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

async function checkRecipesTable() {
    console.log("Checking `recipes` table structure...");

    // Attempt to select one row to infer structure
    const { data, error } = await supabase.from('recipes').select('*').limit(1);

    if (error) {
        console.error("Error fetching recipes:", error);
    } else {
        console.log("Recipes table sample row:", data);
        if (data && data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        } else {
            console.log("Table exists but is empty.");
        }
    }
}

checkRecipesTable();
