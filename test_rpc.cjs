const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log("Testing exec_sql RPC...");
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });

    if (error) {
        console.error("RPC Failed:", error.message);
        // Try another common name?
        const { data: d2, error: e2 } = await supabase.rpc('run_sql', { sql: 'SELECT 1' });
        if (e2) console.error("RPC run_sql Failed:", e2.message);
        else console.log("RPC run_sql Success!");
    } else {
        console.log("RPC exec_sql Success!");
    }
}

testRpc();
