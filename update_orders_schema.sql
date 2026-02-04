-- Add order_number column as SERIAL (auto-incrementing integer)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- Restart the sequence to start from 100
-- Note: 'orders_order_number_seq' is the default name for specific serial column. 
-- In PostgreSQL, SERIAL creates a sequence named table_name_column_name_seq.
-- We check if it exists first to avoid errors, or just run restart.
ALTER SEQUENCE orders_order_number_seq RESTART WITH 100;

-- Add user_id column to reference auth.users
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Optional: Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
