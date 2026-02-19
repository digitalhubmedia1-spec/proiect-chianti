
-- Add observations column to event_reservations
ALTER TABLE event_reservations 
ADD COLUMN IF NOT EXISTS observations TEXT;
