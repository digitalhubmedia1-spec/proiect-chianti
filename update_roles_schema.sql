-- 1. Tabela pentru roluri dinamice
CREATE TABLE IF NOT EXISTS staff_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserare roluri implicite
INSERT INTO staff_roles (name) VALUES 
('Manager Eveniment'), 
('Bucătar Șef'), 
('Ospătar'), 
('Barman'), 
('Hostess')
ON CONFLICT (name) DO NOTHING;

-- 3. Adăugare coloană în timeline pentru asignare rol
ALTER TABLE event_timeline_items 
ADD COLUMN IF NOT EXISTS assigned_role_id UUID REFERENCES staff_roles(id);

-- 4. (Opțional) Index pentru performanță
CREATE INDEX IF NOT EXISTS idx_timeline_role ON event_timeline_items(assigned_role_id);
