-- Add production_gallery column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS production_gallery TEXT[] DEFAULT '{}';

-- Update RLS if necessary (usually public read/write for authenticated users is enough)
-- Assuming existing policies cover "all columns" update if not restricted explicitly.
