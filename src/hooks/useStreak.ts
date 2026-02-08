'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  freezesAvailable: number;
  lastActivityDate: string | null;
}

interface UseStreakReturn extends StreakData {
  recordActivity: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Calculates the updated streak based on the last activity date.
 * - Same day: no change
 * - Yesterday: streak + 1
 * - 2 days ago + freeze available: use freeze, streak + 1
 * - More: streak broken, reset to 1
 */
function calculateStreak(
  lastActivityDate: string | null,
  currentStreak: number,
  freezesAvailable: number
): { newStreak: number; usedFreeze: boolean; isActive: boolean } {
  if (!lastActivityDate) {
    return { newStreak: 1, usedFreeze: false, isActive: true };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(lastActivityDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  const diffMs = today.getTime() - lastDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day - no change
    return { newStreak: currentStreak, usedFreeze: false, isActive: true };
  }

  if (diffDays === 1) {
    // Yesterday - increment streak
    return { newStreak: currentStreak + 1, usedFreeze: false, isActive: true };
  }

  if (diffDays === 2 && freezesAvailable > 0) {
    // 2 days ago with freeze available - use freeze
    return { newStreak: currentStreak + 1, usedFreeze: true, isActive: true };
  }

  // Streak broken
  return { newStreak: 1, usedFreeze: false, isActive: true };
}

export function useStreak(profileId: string | undefined): UseStreakReturn {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    isActive: false,
    freezesAvailable: 0,
    lastActivityDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch streak data from Supabase
  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    const fetchStreak = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('streaks')
          .select('*')
          .eq('profile_id', profileId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching streak:', error);
        }

        if (data) {
          // Check if streak is still active based on last activity
          const lastDate = data.last_activity_date;
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          let isActive = false;
          if (lastDate) {
            const last = new Date(lastDate);
            const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
            const diffDays = Math.floor(
              (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24)
            );
            isActive = diffDays <= 1;
          }

          setStreakData({
            currentStreak: data.current_streak ?? 0,
            longestStreak: data.longest_streak ?? 0,
            isActive,
            freezesAvailable: data.streak_freezes_available ?? 0,
            lastActivityDate: data.last_activity_date,
          });
        }
      } catch (err) {
        console.error('Failed to fetch streak:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreak();
  }, [profileId]);

  // Record activity and update streak
  const recordActivity = useCallback(async () => {
    if (!profileId) return;

    const { newStreak, usedFreeze } = calculateStreak(
      streakData.lastActivityDate,
      streakData.currentStreak,
      streakData.freezesAvailable
    );

    const newLongest = Math.max(streakData.longestStreak, newStreak);
    const newFreezes = usedFreeze
      ? streakData.freezesAvailable - 1
      : streakData.freezesAvailable;
    const nowISO = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('streaks')
        .upsert(
          {
            profile_id: profileId,
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity_date: nowISO,
            streak_freezes_available: newFreezes,
          },
          { onConflict: 'profile_id' }
        );

      if (error) {
        console.error('Error updating streak:', error);
        return;
      }

      setStreakData({
        currentStreak: newStreak,
        longestStreak: newLongest,
        isActive: true,
        freezesAvailable: newFreezes,
        lastActivityDate: nowISO,
      });
    } catch (err) {
      console.error('Failed to update streak:', err);
    }
  }, [profileId, streakData]);

  return {
    ...streakData,
    recordActivity,
    isLoading,
  };
}
