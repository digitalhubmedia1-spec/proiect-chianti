-- 1. Add options to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS show_hall_plan BOOLEAN DEFAULT TRUE;

-- 2. Create gallery table for images/videos
CREATE TABLE IF NOT EXISTS event_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image' or 'video'
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add dietary preferences to reservations
ALTER TABLE event_reservations
ADD COLUMN IF NOT EXISTS dietary_preference TEXT; -- 'post', 'frupt', 'both', 'none'

-- 4. Enable RLS for gallery
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read gallery" 
ON event_gallery FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Admin manage gallery" 
ON event_gallery FOR ALL 
TO authenticated 
USING (true);

-- 5. Allow reservations without a specific table (for when hall plan is hidden)
ALTER TABLE event_reservations
ALTER COLUMN table_id DROP NOT NULL;
