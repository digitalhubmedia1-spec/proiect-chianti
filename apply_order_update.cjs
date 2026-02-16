const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually read .env from parent or grandparent
const pathsToCheck = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env')
];
let envPath = null;
for (const p of pathsToCheck) {
    if (fs.existsSync(p)) {
        envPath = p;
        break;
    }
}
const envConfig = {};

try {
    if (fs.existsSync(envPath)) {
        console.log("Found .env at:", envPath);
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, ...vals] = line.split('=');
            if (key && vals.length > 0) {
                envConfig[key.trim()] = vals.join('=').trim();
            }
        });
    } else {
        console.warn("No .env file found at:", envPath);
    }
} catch (e) {
    console.warn("Error reading .env:", e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
    console.error("Loaded config keys:", Object.keys(envConfig));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
    const sqlPath = path.join(__dirname, 'update_orders_schema.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error("SQL file not found:", sqlPath);
        process.exit(1);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Executing SQL...");
    // Try via rpc 'exec_sql'
    let { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("RPC exec_sql failed:", error.message);
        console.log("Attempting fallback via raw SQL if possible (not possible with standard client).");
    } else {
        console.log("SQL executed successfully via RPC.");
    }
}

runSql();
