const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env');
        if (!fs.existsSync(envPath)) return {};
        const content = fs.readFileSync(envPath, 'utf8');
        return content.split('\n').reduce((acc, line) => {
            const [key, val] = line.split('=');
            if (key && val) acc[key.trim()] = val.trim();
            return acc;
        }, {});
    } catch (e) { return {}; }
}
const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_KEY);

async function checkSchema() {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) console.error(error);
    else if (data.length > 0) console.log("Cols:", Object.keys(data[0]));
    else console.log("Empty table, can't check cols easily.");
}

checkSchema();
