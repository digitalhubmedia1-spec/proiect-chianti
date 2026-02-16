
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('procurement_lists').select('*').limit(1);

    if (error) {
        // If error is about column missing, select might fail if * tries all. 
        // But usually it returns data with keys.
        console.error(error);
        return;
    }

    if (data.length > 0) {
        console.log("Procurement Lists Columns:", Object.keys(data[0]));
    } else {
        console.log("No data in procurement_lists.");
        // Try insert to see allowed columns? No, dangerous.
    }
}
checkSchema();
