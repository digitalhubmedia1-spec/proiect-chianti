const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcsImV4cCI6MjA4MzY0NzExMjcxNzY4MDcxMTI3LCJleHAiOjIwODM2NDcxMjd9.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmins() {
    console.log("Checking 'admins' table...");
    const { data, error } = await supabase.from('admins').select('*').limit(1);

    if (error) {
        console.error("Error accessing admins table:", error.message);
    } else {
        console.log("Found admins table. Row sample:", data);
    }
}

checkAdmins();
