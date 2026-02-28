const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
    console.log("Fetching RLS policies for 'orders' table...");
    
    // We can't query pg_policies directly via Supabase client easily without RPC or SQL editor
    // But we can try to find an order and update it.
    
    const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('id, items, status')
        .limit(1);
        
    if (fetchError) {
        console.error("Error fetching orders:", fetchError);
        return;
    }
    
    if (!orders || orders.length === 0) {
        console.log("No orders found to test with.");
        return;
    }
    
    const order = orders[0];
    console.log("Testing update on Order ID:", order.id);
    console.log("Current items count:", order.items ? order.items.length : 0);
    
    if (!order.items || order.items.length === 0) {
        console.log("Order has no items to delete. Can't test deletion persistence.");
        return;
    }
    
    const updatedItems = order.items.slice(0, -1); // Remove last item
    console.log("Attempting to update items to count:", updatedItems.length);
    
    const { data: updatedData, error: updateError } = await supabase
        .from('orders')
        .update({ items: updatedItems })
        .eq('id', order.id)
        .select();
        
    if (updateError) {
        console.error("Update failed with error:", updateError);
    } else if (updatedData && updatedData.length > 0) {
        console.log("Update SUCCESSFUL! Verified with .select()");
        console.log("New items count in DB:", updatedData[0].items.length);
        
        if (updatedData[0].items.length === updatedItems.length) {
            console.log("PERSISTENCE CONFIRMED for anon role.");
        } else {
            console.error("Persistence failed: DB returned different count than sent.");
        }
    } else {
        console.log("Update returned NO DATA and NO ERROR. This usually means RLS is blocking the update (0 rows affected).");
        console.log("This is the likely cause of the issue.");
    }
}

checkRLSPolicies();
