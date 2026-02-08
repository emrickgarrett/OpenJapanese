import { ReviewResult, SRSUpdate } from '@/types/srs';
import { SRS_STAGES, SRS_INTERVALS } from './constants';

/**
 * Minimum ease factor allowed (prevents intervals from shrinking too aggressively).
 */
const MIN_EASE_FACTOR = 1.3;

/**
 * Default ease factor for new items.
 */
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Calculates the next review date based on the interval for a given stage.
 */
function calculateNextReviewDate(stage: number): Date {
  const now = new Date();
  const interval = SRS_INTERVALS[stage];

  if (!interval || interval.value === 0) {
    return now;
  }

  if (interval.unit === 'hours') {
    return new Date(now.getTime() + interval.value * 60 * 60 * 1000);
  }

  return new Date(now.getTime() + interval.value * 24 * 60 * 60 * 1000);
}

/**
 * Gets the interval in days for a given SRS stage.
 */
function getIntervalDays(stage: number): number {
  const interval = SRS_INTERVALS[stage];
  if (!interval || interval.value === 0) {
    return 0;
  }

  if (interval.unit === 'hours') {
    return interval.value / 24;
  }

  return interval.value;
}

/**
 * Processes a review using a modified SM-2 algorithm with WaniKani-style stages.
 *
 * Correct answers (quality >= 3):
 *   - Move up one stage (max BURNED = 9)
 *   - Adjust ease factor upward based on quality
 *
 * Incorrect answers (quality < 3):
 *   - Apprentice items (stages 1-4): drop 1 stage (minimum stage 1)
 *   - Guru+ items (stages 5-8): drop 2 stages (minimum stage 1)
 *   - Adjust ease factor downward
 *   - Reset repetitions to 0
 */
export function processReview(result: ReviewResult): SRSUpdate {
  const { quality, currentStage, easeFactor, repetitions } = result;
  const isCorrect = quality >= 3;

  let newStage: number;
  let newEaseFactor: number;
  let newRepetitions: number;

  if (isCorrect) {
    // Move up one stage, capped at BURNED
    newStage = Math.min(currentStage + 1, SRS_STAGES.BURNED);
    newRepetitions = repetitions + 1;

    // SM-2 ease factor adjustment for correct answers
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    // Incorrect: Apprentice items drop 1, Guru+ items drop 2
    if (currentStage <= SRS_STAGES.APPRENTICE_4) {
      newStage = Math.max(currentStage - 1, SRS_STAGES.APPRENTICE_1);
    } else {
      newStage = Math.max(currentStage - 2, SRS_STAGES.APPRENTICE_1);
    }

    newRepetitions = 0;

    // SM-2 ease factor adjustment for incorrect answers
    newEaseFactor = easeFactor - 0.2;
  }

  // Enforce minimum ease factor
  newEaseFactor = Math.max(newEaseFactor, MIN_EASE_FACTOR);

  const newInterval = getIntervalDays(newStage);
  const nextReviewAt = calculateNextReviewDate(newStage);

  return {
    newStage,
    newEaseFactor,
    newInterval,
    newRepetitions,
    nextReviewAt,
  };
}

export { DEFAULT_EASE_FACTOR, MIN_EASE_FACTOR };
