const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log("Listing tables...");
    // Using a trick: try to error on a non-existent table to might reveal schema, or just guess common names
    const candidates = ['admins', 'users', 'admin_users', 'profiles', 'staff'];

    for (const table of candidates) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`Table FOUND: ${table}`);
            console.log("Sample:", data);
        } else {
            // console.log(`Table ${table} not found or error: ${error.message}`);
        }
    }
}

listTables();
