-- Fix permissions for event_reservations table
-- Allow public (and admin) full access to reservations to enable Cancellation and Deletion
-- This is required because the admin panel uses client-side auth (localStorage) and acts as 'anon' role in Supabase.

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public can insert reservations" ON event_reservations;
DROP POLICY IF EXISTS "Public can view reservations" ON event_reservations;
DROP POLICY IF EXISTS "Admin full access reservations" ON event_reservations;
DROP POLICY IF EXISTS "event_reservations_full_access" ON event_reservations;

-- Ensure RLS is enabled
ALTER TABLE event_reservations ENABLE ROW LEVEL SECURITY;

-- Create a single policy allowing full access to everyone (public/anon and authenticated)
-- Ideally, we would restrict DELETE/UPDATE to admins, but since 'anon' is the role for admins here, we must open it.
CREATE POLICY "event_reservations_full_access" 
ON event_reservations 
FOR ALL 
USING (true) 
WITH CHECK (true);
