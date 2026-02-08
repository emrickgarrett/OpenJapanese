import type {
  AchievementCondition,
  AchievementDefinition,
} from '@/types/achievement';
import type { GameType } from '@/types/game';
import { ACHIEVEMENTS } from './definitions';

// ── Context shape ─────────────────────────────────────────────────────────

/**
 * All the stats required to evaluate whether an achievement condition is met.
 * Callers should build this from the user's persisted data (Supabase rows,
 * local aggregations, etc.) and pass it into `checkAllAchievements`.
 */
export interface AchievementContext {
  /** Total number of items (kanji + vocab + grammar) the user has started learning. */
  itemsLearned: number;
  /** Total number of items that have been burned (final SRS stage). */
  itemsBurned: number;
  /** Current consecutive-day study streak. */
  streakDays: number;
  /** Lifetime count of completed reviews. */
  reviewsCompleted: number;
  /** Current run of consecutive correct reviews (resets on incorrect). */
  consecutiveCorrect: number;
  /** Lifetime count of mini-game sessions played. */
  gamesPlayed: number;
  /** Number of distinct kanji the user has started learning. */
  kanjiCount: number;
  /** Number of distinct vocabulary words the user has started learning. */
  vocabCount: number;
  /**
   * Per-game-type best scores.
   * The key is the GameType string; the value is the best accuracy (0-1)
   * achieved in that game type. A value of 1 means a perfect score.
   */
  gameScores: Partial<Record<GameType, number>>;
  /** Set of distinct game types the user has played at least once. */
  gameTypesPlayed: Set<GameType>;
  /** The user's current app level. */
  appLevel: number;
  /**
   * Set of JLPT levels the user has fully mastered
   * (e.g. `new Set(['N5', 'N4'])`).
   */
  jlptLevelsMastered: Set<string>;
  /**
   * Speed review stats: the most items the user has completed within a
   * given time window. Keyed by `${itemCount}:${maxSeconds}` for quick
   * lookups (e.g. `"20:60"` means 20 items in 60 s).
   */
  speedReviewBests: Set<string>;
}

// ── Single-condition evaluator ────────────────────────────────────────────

/**
 * Evaluate a single `AchievementCondition` against the given context.
 * Returns `true` when the condition is satisfied.
 */
export function evaluateCondition(
  condition: AchievementCondition,
  context: AchievementContext,
): boolean {
  switch (condition.type) {
    case 'items_learned':
      return context.itemsLearned >= condition.count;

    case 'items_burned':
      return context.itemsBurned >= condition.count;

    case 'streak_days':
      return context.streakDays >= condition.count;

    case 'reviews_completed':
      return context.reviewsCompleted >= condition.count;

    case 'perfect_reviews':
      return context.consecutiveCorrect >= condition.count;

    case 'games_played':
      return context.gamesPlayed >= condition.count;

    case 'game_perfect': {
      const score = context.gameScores[condition.gameType as GameType];
      return score !== undefined && score >= 1;
    }

    case 'jlpt_level':
      return context.jlptLevelsMastered.has(condition.level);

    case 'app_level':
      return context.appLevel >= condition.level;

    case 'kanji_count':
      return context.kanjiCount >= condition.count;

    case 'vocab_count':
      return context.vocabCount >= condition.count;

    case 'speed_review': {
      const key = `${condition.itemCount}:${condition.maxSeconds}`;
      return context.speedReviewBests.has(key);
    }

    default:
      // Exhaustive check -- if a new condition type is added to the union
      // TypeScript will flag an error here until it's handled.
      return false;
  }
}

// ── Bulk checker ──────────────────────────────────────────────────────────

/**
 * Walk through every achievement definition, skip those already unlocked,
 * and return the list of achievements that the user has newly earned.
 *
 * @param unlockedKeys - Set of achievement keys the user already has.
 * @param context      - Current aggregate stats for condition evaluation.
 * @returns Array of `AchievementDefinition` objects that are newly earned.
 */
export function checkAllAchievements(
  unlockedKeys: Set<string>,
  context: AchievementContext,
): AchievementDefinition[] {
  const newlyEarned: AchievementDefinition[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Already unlocked -- skip.
    if (unlockedKeys.has(achievement.key)) {
      continue;
    }

    if (evaluateCondition(achievement.condition, context)) {
      newlyEarned.push(achievement);
    }
  }

  return newlyEarned;
}
