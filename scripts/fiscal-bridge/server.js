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

        // Generate Content (XML Format for FiscalNet)
        let content = '<?xml version="1.0" encoding="UTF-8"?>\n';
        content += '<BonFiscal>\n';
        content += '  <Articole>\n';

        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const name = (item.name || 'Produs').replace(/[<>&"']/g, ' ').substring(0, 150); // Increased from 30 to 150
                const price = parseFloat(item.price).toFixed(2);
                const qty = parseFloat(item.quantity).toFixed(3);
                const vat = item.vat_code || '1'; // Mapping: 1=9%, etc. (Verify with technician)
                const dept = '1';

                content += '    <Articol>\n';
                content += `      <Nume>${name}</Nume>\n`;
                content += `      <Pret>${price}</Pret>\n`;
                content += `      <Cantitate>${qty}</Cantitate>\n`;
                content += `      <CotaTVA>${vat}</CotaTVA>\n`;
                content += `      <Departament>${dept}</Departament>\n`;
                content += '    </Articol>\n';
            });
        }
        content += '  </Articole>\n';

        // Tips (Bacsis)
        const tip = parseFloat(order.tip_amount || 0);
        if (tip > 0) {
            content += '  <Bacsis>\n';
            content += `    <Suma>${tip.toFixed(2)}</Suma>\n`;
            content += '  </Bacsis>\n';
        }

        // Payment
        const method = (order.paymentMethod || order.payment_method || '').toLowerCase();
        let payType = '1'; // Default Numerar
        let payText = 'NUMERAR';

        if (method.includes('card')) {
            payType = '2'; // ID for Card as requested
            payText = 'CARD';
        }

        const totalWithTip = parseFloat(order.final_total || order.total || 0);

        content += '  <Plati>\n';
        content += '    <Plata>\n';
        content += `      <TipPlata>${payType}</TipPlata>\n`;
        content += `      <Suma>${totalWithTip.toFixed(2)}</Suma>\n`;
        content += `      <TextPlata>${payText}</TextPlata>\n`;
        content += '    </Plata>\n';
        content += '  </Plati>\n';
        content += '</BonFiscal>';

        // Generate File
        const filename = `bon_${order.id}_${Date.now()}.xml`; // Use .xml
        const filePath = path.join(FISCAL_OUTPUT_DIR, filename);

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[PRINTED] Saved XML to ${filePath}`);

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
