export type GameType = 'matching' | 'speed-round' | 'kanji-draw' | 'sentence-builder' | 'listening' | 'typing';

export interface GameSession {
  id: string;
  profileId: string;
  gameType: GameType;
  score: number;
  maxScore: number;
  accuracy: number;
  durationSeconds: number;
  itemsPracticed: string[];
  createdAt: string;
}

export interface GameConfig {
  type: GameType;
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
