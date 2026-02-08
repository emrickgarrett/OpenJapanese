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
