import { UserProgress } from '@/types/progress';
import { SRS_STAGES, SRS_STAGE_NAMES } from './constants';

/**
 * Calculates the next review date by adding the given interval (in days)
 * to the provided base date.
 */
export function getNextReviewDate(fromDate: Date, intervalDays: number): Date {
  return new Date(fromDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
}

/**
 * Checks whether an item is currently due for review.
 * An item is due if:
 *   - It has a nextReviewAt date that is in the past (or now)
 *   - It is not in the NEW (0) or BURNED (9) stage
 */
export function isDue(item: UserProgress, now?: Date): boolean {
  const currentTime = now ?? new Date();

  // NEW items have not been learned yet; BURNED items are done
  if (item.srsStage === SRS_STAGES.NEW || item.srsStage === SRS_STAGES.BURNED) {
    return false;
  }

  if (!item.nextReviewAt) {
    return false;
  }

  const reviewDate = new Date(item.nextReviewAt);
  return reviewDate <= currentTime;
}

/**
 * Filters a list of progress items to return only those that are currently
 * due for review, sorted by nextReviewAt ascending (oldest first).
 */
export function getDueItems(items: UserProgress[], now?: Date): UserProgress[] {
  const currentTime = now ?? new Date();

  return items
    .filter((item) => isDue(item, currentTime))
    .sort((a, b) => {
      const dateA = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
      const dateB = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
      return dateA - dateB;
    });
}

/**
 * Generates a summary of how many items are in each SRS stage.
 * Returns an object with stage names as keys and counts as values,
 * plus grouped totals for Apprentice, Guru, etc.
 */
export function getSRSSummary(items: UserProgress[]): {
  stageCounts: Record<string, number>;
  groupCounts: {
    new: number;
    apprentice: number;
    guru: number;
    master: number;
    enlightened: number;
    burned: number;
  };
  total: number;
} {
  const stageCounts: Record<string, number> = {};

  // Initialize all stages to 0
  for (const [stage, name] of Object.entries(SRS_STAGE_NAMES)) {
    stageCounts[name] = 0;
    // Count items in this stage
    const stageNum = Number(stage);
    for (const item of items) {
      if (item.srsStage === stageNum) {
        stageCounts[name]++;
      }
    }
  }

  const groupCounts = {
    new: items.filter((i) => i.srsStage === SRS_STAGES.NEW).length,
    apprentice: items.filter(
      (i) =>
        i.srsStage >= SRS_STAGES.APPRENTICE_1 &&
        i.srsStage <= SRS_STAGES.APPRENTICE_4
    ).length,
    guru: items.filter(
      (i) =>
        i.srsStage >= SRS_STAGES.GURU_1 && i.srsStage <= SRS_STAGES.GURU_2
    ).length,
    master: items.filter((i) => i.srsStage === SRS_STAGES.MASTER).length,
    enlightened: items.filter((i) => i.srsStage === SRS_STAGES.ENLIGHTENED)
      .length,
    burned: items.filter((i) => i.srsStage === SRS_STAGES.BURNED).length,
  };

  return {
    stageCounts,
    groupCounts,
    total: items.length,
  };
}
