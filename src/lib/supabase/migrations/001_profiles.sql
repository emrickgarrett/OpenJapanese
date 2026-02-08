-- 001_profiles.sql
-- User profile table for OpenJapanese

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  display_name TEXT,
  current_jlpt_level TEXT DEFAULT 'N5',
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  sound_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light',
  daily_goal INTEGER DEFAULT 20,
  lesson_batch_size INTEGER DEFAULT 5,
  review_order TEXT DEFAULT 'random',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX idx_profiles_username ON profiles(username);
