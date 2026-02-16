import { supabase } from '../supabaseClient';

export const logAction = async (action, details = '') => {
    try {
        const name = localStorage.getItem('admin_name') || 'Unknown';
        const role = localStorage.getItem('admin_role') || 'unknown';

        if (!supabase) return;

        await supabase.from('admin_logs').insert([{
            admin_name: name,
            admin_role: role,
            action: action,
            details: details,
            created_at: new Date().toISOString()
        }]);
    } catch (error) {
        console.error("Failed to log action:", error);
        // Don't block the app if logging fails
    }
};
