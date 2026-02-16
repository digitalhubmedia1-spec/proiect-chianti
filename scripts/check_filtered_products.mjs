
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
} else {
    console.error("No .env file found at " + envPath);
}

// Log loaded keys (masked)
console.log("Loaded Supabase URL:", process.env.VITE_SUPABASE_URL ? "YES" : "NO");
console.log("Loaded Supabase Key:", process.env.VITE_SUPABASE_ANON_KEY ? "YES" : "NO");

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    const ids = [1, 4, 3];
    console.log("Checking products: ", ids);

    // Fetch Products
    const { data: products, error: pError } = await supabase
        .from('products')
        .select('*')
        .in('id', ids);

    if (pError) console.error(pError);

    // Fetch Categories
    const { data: categories, error: cError } = await supabase
        .from('categories')
        .select('*');

    if (cError) console.error(cError);

    console.log("\n--- ANALYSIS ---");
    products.forEach(p => {
        const cat = categories.find(c => c.name === p.category);
        const isCatering = cat ? cat.type === 'catering' : false;

        console.log(`Product [${p.id}] "${p.name}":`);
        console.log(`  - Category: ${p.category} (Type: ${cat ? cat.type : 'unknown'})`);
        console.log(`  - Global is_available: ${p.is_available}`);
        console.log(`  - Filter Decision:`);
        if (isCatering) console.log(`    -> HIDDEN by Category Type ('catering')`);
        if (p.is_available === false) console.log(`    -> HIDDEN by Global Availability (false)`);
        if (!isCatering && p.is_available !== false) console.log(`    -> VISIBLE`);
    });
}

checkProducts();
