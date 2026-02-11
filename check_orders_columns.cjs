const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        if (!fs.existsSync(envPath)) return {};
        return fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
            const [key, val] = line.split('=');
            if (key && val) acc[key.trim()] = val.trim();
            return acc;
        }, {});
    } catch (e) { return {}; }
}
const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    // We can't query information_schema easily with js client sometimes without rpc, 
    // but we can just fetch one row and see keys.
    const { data, error } = await supabase.from('orders').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        if (data.length > 0) {
            console.log("Existing Columns:", Object.keys(data[0]));
        } else {
            console.log("Table allows access but is empty. Cannot determine columns easily via row.");
        }
    }
}

checkSchema();
