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
