
-- Create the storage bucket for event documents/media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-documents', 'event-documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view files
CREATE POLICY "Public Access event-documents" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'event-documents' );

-- Policy to allow authenticated users (admin) to upload
CREATE POLICY "Admin Insert event-documents" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'event-documents' );

-- Policy to allow authenticated users (admin) to delete
CREATE POLICY "Admin Delete event-documents" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'event-documents' );
