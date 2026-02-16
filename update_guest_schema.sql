
-- Add dietary preference enum
DO $$ BEGIN
    CREATE TYPE dietary_pref_type AS ENUM ('standard', 'vegetarian', 'vegan', 'pescatarian', 'allergy_gluten', 'allergy_lactose', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter table to use the new enum and add explicit allergy text
ALTER TABLE event_guests 
ADD COLUMN IF NOT EXISTS dietary_pref dietary_pref_type DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS allergy_details TEXT;

-- We already have 'layout_object_id' for table assignment, so that's good.
-- We already have 'menu_preference' but let's encourage using the enum for stats.
