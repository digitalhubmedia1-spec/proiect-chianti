const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("Checking last 5 orders...");
    const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, items, final_total, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (ordersErr) {
        console.error("Error fetching orders:", ordersErr);
    } else {
        console.log("Last 5 orders:", JSON.stringify(orders, null, 2));
    }

    console.log("\nChecking last 5 admin logs...");
    const { data: logs, error: logsErr } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (logsErr) {
        console.error("Error fetching logs:", logsErr);
    } else {
        console.log("Last 5 logs:", JSON.stringify(logs, null, 2));
    }
}

debug();
