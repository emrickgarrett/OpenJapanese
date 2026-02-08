/**
 * Sound effect registry.
 *
 * Maps logical sound names to their file paths relative to the /public
 * directory. All paths are resolved automatically by Next.js at runtime.
 */
export const SOUNDS = {
  correct: '/audio/sfx/correct.mp3',
  incorrect: '/audio/sfx/incorrect.mp3',
  levelUp: '/audio/sfx/level-up.mp3',
  achievement: '/audio/sfx/achievement.mp3',
  streak: '/audio/sfx/streak.mp3',
  combo: '/audio/sfx/combo.mp3',
  click: '/audio/sfx/click.mp3',
  gameStart: '/audio/sfx/game-start.mp3',
  gameEnd: '/audio/sfx/game-end.mp3',
  cardFlip: '/audio/sfx/card-flip.mp3',
  woosh: '/audio/sfx/woosh.mp3',
} as const;

export type SoundName = keyof typeof SOUNDS;
