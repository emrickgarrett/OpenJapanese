/**
 * XP reward constants for various actions in the app.
 */
export const XP_REWARDS = {
  LESSON_COMPLETE: 10,
  REVIEW_CORRECT: 5,
  REVIEW_INCORRECT: 1,
  ITEM_GURU: 50,
  ITEM_MASTER: 100,
  ITEM_ENLIGHTENED: 200,
  ITEM_BURNED: 500,
  GAME_BASE: 15,
  GAME_PERFECT: 50,
  STREAK_BONUS_PER_DAY: 2,
  DAILY_FIRST_REVIEW: 20,
} as const;

/**
 * Calculates the total XP required to reach a given level.
 * Uses quadratic scaling: XP = 100 * level^2
 *
 * Level 1 requires 100 XP, level 2 requires 400 XP total, etc.
 */
export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return 100 * level * level;
}

/**
 * Determines the current level based on total accumulated XP.
 * Inverse of the quadratic formula: level = floor(sqrt(xp / 100))
 */
export function getLevelFromXP(totalXp: number): number {
  if (totalXp <= 0) return 0;
  return Math.floor(Math.sqrt(totalXp / 100));
}

/**
 * Returns detailed XP progress information for a given total XP amount.
 */
export function getXPProgress(totalXp: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const currentLevel = getLevelFromXP(totalXp);
  const xpAtCurrentLevel = xpForLevel(currentLevel);
  const xpAtNextLevel = xpForLevel(currentLevel + 1);

  const xpInCurrentLevel = totalXp - xpAtCurrentLevel;
  const xpForNextLevel = xpAtNextLevel - xpAtCurrentLevel;
  const progressPercent =
    xpForNextLevel > 0
      ? Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100)
      : 0;

  return {
    currentLevel,
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercent,
  };
}

/**
 * Calculates a bonus XP multiplier based on the current streak length.
 * The bonus increases by XP_REWARDS.STREAK_BONUS_PER_DAY for each day,
 * capped at a maximum of 2x multiplier (at 50 days).
 */
export function calculateStreakBonus(streakDays: number): number {
  if (streakDays <= 0) return 1;

  const bonus = 1 + streakDays * (XP_REWARDS.STREAK_BONUS_PER_DAY / 100);
  return Math.min(bonus, 2.0);
}
