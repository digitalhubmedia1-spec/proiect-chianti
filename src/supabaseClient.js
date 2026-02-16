import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail gracefully if env vars are missing to allow ErrorBoundary to show friendly message
let supabaseInstance = null;

try {
    if (supabaseUrl && supabaseKey) {
        supabaseInstance = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
    } else {
        console.warn("Supabase credentials missing. App will likely fail.");
    }
} catch (error) {
    console.error("Supabase initialization failed:", error);
}

export const supabase = supabaseInstance;
