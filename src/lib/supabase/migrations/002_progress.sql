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
