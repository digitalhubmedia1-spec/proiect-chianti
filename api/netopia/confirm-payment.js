import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    NETOPIA_PRIVATE_KEY
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    try {
        // Netopia sends env_key and data via POST
        const { env_key, data } = req.body;

        if (!env_key || !data) {
            return res.status(400).send('Missing keys');
        }

        // 1. Decrypt AES Key using Merchant Private Key
        const encryptedKey = Buffer.from(env_key, 'base64');
        const aesKey = crypto.privateDecrypt({
            key: NETOPIA_PRIVATE_KEY,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, encryptedKey);

        // 2. Decrypt Data using AES Key
        const iv = Buffer.alloc(16, 0); // Fixed zero IV
        const encryptedData = Buffer.from(data, 'base64');
        const decipher = crypto.createDecipheriv('aes-128-cbc', aesKey, iv);
        let decryptedXml = decipher.update(encryptedData, 'base64', 'utf8');
        decryptedXml += decipher.final('utf8');

        // 3. Parse XML (Simple parsing for status and order id)
        const orderIdMatch = decryptedXml.match(/id="([^"]+)"/);
        const actionMatch = decryptedXml.match(/<action>([^<]+)<\/action>/);
        const errorCodeMatch = decryptedXml.match(/<error code="([^"]+)"/);
        const errorMessageMatch = decryptedXml.match(/<error[^>]*>([^<]+)<\/error>/);

        const orderId = orderIdMatch ? orderIdMatch[1] : null;
        const action = actionMatch ? actionMatch[1] : null;
        const errorCode = errorCodeMatch ? errorCodeMatch[1] : '0';
        const errorMessage = errorMessageMatch ? errorMessageMatch[1] : '';

        if (!orderId) {
            console.error('Order ID not found in XML:', decryptedXml);
            return res.status(400).send('Invalid XML');
        }

        // 4. Update Order Status in Supabase
        let status = 'failed';
        let adminDetails = `Netopia Error: ${errorMessage} (Code: ${errorCode})`;

        if (action === 'confirmed' || action === 'confirmed_pending') {
            status = 'completed'; // Or a specific 'paid' status if you have one
            adminDetails = `Plată Netopia Confirmată (Action: ${action})`;
        }

        const { error } = await supabase
            .from('orders')
            .update({ 
                status: status,
                internal_instructions: adminDetails // Or another field for logs
            })
            .eq('id', orderId);

        if (error) throw error;

        // 5. Respond to Netopia with Acknowledgement XML
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(`<?xml version="1.0" encoding="utf-8"?>
<crc error_code="${errorCode}">${errorMessage || 'Success'}</crc>`);

    } catch (error) {
        console.error('Netopia Confirm Error:', error);
        return res.status(500).send(error.message);
    }
}
