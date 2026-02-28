const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSStatus() {
    console.log("Checking RLS status for 'orders' table...");
    
    // Attempt an update that should fail if RLS is on and no policy exists
    // We'll use a non-existent ID to be safe, or just check the response
    const { error } = await supabase
        .from('orders')
        .update({ status: 'pending' })
        .eq('id', 'non-existent-id');
    
    if (error) {
        console.log("Update attempt returned error:", error.code, error.message);
        // Error code 42501 is usually permission denied (RLS)
    } else {
        console.log("Update attempt succeeded (0 rows affected, but no permission error).");
    }
}

checkRLSStatus();
