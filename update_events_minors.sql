
-- Add allow_minors column to events table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'allow_minors') THEN
        ALTER TABLE events ADD COLUMN allow_minors BOOLEAN DEFAULT false;
    END IF;
END $$;
