-- Fix RLS policy for events table
-- The existing policy may only have USING without WITH CHECK, which blocks INSERTs

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "events_select_policy" ON events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "events_insert_policy" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "events_update_policy" ON events FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "events_delete_policy" ON events FOR DELETE USING (auth.role() = 'authenticated');

-- Also fix related tables that might have the same issue
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_halls;
ALTER TABLE event_halls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_halls_select" ON event_halls FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "event_halls_insert" ON event_halls FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_halls_update" ON event_halls FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_halls_delete" ON event_halls FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_guests;
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_guests_select" ON event_guests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "event_guests_insert" ON event_guests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_guests_update" ON event_guests FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_guests_delete" ON event_guests FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_menu_packages;
ALTER TABLE event_menu_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_menu_packages_select" ON event_menu_packages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "event_menu_packages_insert" ON event_menu_packages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_menu_packages_update" ON event_menu_packages FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_menu_packages_delete" ON event_menu_packages FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_staff_assignments;
ALTER TABLE event_staff_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_staff_select" ON event_staff_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "event_staff_insert" ON event_staff_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_staff_update" ON event_staff_assignments FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_staff_delete" ON event_staff_assignments FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_timeline_items;
ALTER TABLE event_timeline_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_timeline_select" ON event_timeline_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "event_timeline_insert" ON event_timeline_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_timeline_update" ON event_timeline_items FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_timeline_delete" ON event_timeline_items FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_closing_reports;
ALTER TABLE event_closing_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_closing_select" ON event_closing_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "event_closing_insert" ON event_closing_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_closing_update" ON event_closing_reports FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "event_closing_delete" ON event_closing_reports FOR DELETE USING (auth.role() = 'authenticated');
