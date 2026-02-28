const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderColumns() {
    console.log("Checking columns for 'orders' table...");
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
        console.error("Error fetching orders:", error);
    } else if (data && data.length > 0) {
        console.log("Found order columns:", Object.keys(data[0]));
        console.log("ID type:", typeof data[0].id);
        console.log("Items type:", Array.isArray(data[0].items) ? 'Array' : typeof data[0].items);
        console.log("Total type:", typeof data[0].total);
    } else {
        console.log("No orders found.");
    }
}

checkOrderColumns();
