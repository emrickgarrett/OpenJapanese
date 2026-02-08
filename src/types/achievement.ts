export type AchievementCategory = 'learning' | 'streak' | 'mastery' | 'social' | 'games' | 'special';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AchievementCondition =
  | { type: 'items_learned'; count: number }
  | { type: 'items_burned'; count: number }
  | { type: 'streak_days'; count: number }
  | { type: 'reviews_completed'; count: number }
  | { type: 'perfect_reviews'; count: number }
  | { type: 'games_played'; count: number }
  | { type: 'game_perfect'; gameType: string }
  | { type: 'jlpt_level'; level: string }
  | { type: 'app_level'; level: number }
  | { type: 'kanji_count'; count: number }
  | { type: 'vocab_count'; count: number }
  | { type: 'speed_review'; itemCount: number; maxSeconds: number };

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: AchievementCondition;
  xpReward: number;
  rarity: AchievementRarity;
}

export interface UnlockedAchievement {
  id: string;
  profileId: string;
  achievementKey: string;
  unlockedAt: string;
}
