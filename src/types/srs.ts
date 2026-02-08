export interface SRSData {
  srsStage: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
}

export interface ReviewResult {
  quality: number; // 0-5
  currentStage: number;
  easeFactor: number;
  repetitions: number;
  interval: number;
}

export interface SRSUpdate {
  newStage: number;
  newEaseFactor: number;
  newInterval: number;
  newRepetitions: number;
  nextReviewAt: Date;
}
