
-- Fix permissions for event_gallery (Database)
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage gallery" ON event_gallery;
DROP POLICY IF EXISTS "Public read gallery" ON event_gallery;

-- Allow full access to event_gallery for everyone (relies on App logic for security)
-- This allows the 'anon' user (used by the custom admin panel) to insert/delete
CREATE POLICY "Gallery Full Access" 
ON event_gallery FOR ALL 
USING (true) 
WITH CHECK (true);


-- Fix permissions for Storage (Bucket)
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-documents', 'event-documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies on storage.objects for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Public Access event-documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert event-documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete event-documents" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to everything" ON storage.objects; 

-- Re-create policies allowing PUBLIC access (since app uses custom auth)
CREATE POLICY "Public Select event-documents" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'event-documents' );

CREATE POLICY "Public Insert event-documents" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'event-documents' );

CREATE POLICY "Public Update event-documents" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'event-documents' );

CREATE POLICY "Public Delete event-documents" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'event-documents' );
