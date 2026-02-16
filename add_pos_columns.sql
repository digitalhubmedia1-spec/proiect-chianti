-- Add POS related columns to orders table

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_number TEXT,
ADD COLUMN IF NOT EXISTS fiscal_print_status TEXT DEFAULT 'none', 
ADD COLUMN IF NOT EXISTS is_pos_order BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pos_operator_id TEXT;

-- fiscal_print_status values: 'none', 'pending', 'printed', 'error'
-- pos_operator_id: to track which waiter placed the order (linked to admin_users maybe, but loose link is safer)

COMMENT ON COLUMN orders.table_number IS 'Number/Name of the restaurant table';
COMMENT ON COLUMN orders.fiscal_print_status IS 'Status of fiscal receipt printing: none, pending, printed, error';
