import type { MascotMood } from './types';
import { MASCOT_TRIGGERS } from './triggers';

/**
 * Pick a random dialogue from the given trigger key and replace any
 * `{variable}` placeholders with the supplied values.
 *
 * Returns an empty string if the trigger key is not found.
 */
export function getRandomDialogue(
  trigger: string,
  variables?: Record<string, string>,
): string {
  const reaction = MASCOT_TRIGGERS[trigger];
  if (!reaction || reaction.dialogues.length === 0) {
    return '';
  }

  const index = Math.floor(Math.random() * reaction.dialogues.length);
  let dialogue = reaction.dialogues[index];

  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      dialogue = dialogue.replaceAll(`{${key}}`, value);
    }
  }

  return dialogue;
}

/**
 * Resolve the mood associated with a trigger event.
 * Falls back to 'idle' when the trigger key is unknown.
 */
export function getMoodForEvent(event: string): MascotMood {
  const reaction = MASCOT_TRIGGERS[event];
  return reaction?.mood ?? 'idle';
}

/**
 * Return the appropriate greeting trigger based on the current time of day.
 *
 * - Before 6 AM  -> morning greeting (early bird)
 * - 6 AM - 12 PM -> morning greeting
 * - 12 PM - 6 PM -> app open (general welcome)
 * - 6 PM - 10 PM -> app open (evening)
 * - After 10 PM  -> night greeting
 */
export function getTimeBasedGreeting(): {
  trigger: string;
  variables?: Record<string, string>;
} {
  const hour = new Date().getHours();

  if (hour < 6) {
    // Very early morning
    return { trigger: 'morning.greeting' };
  }

  if (hour < 12) {
    // Normal morning
    return { trigger: 'morning.greeting' };
  }

  if (hour < 18) {
    // Afternoon
    return { trigger: 'app.open' };
  }

  if (hour < 22) {
    // Evening
    return { trigger: 'app.open' };
  }

  // Late night
  return { trigger: 'night.greeting' };
}
