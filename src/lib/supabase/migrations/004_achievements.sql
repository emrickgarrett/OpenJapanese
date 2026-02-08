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
