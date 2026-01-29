
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // Just select one item and print keys
    const { data, error } = await supabase.from('inventory_items').select('*').limit(1);
    if (error) console.error(error);
    else if (data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No data in inventory_items to check columns, trying to insert dummy?");
    }
}
checkSchema();
