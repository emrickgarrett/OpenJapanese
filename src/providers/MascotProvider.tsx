'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { MascotMood, MascotState } from '@/lib/mascot/types';
import { MASCOT_TRIGGERS } from '@/lib/mascot/triggers';
import { getRandomDialogue, getMoodForEvent } from '@/lib/mascot/personality';

// ── Priority map (higher = more important, should not be interrupted) ─────
const MOOD_PRIORITY: Record<MascotMood, number> = {
  celebrating: 6,
  excited: 5,
  happy: 4,
  teaching: 3,
  encouraging: 3,
  thinking: 2,
  sad: 2,
  sleeping: 1,
  idle: 0,
};

// ── Context value shape ───────────────────────────────────────────────────
export interface MascotContextValue extends MascotState {
  /** Fire a trigger event (e.g. 'review.correct') with optional template variables. */
  triggerReaction: (event: string, variables?: Record<string, string>) => void;
  /** Manually set the mood without a dialogue. */
  setMood: (mood: MascotMood) => void;
  /** Hide the mascot widget entirely. */
  hideMascot: () => void;
  /** Show the mascot widget. */
  showMascot: () => void;
  /** Toggle the speech bubble open/closed. */
  toggleBubble: () => void;
}

const DEFAULT_STATE: MascotState = {
  currentMood: 'idle',
  currentDialogue: null,
  isVisible: true,
  isBubbleOpen: false,
};

export const MascotContext = createContext<MascotContextValue | undefined>(
  undefined,
);

// ── Default duration when a trigger doesn't specify one ───────────────────
const DEFAULT_DURATION = 4000;
const DEBOUNCE_MS = 300;

// ── Provider ──────────────────────────────────────────────────────────────
export function MascotProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MascotState>(DEFAULT_STATE);

  // Refs for timer management
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePriorityRef = useRef<number>(0);

  /** Clear any pending reset-to-idle timer. */
  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  /** Schedule a return to idle after `ms` milliseconds. */
  const scheduleReset = useCallback(
    (ms: number) => {
      clearResetTimer();
      resetTimerRef.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          currentMood: 'idle',
          currentDialogue: null,
          isBubbleOpen: false,
        }));
        activePriorityRef.current = 0;
      }, ms);
    },
    [clearResetTimer],
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // ── triggerReaction ───────────────────────────────────────────────────
  const triggerReaction = useCallback(
    (event: string, variables?: Record<string, string>) => {
      const reaction = MASCOT_TRIGGERS[event];
      if (!reaction) return;

      const incomingPriority = MOOD_PRIORITY[reaction.mood] ?? 0;

      // Don't interrupt a higher-priority mood that's currently playing
      if (incomingPriority < activePriorityRef.current) {
        return;
      }

      // Debounce rapid-fire triggers of the same or lower priority
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const mood = getMoodForEvent(event);
        const dialogue = getRandomDialogue(event, variables);
        const duration = reaction.duration ?? DEFAULT_DURATION;

        activePriorityRef.current = incomingPriority;

        setState((prev) => ({
          ...prev,
          currentMood: mood,
          currentDialogue: dialogue,
          isBubbleOpen: true,
        }));

        scheduleReset(duration);
      }, DEBOUNCE_MS);
    },
    [scheduleReset],
  );

  // ── setMood ─────────────────────────────────────────────────────────
  const setMood = useCallback((mood: MascotMood) => {
    clearResetTimer();
    activePriorityRef.current = MOOD_PRIORITY[mood] ?? 0;
    setState((prev) => ({
      ...prev,
      currentMood: mood,
    }));
  }, [clearResetTimer]);

  // ── Visibility helpers ──────────────────────────────────────────────
  const hideMascot = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const showMascot = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: true }));
  }, []);

  const toggleBubble = useCallback(() => {
    setState((prev) => ({ ...prev, isBubbleOpen: !prev.isBubbleOpen }));
  }, []);

  // ── Provide value ───────────────────────────────────────────────────
  const value: MascotContextValue = {
    ...state,
    triggerReaction,
    setMood,
    hideMascot,
    showMascot,
    toggleBubble,
  };

  return (
    <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
  );
}
