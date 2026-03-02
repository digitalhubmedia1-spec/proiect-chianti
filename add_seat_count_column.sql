-- Adăugare coloană seat_count în tabela event_guests
ALTER TABLE event_guests ADD COLUMN IF NOT EXISTS seat_count INTEGER DEFAULT 1;

-- Actualizare comentariu coloană
COMMENT ON COLUMN event_guests.seat_count IS 'Numărul total de locuri ocupate de acest invitat (ex: Ion Popescu + 7 pers = 8 locuri)';
