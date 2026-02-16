-- Fix RLS policies for ALL event tables
-- Using (true) pattern to match the rest of the project (admin_users, recipes, etc.)
-- The app uses custom admin_users auth, NOT Supabase Auth, so auth.role() = 'anon'

-- ===================== EVENTS =====================
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON events;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_full_access" ON events FOR ALL USING (true) WITH CHECK (true);

-- ===================== EVENT HALLS =====================
DROP POLICY IF EXISTS "event_halls_select" ON event_halls;
DROP POLICY IF EXISTS "event_halls_insert" ON event_halls;
DROP POLICY IF EXISTS "event_halls_update" ON event_halls;
DROP POLICY IF EXISTS "event_halls_delete" ON event_halls;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_halls;

ALTER TABLE event_halls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_halls_full_access" ON event_halls FOR ALL USING (true) WITH CHECK (true);

-- ===================== EVENT LAYOUT OBJECTS =====================
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_layout_objects;

ALTER TABLE event_layout_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_layout_full_access" ON event_layout_objects FOR ALL USING (true) WITH CHECK (true);

-- ===================== EVENT GUESTS =====================
DROP POLICY IF EXISTS "event_guests_select" ON event_guests;
DROP POLICY IF EXISTS "event_guests_insert" ON event_guests;
DROP POLICY IF EXISTS "event_guests_update" ON event_guests;
DROP POLICY IF EXISTS "event_guests_delete" ON event_guests;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_guests;

ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_guests_full_access" ON event_guests FOR ALL USING (true) WITH CHECK (true);

-- ===================== EVENT MENU PACKAGES =====================
DROP POLICY IF EXISTS "event_menu_packages_select" ON event_menu_packages;
DROP POLICY IF EXISTS "event_menu_packages_insert" ON event_menu_packages;
DROP POLICY IF EXISTS "event_menu_packages_update" ON event_menu_packages;
DROP POLICY IF EXISTS "event_menu_packages_delete" ON event_menu_packages;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_menu_packages;

ALTER TABLE event_menu_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_menu_packages_full_access" ON event_menu_packages FOR ALL USING (true) WITH CHECK (true);

-- ===================== EVENT MENU ITEMS =====================
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_menu_items;

ALTER TABLE event_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_menu_items_full_access" ON event_menu_items FOR ALL USING (true) WITH CHECK (true);

-- ===================== EVENT STAFF ASSIGNMENTS =====================
DROP POLICY IF EXISTS "event_staff_select" ON event_staff_assignments;
DROP POLICY IF EXISTS "event_staff_insert" ON event_staff_assignments;
DROP POLICY IF EXISTS "event_staff_update" ON event_staff_assignments;
DROP POLICY IF EXISTS "event_staff_delete" ON event_staff_assignments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_staff_assignments;

ALTER TABLE event_staff_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_staff_full_access" ON event_staff_assignments FOR ALL USING (true) WITH CHECK (true);

-- ===================== EVENT TIMELINE ITEMS =====================
DROP POLICY IF EXISTS "event_timeline_select" ON event_timeline_items;
DROP POLICY IF EXISTS "event_timeline_insert" ON event_timeline_items;
DROP POLICY IF EXISTS "event_timeline_update" ON event_timeline_items;
DROP POLICY IF EXISTS "event_timeline_delete" ON event_timeline_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_timeline_items;

ALTER TABLE event_timeline_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_timeline_full_access" ON event_timeline_items FOR ALL USING (true) WITH CHECK (true);

-- ===================== EVENT CLOSING REPORTS =====================
DROP POLICY IF EXISTS "event_closing_select" ON event_closing_reports;
DROP POLICY IF EXISTS "event_closing_insert" ON event_closing_reports;
DROP POLICY IF EXISTS "event_closing_update" ON event_closing_reports;
DROP POLICY IF EXISTS "event_closing_delete" ON event_closing_reports;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON event_closing_reports;

ALTER TABLE event_closing_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_closing_full_access" ON event_closing_reports FOR ALL USING (true) WITH CHECK (true);
