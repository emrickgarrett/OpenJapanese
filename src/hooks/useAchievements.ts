'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ACHIEVEMENTS } from '@/lib/achievements/definitions';
import { evaluateCondition, type AchievementContext } from '@/lib/achievements/checker';
import { getLevelFromXP } from '@/lib/progression/xp';
import type { AchievementDefinition, UnlockedAchievement } from '@/types/achievement';
import type { GameType } from '@/types/game';

interface UseAchievementsReturn {
  unlockedAchievements: UnlockedAchievement[];
  /** Check achievements after any user action. Gathers stats from DB automatically. */
  checkAfterAction: (overrides?: Partial<AchievementContext>) => Promise<AchievementDefinition[]>;
  isLoading: boolean;
}

/**
 * Build an AchievementContext from the user's Supabase data.
 * Gathers all stats needed to evaluate every achievement condition.
 */
async function buildContext(profileId: string): Promise<AchievementContext> {
  const [profileRes, progressRes, streakRes, dailyRes] = await Promise.all([
    supabase.from('profiles').select('total_xp').eq('id', profileId).single(),
    supabase.from('user_progress').select('item_type, srs_stage').eq('profile_id', profileId),
    supabase.from('streaks').select('current_streak').eq('profile_id', profileId).single(),
    supabase.from('daily_activity').select('reviews_completed, games_played').eq('profile_id', profileId),
  ]);

  const profile = profileRes.data;
  const progress = progressRes.data ?? [];
  const dailyRows = dailyRes.data ?? [];

  const itemsLearned = progress.length;
  const kanjiCount = progress.filter((p) => p.item_type === 'kanji').length;
  const vocabCount = progress.filter((p) => p.item_type === 'vocabulary').length;
  const itemsBurned = progress.filter((p) => p.srs_stage === 9).length;

  const totalReviews = dailyRows.reduce((sum, r) => sum + (r.reviews_completed ?? 0), 0);
  const totalGamesPlayed = dailyRows.reduce((sum, r) => sum + (r.games_played ?? 0), 0);

  const appLevel = profile ? getLevelFromXP(profile.total_xp) : 0;
  const streakDays = streakRes.data?.current_streak ?? 0;

  return {
    itemsLearned,
    itemsBurned,
    streakDays,
    reviewsCompleted: totalReviews,
    consecutiveCorrect: 0,
    gamesPlayed: totalGamesPlayed,
    kanjiCount,
    vocabCount,
    gameScores: {},
    gameTypesPlayed: new Set<GameType>(),
    appLevel,
    jlptLevelsMastered: new Set<string>(),
    speedReviewBests: new Set<string>(),
  };
}

export function useAchievements(profileId: string | undefined): UseAchievementsReturn {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unlocked achievements from Supabase on mount
  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('unlocked_achievements')
          .select('*')
          .eq('profile_id', profileId);

        if (error) {
          console.error('Error fetching achievements:', error);
        }

        if (data) {
          const mapped: UnlockedAchievement[] = data.map((row) => ({
            id: row.id,
            profileId: row.profile_id,
            achievementKey: row.achievement_key,
            unlockedAt: row.unlocked_at,
          }));
          setUnlockedAchievements(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch achievements:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [profileId]);

  /**
   * Check all achievements against current user stats from DB.
   * Pass optional overrides for context fields not stored in DB
   * (e.g. gameScores for a game that was just completed).
   */
  const checkAfterAction = useCallback(
    async (overrides?: Partial<AchievementContext>): Promise<AchievementDefinition[]> => {
      if (!profileId) return [];

      try {
        const ctx = await buildContext(profileId);

        // Merge overrides (e.g. game scores from current session)
        if (overrides) {
          Object.assign(ctx, overrides);
        }

        const unlockedKeys = new Set(unlockedAchievements.map((ua) => ua.achievementKey));
        const newlyUnlocked: AchievementDefinition[] = [];

        for (const achievement of ACHIEVEMENTS) {
          if (unlockedKeys.has(achievement.key)) continue;

          if (evaluateCondition(achievement.condition, ctx)) {
            const { data, error } = await supabase
              .from('unlocked_achievements')
              .insert({
                profile_id: profileId,
                achievement_key: achievement.key,
                unlocked_at: new Date().toISOString(),
              })
              .select('*')
              .single();

            if (error) {
              // Duplicate key is fine (race condition), skip silently
              if (error.code !== '23505') {
                console.error(`Error unlocking achievement ${achievement.key}:`, error);
              }
              continue;
            }

            if (data) {
              const newUnlocked: UnlockedAchievement = {
                id: data.id,
                profileId: data.profile_id,
                achievementKey: data.achievement_key,
                unlockedAt: data.unlocked_at,
              };
              setUnlockedAchievements((prev) => [...prev, newUnlocked]);
              newlyUnlocked.push(achievement);
            }
          }
        }

        return newlyUnlocked;
      } catch (err) {
        console.error('Failed to check achievements:', err);
        return [];
      }
    },
    [profileId, unlockedAchievements]
  );

  return {
    unlockedAchievements,
    checkAfterAction,
    isLoading,
  };
}

export type { AchievementContext };
