-- Add event_id and menu_type to event_menu_packages if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_menu_packages' AND column_name = 'event_id') THEN
        ALTER TABLE event_menu_packages ADD COLUMN event_id BIGINT REFERENCES events(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_menu_packages' AND column_name = 'menu_type') THEN
        ALTER TABLE event_menu_packages ADD COLUMN menu_type TEXT DEFAULT 'invitati';
    END IF;
END $$;

-- Add event_id, menu_type, and category to event_menu_items if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_menu_items' AND column_name = 'event_id') THEN
        ALTER TABLE event_menu_items ADD COLUMN event_id BIGINT REFERENCES events(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_menu_items' AND column_name = 'menu_type') THEN
        ALTER TABLE event_menu_items ADD COLUMN menu_type TEXT DEFAULT 'invitati';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_menu_items' AND column_name = 'category') THEN
        ALTER TABLE event_menu_items ADD COLUMN category TEXT DEFAULT 'Gustare Rece';
    END IF;
END $$;

-- RLS for event_menu_items (ensure access)
ALTER TABLE event_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_menu_items_all" ON event_menu_items;
CREATE POLICY "event_menu_items_all" ON event_menu_items FOR ALL USING (true) WITH CHECK (true);
