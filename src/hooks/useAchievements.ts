'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ACHIEVEMENTS } from '@/lib/achievements/definitions';
import type { AchievementDefinition, UnlockedAchievement, AchievementCondition } from '@/types/achievement';

interface AchievementContext {
  itemsLearned: number;
  itemsBurned: number;
  streakDays: number;
  reviewsCompleted: number;
  perfectReviews: number;
  gamesPlayed: number;
  kanjiCount: number;
  vocabCount: number;
  appLevel: number;
  jlptLevel: string;
}

function checkCondition(condition: AchievementCondition, ctx: AchievementContext): boolean {
  switch (condition.type) {
    case 'items_learned':
      return ctx.itemsLearned >= condition.count;
    case 'items_burned':
      return ctx.itemsBurned >= condition.count;
    case 'streak_days':
      return ctx.streakDays >= condition.count;
    case 'reviews_completed':
      return ctx.reviewsCompleted >= condition.count;
    case 'perfect_reviews':
      return ctx.perfectReviews >= condition.count;
    case 'games_played':
      return ctx.gamesPlayed >= condition.count;
    case 'game_perfect':
      // Game perfect achievements are unlocked via explicit calls, not stat checks
      return false;
    case 'jlpt_level': {
      const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
      const currentIdx = levels.indexOf(ctx.jlptLevel);
      const requiredIdx = levels.indexOf(condition.level);
      return currentIdx >= requiredIdx && requiredIdx >= 0;
    }
    case 'app_level':
      return ctx.appLevel >= condition.level;
    case 'kanji_count':
      return ctx.kanjiCount >= condition.count;
    case 'vocab_count':
      return ctx.vocabCount >= condition.count;
    case 'speed_review':
      // Speed reviews are unlocked via explicit calls during review sessions
      return false;
    default:
      return false;
  }
}

interface UseAchievementsReturn {
  unlockedAchievements: UnlockedAchievement[];
  checkAndUnlock: (ctx: AchievementContext) => Promise<AchievementDefinition[]>;
  isLoading: boolean;
}

export function useAchievements(profileId: string | undefined): UseAchievementsReturn {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unlocked achievements from Supabase
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

  // Check all achievements against current context and unlock new ones
  const checkAndUnlock = useCallback(
    async (ctx: AchievementContext): Promise<AchievementDefinition[]> => {
      if (!profileId) return [];

      const unlockedKeys = new Set(unlockedAchievements.map((ua) => ua.achievementKey));
      const newlyUnlocked: AchievementDefinition[] = [];

      for (const achievement of ACHIEVEMENTS) {
        // Skip already unlocked
        if (unlockedKeys.has(achievement.key)) continue;

        // Check if condition is met
        if (checkCondition(achievement.condition, ctx)) {
          // Insert into Supabase
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
            console.error(`Error unlocking achievement ${achievement.key}:`, error);
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
    },
    [profileId, unlockedAchievements]
  );

  return {
    unlockedAchievements,
    checkAndUnlock,
    isLoading,
  };
}

export type { AchievementContext };
