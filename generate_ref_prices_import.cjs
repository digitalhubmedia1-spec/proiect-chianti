const fs = require('fs');
const path = require('path');

const csvPath = '/home/lupum/Desktop/Chianti/proiect/preturi_ingrediente_normalizate_11-02-2026.csv';
const outputPath = '/home/lupum/Desktop/Chianti/proiect/import_ref_prices.sql';

try {
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split('\n').filter(l => l.trim() !== '');

    // Header: Ingredient,UM,Preț FĂRĂ TVA,TVA %,Preț CU TVA,Actualizat,Furnizor
    // Indices: 0, 1, 2, 3, 4, 5, 6

    let sql = `
-- Script to import reference prices from CSV
-- Generated automatically based on user request

-- 1. Create a temporary table for staging
CREATE TEMP TABLE staging_ref_prices (
    ingredient_name TEXT,
    price_no_vat NUMERIC,
    vat_percent NUMERIC,
    supplier_name TEXT,
    updated_at DATE
);

INSERT INTO staging_ref_prices (ingredient_name, price_no_vat, vat_percent, supplier_name, updated_at) VALUES
`;

    const values = [];
    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split (assuming no commas in fields like "21,49 RON" -> needs care)
        // The file seems to use comma delimiter.
        // Let's check a line: "Dulceata de mure,kg,21.49 RON,21%,26.00 RON,2026-02-11,Lidl"
        // Yes, comma separated. Amounts use dot decimal.

        const cols = line.split(',');
        if (cols.length < 7) continue;

        const name = cols[0].trim().replace(/'/g, "''"); // Escape single quotes
        const priceStr = cols[2].replace(' RON', '').trim();
        const vatStr = cols[3].replace('%', '').trim();
        const supplier = cols[6].trim().replace(/'/g, "''");
        const date = cols[5].trim();

        if (!name) continue;

        values.push(`('${name}', ${priceStr}, ${vatStr}, '${supplier}', '${date}')`);
    }

    sql += values.join(',\n') + ';\n\n';

    sql += `
-- 2. Ensure Suppliers Exist
INSERT INTO suppliers (name)
SELECT DISTINCT supplier_name 
FROM staging_ref_prices 
WHERE supplier_name NOT IN (SELECT name FROM suppliers);

-- 3. Insert/Update Reference Prices
-- We match ingredients by Name (Case Insensitive)
-- We ignore the CSV Unit, using the database one implicitly (since we just link to inventory_items id)

INSERT INTO recipe_ref_prices (ingredient_id, price_per_unit, vat_rate, supplier_id, updated_at)
SELECT DISTINCT ON (ii.id)
    ii.id,
    srp.price_no_vat,
    srp.vat_percent,
    sup.id,
    srp.updated_at::timestamptz
FROM staging_ref_prices srp
JOIN inventory_items ii ON LOWER(ii.name) = LOWER(srp.ingredient_name)
LEFT JOIN suppliers sup ON sup.name = srp.supplier_name
ON CONFLICT (ingredient_id) 
DO UPDATE SET
    price_per_unit = EXCLUDED.price_per_unit,
    vat_rate = EXCLUDED.vat_rate,
    supplier_id = EXCLUDED.supplier_id,
    updated_at = EXCLUDED.updated_at;

-- 4. Cleanup
DROP TABLE staging_ref_prices;

-- Output results
DO $$
DECLARE
    updated_count INT;
BEGIN
    SELECT COUNT(*) INTO updated_count FROM recipe_ref_prices WHERE updated_at >= NOW() - INTERVAL '1 minute';
    RAISE NOTICE 'Imported/Updated % reference prices.', updated_count;
END $$;
`;

    fs.writeFileSync(outputPath, sql);
    console.log(`Successfully generated SQL script at ${outputPath}`);
    console.log(`Processed ${values.length} rows.`);

} catch (err) {
    console.error('Error generating script:', err);
}
