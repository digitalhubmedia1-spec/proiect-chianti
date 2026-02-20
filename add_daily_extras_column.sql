-- Adaugă coloană pentru a stoca ID-urile produselor extra specifice unei intrări din meniul zilnic
ALTER TABLE daily_menu_items 
ADD COLUMN IF NOT EXISTS specific_extras_ids jsonb DEFAULT null;

-- Comentariu explicativ
COMMENT ON COLUMN daily_menu_items.specific_extras_ids IS 'List of product IDs allowed as extras for this daily menu item. If NULL, use global defaults.';
