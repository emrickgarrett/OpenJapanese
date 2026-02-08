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
