-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS collection_moderation (
  address TEXT PRIMARY KEY,
  status TEXT DEFAULT 'neutral', -- 'verified', 'hidden', 'neutral'
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE collection_moderation ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read moderation" ON collection_moderation
  FOR SELECT
  USING (true);

-- Allow authenticated users (admin) to insert/update
-- Note: In a real app, you'd restrict this to specific user IDs.
-- For this MVP, we'll handle admin check in the frontend/API logic
-- and allow any authenticated user to write (assuming only admin has access to the UI)
-- OR better, we can restrict it to a specific wallet if we had user auth linked to wallets in Supabase.
-- For now, we'll allow insert/update for authenticated users and rely on frontend protection + hardcoded admin check.
CREATE POLICY "Allow authenticated insert moderation" ON collection_moderation
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update moderation" ON collection_moderation
  FOR UPDATE
  USING (auth.role() = 'authenticated');
