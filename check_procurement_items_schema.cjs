
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('procurement_items').select('*').limit(1);

    if (error) {
        console.error(error);
        return;
    }

    if (data.length > 0) {
        console.log("Procurement Items Columns:", Object.keys(data[0]));
    } else {
        console.log("No data in procurement_items.");
        // If empty, I'll assume 'quantity' is the safe bet, but ideally I see the error.
        // Actually, if data is empty, I can't see keys. 
        // I will try to insert a dummy row to fail and see valid columns? No, too noisy.
        // I'll trust standard naming 'quantity' if empty.
    }
}
checkSchema();
