import { JLPTLevel } from './curriculum';

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string;
  displayName: string;
  currentJlptLevel: JLPTLevel;
  totalXp: number;
  currentLevel: number;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  createdAt: string;
  lastActiveAt: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  dailyGoal: number;
  lessonBatchSize: number;
  reviewOrder: 'meaning_first' | 'reading_first' | 'random';
}
