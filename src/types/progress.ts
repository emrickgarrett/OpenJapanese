import { ItemType, JLPTLevel } from './curriculum';

export interface UserProgress {
  id: string;
  profileId: string;
  itemType: ItemType;
  itemId: string;
  jlptLevel: JLPTLevel;
  srsStage: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  timesCorrect: number;
  timesIncorrect: number;
  meaningCorrect: number;
  meaningIncorrect: number;
  readingCorrect: number;
  readingIncorrect: number;
  unlockedAt: string;
  burnedAt: string | null;
}

export interface ReviewHistoryEntry {
  id: string;
  profileId: string;
  itemType: ItemType;
  itemId: string;
  reviewType: 'meaning' | 'reading' | 'both';
  wasCorrect: boolean;
  previousStage: number;
  newStage: number;
  responseTimeMs: number;
  source: 'review' | 'lesson' | 'game';
  createdAt: string;
}

export interface DailyActivity {
  activityDate: string;
  reviewsCompleted: number;
  lessonsCompleted: number;
  gamesPlayed: number;
  xpEarned: number;
  itemsLearned: number;
  itemsBurned: number;
  timeSpentSeconds: number;
}
