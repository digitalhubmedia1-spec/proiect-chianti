const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const orderId = '1772272972183'; // The one from the debug output
    console.log(`Testing update for Order #${orderId}...`);

    // 1. Fetch current items
    const { data: order, error: fetchErr } = await supabase
        .from('orders')
        .select('items')
        .eq('id', orderId)
        .single();

    if (fetchErr) {
        console.error("Fetch failed:", fetchErr);
        return;
    }

    console.log("Current items count:", order.items.length);

    if (order.items.length <= 1) {
        console.log("Adding a dummy item to test update...");
        const dummyItem = { id: 'dummy-test', name: 'Test Product', price: 10, quantity: 1 };
        const updatedItems = [...order.items, dummyItem];
        
        const { data: updatedData, error: updateErr } = await supabase
            .from('orders')
            .update({ items: updatedItems })
            .eq('id', orderId)
            .select();
            
        if (updateErr) {
            console.error("Update failed:", updateErr);
        } else {
            console.log("Update success! New items count in DB:", updatedData[0].items.length);
            
            // Now test deletion
            console.log("Now testing deletion of the dummy item...");
            const afterDeletion = order.items; // Back to original
            const { data: deletedData, error: deleteErr } = await supabase
                .from('orders')
                .update({ items: afterDeletion })
                .eq('id', orderId)
                .select();
            
            if (deleteErr) {
                console.error("Delete failed:", deleteErr);
            } else {
                console.log("Delete success! Final items count in DB:", deletedData[0].items.length);
            }
        }
        return;
    }

    // 2. Remove one item
    const updatedItems = order.items.slice(1);
    console.log("New items count will be:", updatedItems.length);

    // 3. Update
    const { data: updatedData, error: updateErr } = await supabase
        .from('orders')
        .update({ items: updatedItems })
        .eq('id', orderId)
        .select();

    if (updateErr) {
        console.error("Update failed:", updateErr);
    } else {
        console.log("Update success! New items count in DB:", updatedData[0].items.length);
        
        // 4. Verify after a short delay
        setTimeout(async () => {
            const { data: verifyOrder } = await supabase
                .from('orders')
                .select('items')
                .eq('id', orderId)
                .single();
            console.log("Verification after delay - Items count:", verifyOrder.items.length);
        }, 2000);
    }
}

testUpdate();
