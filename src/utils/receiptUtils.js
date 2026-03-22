/**
 * FiscalNet INP Generation Utility
 * Standardizes the text format for Romanian fiscal printers.
 */

/**
 * Generates the content for a .inp file
 * @param {Array} items - Array of objects with name, price, and qty/quantity
 * @param {string|Object} paymentData - 'cash', 'card', or { cash: number, card: number }
 * @returns {string} INP file content
 */
export const generateFiscalINP = (items, paymentData) => {
    let content = '';
    
    items.forEach(item => {
        const price = parseFloat(item.price).toFixed(2);
        const qty = (parseFloat(item.quantity) || parseFloat(item.qty) || 0).toFixed(3);
        
        let name = item.name || '';
        // Remove emojis
        name = name.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
        // Normalize diacritics
        name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Clean special characters
        name = name.replace(/[;]/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (name.length > 30) name = name.substring(0, 30);

        // S,1,______,_,__;NAME;PRICE;QTY;VAT_INDEX;DEPT;1;0;0; (VAT Index 1 = 9% / Standard Food)
        content += `S,1,______,_,__;${name};${price};${qty};1;1;1;0;0;\n`;
    });

    if (typeof paymentData === 'string') {
        const payCode = paymentData === 'cash' ? '0' : '1';
        const totalAmount = items.reduce((sum, i) => {
            const iQty = parseFloat(i.quantity) || parseFloat(i.qty) || 0;
            return sum + (parseFloat(i.price) * iQty);
        }, 0);
        // T,1,______,_,__;PAY_INDEX;TOTAL;;;;;
        content += `T,1,______,_,__;${payCode};${totalAmount.toFixed(2)};;;;;\n`;
    } else {
        // Mixed payment
        const cashVal = parseFloat(paymentData.cash) || 0;
        const cardVal = parseFloat(paymentData.card) || 0;
        
        if (cashVal > 0) {
            content += `T,1,______,_,__;0;${cashVal.toFixed(2)};;;;;\n`;
        }
        if (cardVal > 0) {
            content += `T,1,______,_,__;1;${cardVal.toFixed(2)};;;;;\n`;
        }
    }

    return content;
};

/**
 * Triggers a browser download for the .inp file
 * @param {string} content - INP content
 * @param {string} identifier - Table name or Order ID
 */
export const downloadINPFile = (content, identifier) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().getTime();
    const safeId = String(identifier).replace(/\s+/g, '_');
    a.download = `bon_${safeId}_${timestamp}.inp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};
