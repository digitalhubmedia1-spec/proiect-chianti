const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'produse_full.txt');
const content = fs.readFileSync(inputFile, 'utf-8');

const lines = content.split('\n');

let currentCategory = 'Materii Prime'; // Default fallback
let sql = '';

const validCategories = {
    'Preparate Carne Porc': 'Materii Prime',
    'Pește proaspăt': 'Materii Prime',
    'Pește congelat': 'Materii Prime',
    'Fructe de mare': 'Materii Prime',
    'Mezeluri (din pește)': 'Materii Prime',
    'Produse afumate (din pește)': 'Materii Prime',
    'Lactate & Ouă': 'Materii Prime',
    'Lapte': 'Materii Prime',
    'Smântână': 'Materii Prime',
    'Unt': 'Materii Prime',
    'Brânzeturi maturate': 'Materii Prime',
    'Brânzeturi proaspete': 'Materii Prime',
    'Cașcaval': 'Materii Prime',
    'Iaurt': 'Materii Prime',
    'Frișcă': 'Materii Prime',
    'Ouă': 'Materii Prime',
    'Fructe': 'Materii Prime',
    'Fructe proaspete': 'Materii Prime',
    'Fructe congelate': 'Materii Prime',
    'Fructe uscate': 'Materii Prime',
    'Citrice': 'Materii Prime',
    'Fructe de pădure': 'Materii Prime',
    'Cereale & Panificație': 'Materii Prime',
    'Făină': 'Materii Prime',
    'Mălai': 'Materii Prime',
    'Orez': 'Materii Prime',
    'Paste': 'Materii Prime',
    'Pâine': 'Materii Prime',
    'Pesmet': 'Materii Prime',
    'Aluat': 'Materii Prime',
    'Produse de patiserie': 'Materii Prime',
    'Conserve & Produse procesate': 'Materii Prime',
    'Conserve legume': 'Materii Prime',
    'Conserve pește': 'Materii Prime',
    'Sosuri gata preparate': 'Materii Prime',
    'Murături': 'Materii Prime',
    'Semipreparate': 'Materii Prime',
    'Creme și piureuri': 'Materii Prime',
    'Condimente & Arome': 'Materii Prime',
    'Sare': 'Materii Prime',
    'Piper': 'Materii Prime',
    'Boia': 'Materii Prime',
    'Ierburi uscate': 'Materii Prime',
    'Mixuri de condimente': 'Materii Prime',
    'Condimente exotice': 'Materii Prime',
    'Semințe': 'Materii Prime',
    'Uleiuri & Grăsimi': 'Materii Prime',
    'Zahăr & Îndulcitori': 'Materii Prime',
    'Sosuri & Dressinguri': 'Materii Prime',
    'Produse congelate': 'Materii Prime',
    'Carne congelată': 'Materii Prime',
    'Legume congelate': 'Materii Prime',
    'Produse patiserie congelate': 'Materii Prime',
    'Deserturi congelate': 'Materii Prime',
    'Nuci, Semințe & Diverse': 'Materii Prime',
    'Produse pentru Desert': 'Materii Prime',
    'Carne de pasăre — Semipreparate': 'Materii Prime',
    'Mezeluri (carne de pasăre)': 'Materii Prime',
    'Produse afumate / gata de servit (carne de pasăre)': 'Materii Prime',
    'Carne de vită — Semipreparate / Ready-to-cook': 'Materii Prime',
    'Mezeluri (carne de vită)': 'Materii Prime',
    'Produse afumate / gata de servit (carne de vită)': 'Materii Prime',
    'Carne de miel — Semipreparate / Ready-to-cook': 'Materii Prime',
    'Carne de miel — Produse afumate / gata de servit': 'Materii Prime',
    'Carne de vânat — Semipreparate / Ready-to-cook': 'Materii Prime',
    'Carne de vânat — Mezeluri / produse procesate': 'Materii Prime',
    'Mezeluri mix': 'Materii Prime',
    'Produse afumate mix': 'Materii Prime'
};

lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    // Detect Categories
    if (validCategories[line] || (!line.includes('\t') && !line.includes('  ') && line.length > 3)) {
        // It's likely a header
        // For this specific file structure, categories are mostly 'Materii Prime' unless specified otherwise.
        // We will assume everything is 'Materii Prime' based on the file content which is food ingredients.
        // But let's skip "Denumire produs..." headers
        if (line.startsWith('Denumire produs')) return;
        return;
    }

    if (line.startsWith('Denumire produs')) return;

    // Parse Row
    // Split by tab or multiple spaces
    const parts = line.split(/\t+/);

    if (parts.length >= 2) {
        let name = parts[0].trim().replace(/'/g, "''"); // Escape single quotes
        let unit = parts[1].trim().toLowerCase();
        let alertStock = parts[2] ? parseFloat(parts[2].trim()) : 5;

        // Cleanup Unit
        if (unit.startsWith('kg')) unit = 'kg';

        if (name && unit) {
            sql += `INSERT INTO inventory_items (name, category, unit, min_stock_alert, is_asset) VALUES ('${name}', 'Materii Prime', '${unit}', ${alertStock}, false) ON CONFLICT (name) DO NOTHING;\n`;
        }
    }
});

console.log(sql);
