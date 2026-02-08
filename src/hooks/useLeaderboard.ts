'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { LeaderboardEntry } from '@/types/leaderboard';

type TimeFilter = 'all' | 'weekly' | 'daily';

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);

    try {
      if (timeFilter === 'all') {
        // Simple total_xp ordering
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, total_xp, current_level')
          .order('total_xp', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching leaderboard:', error);
          return;
        }

        if (data) {
          // We also need streak data for each profile
          const profileIds = data.map((p) => p.id);
          const { data: streakData } = await supabase
            .from('streaks')
            .select('profile_id, current_streak')
            .in('profile_id', profileIds);

          const streakMap = new Map<string, number>();
          if (streakData) {
            for (const s of streakData) {
              streakMap.set(s.profile_id, s.current_streak ?? 0);
            }
          }

          const mapped: LeaderboardEntry[] = data.map((row, index) => ({
            rank: index + 1,
            profileId: row.id,
            username: row.username ?? 'Anonymous',
            avatarUrl: row.avatar_url ?? '',
            totalXp: row.total_xp ?? 0,
            currentLevel: row.current_level ?? 0,
            currentStreak: streakMap.get(row.id) ?? 0,
          }));

          setEntries(mapped);
        }
      } else {
        // Time-filtered: sum xp_earned from daily_activity
        const now = new Date();
        let startDate: string;

        if (timeFilter === 'weekly') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
        } else {
          // daily
          startDate = now.toISOString().split('T')[0];
        }

        const { data: activityData, error: activityError } = await supabase
          .from('daily_activity')
          .select('profile_id, xp_earned')
          .gte('activity_date', startDate);

        if (activityError) {
          console.error('Error fetching activity data:', activityError);
          return;
        }

        if (activityData) {
          // Aggregate XP per profile
          const xpMap = new Map<string, number>();
          for (const row of activityData) {
            const current = xpMap.get(row.profile_id) ?? 0;
            xpMap.set(row.profile_id, current + (row.xp_earned ?? 0));
          }

          // Sort by XP descending
          const sorted = Array.from(xpMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50);

          if (sorted.length === 0) {
            setEntries([]);
            return;
          }

          const profileIds = sorted.map(([id]) => id);

          // Fetch profile details
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, total_xp, current_level')
            .in('id', profileIds);

          const { data: streakData } = await supabase
            .from('streaks')
            .select('profile_id, current_streak')
            .in('profile_id', profileIds);

          const profileMap = new Map(
            (profiles ?? []).map((p) => [p.id, p])
          );
          const streakMap = new Map<string, number>();
          if (streakData) {
            for (const s of streakData) {
              streakMap.set(s.profile_id, s.current_streak ?? 0);
            }
          }

          const mapped: LeaderboardEntry[] = sorted.map(([id, xp], index) => {
            const p = profileMap.get(id);
            return {
              rank: index + 1,
              profileId: id,
              username: p?.username ?? 'Anonymous',
              avatarUrl: p?.avatar_url ?? '',
              totalXp: xp,
              currentLevel: p?.current_level ?? 0,
              currentStreak: streakMap.get(id) ?? 0,
            };
          });

          setEntries(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    isLoading,
    timeFilter,
    setTimeFilter,
  };
}
