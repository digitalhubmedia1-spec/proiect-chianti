-- Add pricing columns to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS sale_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 19;

-- Refresh schema cache (optional comment, but good practice in Supabase context if needed)
NOTIFY pgrst, 'reload schema';
