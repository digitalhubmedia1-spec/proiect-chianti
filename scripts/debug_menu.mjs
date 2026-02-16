
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMenu() {
    console.log("Checking daily_menu_items...");
    const { data, error } = await supabase
        .from('daily_menu_items')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} entries.`);
    const grouped = {};
    data.forEach(item => {
        if (!grouped[item.date]) grouped[item.date] = [];
        grouped[item.date].push(item);
    });

    Object.keys(grouped).forEach(date => {
        console.log(`Date: ${date} - ${grouped[date].length} items`);
        grouped[date].forEach(i => {
            console.log(`  - Product ID: ${i.product_id}, Stock: ${i.stock}`);
        });
    });
}

checkMenu();
