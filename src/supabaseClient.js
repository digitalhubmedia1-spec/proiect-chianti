import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Fail gracefully if env vars are missing to allow ErrorBoundary to show friendly message
let supabaseInstance = null;

try {
    if (supabaseUrl && supabaseKey) {
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("Supabase credentials missing. App will likely fail.");
    }
} catch (error) {
    console.error("Supabase initialization failed:", error);
}

export const supabase = supabaseInstance;
