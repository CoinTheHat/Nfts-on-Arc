-- Add twitter_handle column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS twitter_handle TEXT;

-- Optional: Add a check constraint to ensure it doesn't contain full URL if desired, 
-- but for flexibility we'll just keep it as TEXT for now.
