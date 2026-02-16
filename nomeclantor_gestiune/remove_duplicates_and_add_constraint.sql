-- 1. Remove duplicates, keeping the one with the smallest ID
DELETE FROM inventory_items
WHERE id NOT IN (
    SELECT MIN(id)
    FROM inventory_items
    GROUP BY name
);

-- 2. Now safe to add the unique constraint
ALTER TABLE inventory_items
ADD CONSTRAINT inventory_items_name_key UNIQUE (name);
