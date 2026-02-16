ALTER TABLE recipe_ref_prices ADD COLUMN IF NOT EXISTS vat_rate INTEGER DEFAULT 9;
-- Or use DECIMAL if they want non-integer VAT, but usually it's 9, 11, 19, 21. User asked for 11 and 21.
