/**
 * SRS stage identifiers.
 * Maps each named stage to its numeric value (0-9).
 */
export const SRS_STAGES = {
  NEW: 0,
  APPRENTICE_1: 1,
  APPRENTICE_2: 2,
  APPRENTICE_3: 3,
  APPRENTICE_4: 4,
  GURU_1: 5,
  GURU_2: 6,
  MASTER: 7,
  ENLIGHTENED: 8,
  BURNED: 9,
} as const;

export type SRSStage = (typeof SRS_STAGES)[keyof typeof SRS_STAGES];

/**
 * SRS intervals for each stage.
 * Values represent the wait time before the next review.
 * Stages 1-4 (Apprentice) use hours; stages 5-9 use days.
 */
export const SRS_INTERVALS: Record<number, { value: number; unit: 'hours' | 'days' }> = {
  [SRS_STAGES.NEW]: { value: 0, unit: 'hours' },
  [SRS_STAGES.APPRENTICE_1]: { value: 4, unit: 'hours' },
  [SRS_STAGES.APPRENTICE_2]: { value: 8, unit: 'hours' },
  [SRS_STAGES.APPRENTICE_3]: { value: 24, unit: 'hours' },
  [SRS_STAGES.APPRENTICE_4]: { value: 48, unit: 'hours' },
  [SRS_STAGES.GURU_1]: { value: 7, unit: 'days' },
  [SRS_STAGES.GURU_2]: { value: 14, unit: 'days' },
  [SRS_STAGES.MASTER]: { value: 30, unit: 'days' },
  [SRS_STAGES.ENLIGHTENED]: { value: 120, unit: 'days' },
  [SRS_STAGES.BURNED]: { value: 0, unit: 'days' },
};

/**
 * Human-readable names for each SRS stage.
 */
export const SRS_STAGE_NAMES: Record<number, string> = {
  [SRS_STAGES.NEW]: 'New',
  [SRS_STAGES.APPRENTICE_1]: 'Apprentice I',
  [SRS_STAGES.APPRENTICE_2]: 'Apprentice II',
  [SRS_STAGES.APPRENTICE_3]: 'Apprentice III',
  [SRS_STAGES.APPRENTICE_4]: 'Apprentice IV',
  [SRS_STAGES.GURU_1]: 'Guru I',
  [SRS_STAGES.GURU_2]: 'Guru II',
  [SRS_STAGES.MASTER]: 'Master',
  [SRS_STAGES.ENLIGHTENED]: 'Enlightened',
  [SRS_STAGES.BURNED]: 'Burned',
};

/**
 * Tailwind-compatible color classes for each SRS stage.
 * Pink for Apprentice, purple for Guru, blue for Master,
 * gold for Enlightened, green for Burned.
 */
export const SRS_STAGE_COLORS: Record<number, string> = {
  [SRS_STAGES.NEW]: '#A0A0A0',       // Gray
  [SRS_STAGES.APPRENTICE_1]: '#DD0093', // Pink
  [SRS_STAGES.APPRENTICE_2]: '#DD0093', // Pink
  [SRS_STAGES.APPRENTICE_3]: '#DD0093', // Pink
  [SRS_STAGES.APPRENTICE_4]: '#DD0093', // Pink
  [SRS_STAGES.GURU_1]: '#882D9E',     // Purple
  [SRS_STAGES.GURU_2]: '#882D9E',     // Purple
  [SRS_STAGES.MASTER]: '#294DDB',     // Blue
  [SRS_STAGES.ENLIGHTENED]: '#FAB819', // Gold
  [SRS_STAGES.BURNED]: '#449944',     // Green
};
