-- 1. Create Reservations Table
CREATE TABLE IF NOT EXISTS event_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
  table_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  seat_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Locks Table (for temporary holds)
CREATE TABLE IF NOT EXISTS event_reservation_locks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
  table_id TEXT NOT NULL,
  locked_until TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL, -- To identify the user holding the lock
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add Reservation Token to Events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS reservation_token TEXT UNIQUE;

-- 4. Enable RLS
ALTER TABLE event_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reservation_locks ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Reservations
-- Public can insert (make reservation)
CREATE POLICY "Public can insert reservations" 
ON event_reservations FOR INSERT 
TO public 
WITH CHECK (true);

-- Admin can do everything
CREATE POLICY "Admin full access reservations" 
ON event_reservations FOR ALL 
TO authenticated 
USING (true);

-- Public can view reservations (needed to see which tables are taken?)
CREATE POLICY "Public can view reservations" 
ON event_reservations FOR SELECT 
TO public 
USING (true);


-- 6. Policies for Locks
-- Public can insert/select/delete locks
CREATE POLICY "Public access locks" 
ON event_reservation_locks FOR ALL 
TO public 
USING (true);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_event ON event_reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_locks_event ON event_reservation_locks(event_id);
