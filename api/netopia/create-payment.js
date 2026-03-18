import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    NETOPIA_SIGNATURE_KEY,
    NETOPIA_PRIVATE_KEY,
    NETOPIA_PUBLIC_CERT
} = process.env;

// Helper to fix PEM formatting from env vars (removes garbage and rebuilds standard PEM)
const fixPEM = (key, type) => {
    if (!key) return key;
    // Clean all whitespace, literal \n, and existing headers/footers
    const base64 = key
        .replace(/\\n/g, '')
        .replace(/---[^-]+---/g, '')
        .replace(/[^A-Za-z0-9+/=]/g, '') // Keep ONLY base64 chars
        .replace(/^["']|["']$/g, '');
    
    // Rebuild with standard 64-char lines
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
};

export default async function handler(req, res) {
    let supabase;
    try {
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
            supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        }
    } catch (e) {
        console.error("Supabase init error:", e);
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 0. Validate Environment Variables
    const missingVars = [];
    if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
    if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!NETOPIA_SIGNATURE_KEY) missingVars.push('NETOPIA_SIGNATURE_KEY');
    if (!NETOPIA_PRIVATE_KEY) missingVars.push('NETOPIA_PRIVATE_KEY');
    if (!NETOPIA_PUBLIC_CERT) missingVars.push('NETOPIA_PUBLIC_CERT');

    if (missingVars.length > 0) {
        console.error('Missing Environment Variables:', missingVars);
        return res.status(500).json({ 
            error: 'Server configuration error (missing variables)', 
            details: missingVars 
        });
    }

    try {
        const { orderId, amount, customer, items, returnUrl, confirmUrl } = req.body;

        if (!orderId || !amount || !customer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Construct Netopia XML
        // Note: For real production, use an XML builder. Here we use a safe template.
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const description = `Comanda #${orderId} - Casa Chianti`;

        const xml = `<?xml version="1.0" encoding="utf-8"?>
<mobilpay>
    <order type="card" id="${orderId}" timestamp="${timestamp}">
        <signature>${NETOPIA_SIGNATURE_KEY}</signature>
        <url>
            <return>${returnUrl}</return>
            <confirm>${confirmUrl}</confirm>
        </url>
        <invoice currency="RON" amount="${amount.toFixed(2)}">
            <details>${escapeXml(description)}</details>
            <contact_info>
                <first_name>${escapeXml(customer.firstName)}</first_name>
                <last_name>${escapeXml(customer.lastName)}</last_name>
                <phone>${escapeXml(customer.phone)}</phone>
                <email>${escapeXml(customer.email)}</email>
                <address>${escapeXml(customer.address || '-')}</address>
                <city>${escapeXml(customer.city || '-')}</city>
            </contact_info>
        </invoice>
    </order>
</mobilpay>`;

        // 2. Encryption Logic (Reverting to AES-128 for legacy endpoint)
        const aesKey = crypto.randomBytes(16);
        const iv = Buffer.alloc(16, 0);

        // Encrypt XML with AES-128-CBC
        const cipher = crypto.createCipheriv('aes-128-cbc', aesKey, iv);
        let encryptedData = cipher.update(xml, 'utf8', 'base64');
        encryptedData += cipher.final('base64');

        // 4. Encrypt AES Key using Netopia Public Cert
        const envKey = crypto.publicEncrypt({
            key: fixPEM(NETOPIA_PUBLIC_CERT, 'CERTIFICATE'),
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, aesKey).toString('base64');

        const data = encryptedData;

        return res.status(200).json({
            status: 'success',
            envKey,
            data,
            url: 'https://sandbox.netopia-payments.com/payment/card/start'
        });

    } catch (error) {
        console.error('Netopia Create Payment Error:', error);
        return res.status(500).json({ 
            error: error.message,
            debug: {
                certLen: NETOPIA_PUBLIC_CERT?.length,
                keyLen: NETOPIA_PRIVATE_KEY?.length
            }
        });
    }
}

function escapeXml(unsafe) {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}
