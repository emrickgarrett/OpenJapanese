-- ============================================================================
-- OpenJapanese - Complete Database Schema
-- Run this entire file in Supabase SQL Editor to set up all tables.
-- ============================================================================

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

-- 002_progress.sql
-- User progress table tracking SRS state for each item

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,        -- 'radical', 'kanji', 'vocabulary', 'grammar'
  item_id TEXT NOT NULL,          -- references the curriculum item identifier

  -- SRS fields
  srs_stage INTEGER DEFAULT 0,           -- 0=lesson, 1-4=apprentice, 5-6=guru, 7=master, 8=enlightened, 9=burned
  ease_factor REAL DEFAULT 2.5,          -- SM-2 ease factor
  interval_days REAL DEFAULT 0,          -- current interval in days
  repetitions INTEGER DEFAULT 0,         -- number of successful repetitions in a row

  -- Scheduling
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,

  -- Accuracy tracking
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  meaning_correct INTEGER DEFAULT 0,
  meaning_incorrect INTEGER DEFAULT 0,
  reading_correct INTEGER DEFAULT 0,
  reading_incorrect INTEGER DEFAULT 0,

  -- Lifecycle timestamps
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  burned_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, item_type, item_id)
);

CREATE INDEX idx_user_progress_profile ON user_progress(profile_id);
CREATE INDEX idx_user_progress_next_review ON user_progress(profile_id, next_review_at)
  WHERE next_review_at IS NOT NULL AND burned_at IS NULL;
CREATE INDEX idx_user_progress_srs_stage ON user_progress(profile_id, srs_stage);
CREATE INDEX idx_user_progress_item ON user_progress(item_type, item_id);

-- 003_reviews.sql
-- Review history for analytics and debugging

CREATE TABLE review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  review_type TEXT NOT NULL,         -- 'meaning', 'reading'
  was_correct BOOLEAN NOT NULL,
  previous_stage INTEGER NOT NULL,
  new_stage INTEGER NOT NULL,
  response_time_ms INTEGER,
  source TEXT DEFAULT 'review',      -- 'review', 'lesson_quiz', 'game', 'extra_study'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_history_profile ON review_history(profile_id);
CREATE INDEX idx_review_history_profile_created ON review_history(profile_id, created_at DESC);
CREATE INDEX idx_review_history_item ON review_history(profile_id, item_type, item_id);

-- 004_achievements.sql
-- User achievements / badges

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,      -- e.g. 'first_burn', 'streak_7', 'level_10'
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',       -- extra context like { "item": "火", "count": 100 }

  UNIQUE(profile_id, achievement_key)
);

CREATE INDEX idx_achievements_profile ON achievements(profile_id);
CREATE INDEX idx_achievements_key ON achievements(achievement_key);

-- 005_streaks.sql
-- Daily streak tracking per user

CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freezes_available INTEGER DEFAULT 0,
  streak_freeze_used_at DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streaks_profile ON streaks(profile_id);
CREATE INDEX idx_streaks_current ON streaks(current_streak DESC);

-- 006_daily_activity.sql
-- Per-day activity summary for heatmaps and analytics

CREATE TABLE daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  reviews_completed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  items_learned INTEGER DEFAULT 0,
  items_burned INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, activity_date)
);

CREATE INDEX idx_daily_activity_profile ON daily_activity(profile_id);
CREATE INDEX idx_daily_activity_profile_date ON daily_activity(profile_id, activity_date DESC);

-- 007_game_sessions.sql
-- Records of individual mini-game play sessions

CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,           -- 'kana_match', 'kanji_draw', 'vocab_rush', etc.
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,           -- 0.0 to 1.0
  duration_seconds INTEGER DEFAULT 0,
  items_practiced JSONB DEFAULT '[]', -- array of { item_type, item_id, was_correct }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_profile ON game_sessions(profile_id);
CREATE INDEX idx_game_sessions_profile_type ON game_sessions(profile_id, game_type);
CREATE INDEX idx_game_sessions_profile_created ON game_sessions(profile_id, created_at DESC);

-- ============================================================================
-- Enable Row Level Security (RLS) on all tables
-- Allows public read/write since we don't use auth (profile ID in localStorage)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public access (anon key) since we don't use Supabase Auth
CREATE POLICY "Allow public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON user_progress FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON user_progress FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON review_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON review_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON achievements FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON achievements FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON streaks FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON streaks FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON daily_activity FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON daily_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON daily_activity FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON game_sessions FOR INSERT WITH CHECK (true);
