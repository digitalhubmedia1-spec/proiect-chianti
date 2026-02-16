-- Add unique constraint to inventory_items name column
-- This is required for ON CONFLICT (name) DO NOTHING to work
ALTER TABLE inventory_items
ADD CONSTRAINT inventory_items_name_key UNIQUE (name);
