const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log("Checking RLS policies and permissions for 'orders' table...");
    
    // We can't directly query pg_policies without higher privileges usually, 
    // but we can try to see if we can update a field and if it sticks.
    // The test_order_update.cjs already proved we can update.
    
    // Let's try to fetch the actual policies using a RPC if available or just check what we can.
    // Since I don't have an admin key here, I'll rely on the behavior.
    
    // If the user says it "reappears on refresh", it means the update didn't actually persist 
    // OR something else is overwriting it.
    
    const { data, error } = await supabase.rpc('get_policies'); // unlikely to exist
    if (error) {
        console.log("RPC get_policies failed (expected). Error:", error.message);
    } else {
        console.log("Policies:", data);
    }

    // Check if we can see the table structure and triggers
    const { data: tableInfo, error: tableError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
    
    if (tableError) {
        console.error("Error accessing orders table:", tableError);
    } else {
        console.log("Successfully accessed orders table. Row count:", tableInfo.length);
    }
}

checkRLS();
