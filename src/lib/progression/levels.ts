import { JLPTLevel } from '@/types/curriculum';

/**
 * JLPT gate definitions.
 * Each JLPT level maps to a range of app levels and a required number
 * of Guru-level (or higher) items to unlock.
 */
export const JLPT_GATES: Record<
  JLPTLevel,
  { startLevel: number; endLevel: number; requiredGuru: number }
> = {
  N5: { startLevel: 1, endLevel: 10, requiredGuru: 0 },
  N4: { startLevel: 11, endLevel: 20, requiredGuru: 80 },
  N3: { startLevel: 21, endLevel: 35, requiredGuru: 200 },
  N2: { startLevel: 36, endLevel: 50, requiredGuru: 500 },
  N1: { startLevel: 51, endLevel: 60, requiredGuru: 1000 },
};

/**
 * Returns the JLPT level that corresponds to a given app level.
 * Returns null if the app level is out of range.
 */
export function getJLPTLevelForAppLevel(appLevel: number): JLPTLevel | null {
  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  for (const level of levels) {
    const gate = JLPT_GATES[level];
    if (appLevel >= gate.startLevel && appLevel <= gate.endLevel) {
      return level;
    }
  }

  return null;
}

/**
 * Determines if a given app level is unlocked based on the number of
 * items the user has at Guru level or above.
 *
 * A level is unlocked if:
 *   - It falls within the N5 range (always unlocked since requiredGuru is 0)
 *   - The user has enough Guru+ items to meet the gate requirement for
 *     the JLPT level that contains the target app level
 */
export function isLevelUnlocked(appLevel: number, guruCount: number): boolean {
  const jlptLevel = getJLPTLevelForAppLevel(appLevel);

  if (!jlptLevel) {
    return false;
  }

  const gate = JLPT_GATES[jlptLevel];
  return guruCount >= gate.requiredGuru;
}
