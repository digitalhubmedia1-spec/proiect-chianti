const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const FISCAL_OUTPUT_DIR = 'C:\\FiscalNet\\Bonuri';

// --- Load Environment Variables (Manual Parser) ---
function loadEnv() {
    try {
        // Check current directory first (production/deployed)
        let envPath = path.resolve(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            // Check project root (dev)
            envPath = path.resolve(__dirname, '../../.env');
        }
        if (!fs.existsSync(envPath)) return {};
        const content = fs.readFileSync(envPath, 'utf8');
        return content.split('\n').reduce((acc, line) => {
            const [key, val] = line.split('=');
            if (key && val) acc[key.trim()] = val.trim();
            return acc;
        }, {});
    } catch (e) {
        console.error("Error loading .env:", e.message);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY;
// Note: Ideally use SERVICE_ROLE key for server scripts to bypass RLS, 
// but ANON might work if policies allow 'public' read/update on orders.
// If RLS blocks, we might need the user to provide the Service Key in .env as SUPABASE_SERVICE_KEY.

if (!supabaseUrl || !supabaseKey) {
    console.error("[ERROR] Missing Supabase URL or Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Ensure Output Directory ---
if (!fs.existsSync(FISCAL_OUTPUT_DIR)) {
    console.warn(`[WARN] Directory not found: ${FISCAL_OUTPUT_DIR}`);
    try {
        fs.mkdirSync(FISCAL_OUTPUT_DIR, { recursive: true });
    } catch (e) {
        console.error(`[ERROR] Cannot create directory: ${e.message}`);
    }
}

console.log(`[START] Fiscal Bridge Running...`);
console.log(`[INFO] Watching 'orders' table for 'fiscal_print_status = pending'`);
console.log(`[INFO] Output: ${FISCAL_OUTPUT_DIR}`);

// --- Main Listener ---
supabase
    .channel('fiscal-print-channel')
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
            const newRow = payload.new;
            if (!newRow) return;

            // Check if status is pending
            if (newRow.fiscal_print_status === 'pending') {
                console.log(`[NEW ORDER] Order #${newRow.id} requires printing...`);
                await processOrder(newRow);
            }
        }
    )
    .subscribe((status) => {
        console.log(`[STATUS] Subscription status: ${status}`);
    });


async function processOrder(orderFragment) {
    try {
        // Fetch full order data to be safe (ensure we have items)
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderFragment.id)
            .single();

        if (error || !order) {
            console.error(`[ERROR] Could not fetch order ${orderFragment.id}:`, error);
            return;
        }

        // Generate Content
        // Format: Datecs Custom Protocol with ^ separator
        // S^Name^Price^Qty^Unit^Vat^Dept
        // P^Type^Amount

        let content = '';

        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const name = (item.name || 'Produs').replace(/\^/g, ' ').substring(0, 30); // Sanitize ^
                const price = parseFloat(item.price).toFixed(2); // 100.00
                const qty = parseFloat(item.quantity).toFixed(3); // 1.000
                const unit = item.unit || 'buc';
                const vat = item.vat_code || '1'; // Default A=1. Adjust as needed.
                const dept = '1';

                // Command S (Sale)
                content += `S^${name}^${price}^${qty}^${unit}^${vat}^${dept}\r\n`;
            });
        }

        // Payment
        // P^Type^Amount
        // Type: 0=Cash ?, 1=Card ? (Need to verify mapping. User sample was P^1^0 for Card?)
        // Let's assume user sample: P^1^0 = Card Payment of Total.
        // If Cash: P^0^Amount?

        let payType = '0'; // Default Cash
        const method = (order.paymentMethod || order.payment_method || '').toLowerCase();

        if (method.includes('card')) payType = '1';
        else if (method.includes('cash') || method.includes('numerar')) payType = '0';

        // Payment Command
        // P^Type^Amount (0 = full amount)
        content += `P^${payType}^0\r\n`;

        // Generate File
        const filename = `bon_${order.id}_${Date.now()}.inp`; // .inp as requested
        const filePath = path.join(FISCAL_OUTPUT_DIR, filename);

        // Encoding: usually CP1250 or ANSI. Node writes UTF8 by default.
        // If driver needs ANSI, we might need iconv-lite. For now try default.
        fs.writeFileSync(filePath, content);
        console.log(`[PRINTED] Saved to ${filePath}`);

        // Update DB Status
        await supabase
            .from('orders')
            .update({ fiscal_print_status: 'printed' })
            .eq('id', order.id);

        console.log(`[SUCCESS] Order ${order.id} marked as printed.`);

    } catch (err) {
        console.error(`[ERROR] Failed to process order ${orderFragment.id}:`, err);
        // Optionally set status to 'error'
        /* await supabase.from('orders').update({ fiscal_print_status: 'error' }).eq('id', orderFragment.id); */
    }
}
