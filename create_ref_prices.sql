CREATE TABLE IF NOT EXISTS recipe_ref_prices (
    ingredient_id BIGINT PRIMARY KEY REFERENCES inventory_items(id) ON DELETE CASCADE,
    price_per_unit DECIMAL(10, 2) DEFAULT 0
);
