'use client';

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  getLevelFromXP,
  getXPProgress,
} from '@/lib/progression/xp';
import { useAudio } from '@/hooks/useAudio';
import { useMascot } from '@/hooks/useMascot';

// ── Types ──────────────────────────────────────────────────────────────────

export interface XPProgress {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

export interface AddXPResult {
  newTotalXP: number;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
}

export interface UseXPReturn {
  /** The user's total accumulated XP. */
  totalXP: number;
  /** The user's current level derived from totalXP. */
  currentLevel: number;
  /** Detailed progress within the current level. */
  xpProgress: XPProgress;
  /**
   * Award XP to the user. Updates Supabase, detects level-ups, plays
   * the level-up sound, and triggers the mascot reaction.
   *
   * @param amount  The amount of XP to add (must be > 0).
   * @param source  A human-readable label describing the source of the XP
   *                (e.g. "review_correct", "lesson_complete"). Used for the
   *                daily_activity record.
   * @returns A result object indicating whether a level-up occurred.
   */
  addXP: (amount: number, source: string) => Promise<AddXPResult>;
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * XP tracking hook.
 *
 * Manages the user's experience points, level, and progress. On each XP
 * award it:
 *   1. Writes the updated total_xp and current_level to the `profiles` table.
 *   2. Upserts a `daily_activity` row to increment today's `xp_earned`.
 *   3. Detects level-ups and plays the `levelUp` sound effect.
 *   4. Triggers the mascot `level.up` reaction on level-up.
 *
 * @param profileId  The profile UUID. If empty, `addXP` is a no-op.
 * @param initialXP  Optional starting XP (defaults to 0).
 */
export function useXP(profileId: string, initialXP: number = 0): UseXPReturn {
  const [totalXP, setTotalXP] = useState<number>(initialXP);

  const { playSound } = useAudio();
  const { triggerReaction } = useMascot();

  // Derived values
  const currentLevel = useMemo(() => getLevelFromXP(totalXP), [totalXP]);
  const xpProgress = useMemo(() => getXPProgress(totalXP), [totalXP]);

  // ── addXP ──────────────────────────────────────────────────────────────

  const addXP = useCallback(
    async (amount: number, source: string): Promise<AddXPResult> => {
      if (amount <= 0 || !profileId) {
        return {
          newTotalXP: totalXP,
          leveledUp: false,
          previousLevel: currentLevel,
          newLevel: currentLevel,
        };
      }

      const previousLevel = currentLevel;
      const newTotalXP = totalXP + amount;
      const newLevel = getLevelFromXP(newTotalXP);
      const leveledUp = newLevel > previousLevel;

      // Optimistically update local state
      setTotalXP(newTotalXP);

      // ── Persist to Supabase (fire-and-forget with error logging) ─────

      // 1. Update the profile
      supabase
        .from('profiles')
        .update({
          total_xp: newTotalXP,
          current_level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .then(({ error }) => {
          if (error) {
            console.warn('[useXP] Failed to update profile XP:', error);
          }
        });

      // 2. Upsert today's daily_activity xp_earned
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      supabase
        .rpc('increment_daily_xp', {
          p_profile_id: profileId,
          p_date: today,
          p_xp: amount,
          p_source: source,
        })
        .then(({ error }) => {
          if (error) {
            // Fallback: try a simple upsert if the RPC doesn't exist
            supabase
              .from('daily_activity')
              .upsert(
                {
                  profile_id: profileId,
                  activity_date: today,
                  xp_earned: amount,
                },
                { onConflict: 'profile_id,activity_date' },
              )
              .then(({ error: upsertError }) => {
                if (upsertError) {
                  console.warn(
                    '[useXP] Failed to update daily activity:',
                    upsertError,
                  );
                }
              });
          }
        });

      // ── Level-up side effects ────────────────────────────────────────

      if (leveledUp) {
        playSound('levelUp');
        triggerReaction('level.up', { level: String(newLevel) });
      }

      return {
        newTotalXP,
        leveledUp,
        previousLevel,
        newLevel,
      };
    },
    [totalXP, currentLevel, profileId, playSound, triggerReaction],
  );

  return {
    totalXP,
    currentLevel,
    xpProgress,
    addXP,
  };
}
