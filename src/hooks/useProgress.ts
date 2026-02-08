'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { DailyActivity } from '@/types/progress';

interface SRSBreakdown {
  [stage: number]: number;
}

interface UseProgressReturn {
  totalKanji: number;
  totalVocab: number;
  totalGrammar: number;
  srsBreakdown: SRSBreakdown;
  dailyActivity: DailyActivity[];
  accuracy: number;
  reviewsToday: number;
  totalReviews: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useProgress(profileId: string | undefined): UseProgressReturn {
  const [totalKanji, setTotalKanji] = useState(0);
  const [totalVocab, setTotalVocab] = useState(0);
  const [totalGrammar, setTotalGrammar] = useState(0);
  const [srsBreakdown, setSrsBreakdown] = useState<SRSBreakdown>({});
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [reviewsToday, setReviewsToday] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch all user progress items
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('item_type, srs_stage, times_correct, times_incorrect')
        .eq('profile_id', profileId);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
      }

      if (progressData) {
        // Count items by type
        let kanji = 0;
        let vocab = 0;
        let grammar = 0;
        const breakdown: SRSBreakdown = {};
        let totalCorrect = 0;
        let totalIncorrect = 0;

        for (const item of progressData) {
          // Count by type
          if (item.item_type === 'kanji') kanji++;
          else if (item.item_type === 'vocabulary') vocab++;
          else if (item.item_type === 'grammar') grammar++;

          // SRS breakdown
          const stage = item.srs_stage ?? 0;
          breakdown[stage] = (breakdown[stage] || 0) + 1;

          // Accuracy
          totalCorrect += item.times_correct ?? 0;
          totalIncorrect += item.times_incorrect ?? 0;
        }

        setTotalKanji(kanji);
        setTotalVocab(vocab);
        setTotalGrammar(grammar);
        setSrsBreakdown(breakdown);

        const totalAttempts = totalCorrect + totalIncorrect;
        setAccuracy(totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0);
      }

      // Fetch daily activity for the last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dateStr = ninetyDaysAgo.toISOString().split('T')[0];

      const { data: activityData, error: activityError } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('profile_id', profileId)
        .gte('activity_date', dateStr)
        .order('activity_date', { ascending: true });

      if (activityError) {
        console.error('Error fetching daily activity:', activityError);
      }

      if (activityData) {
        const mapped: DailyActivity[] = activityData.map((row) => ({
          activityDate: row.activity_date,
          reviewsCompleted: row.reviews_completed ?? 0,
          lessonsCompleted: row.lessons_completed ?? 0,
          gamesPlayed: row.games_played ?? 0,
          xpEarned: row.xp_earned ?? 0,
          itemsLearned: row.items_learned ?? 0,
          itemsBurned: row.items_burned ?? 0,
          timeSpentSeconds: row.time_spent_seconds ?? 0,
        }));
        setDailyActivity(mapped);

        // Reviews today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayActivity = mapped.find((d) => d.activityDate === todayStr);
        setReviewsToday(todayActivity?.reviewsCompleted ?? 0);
      }

      // Fetch total reviews from review_history count
      const { count, error: countError } = await supabase
        .from('review_history')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId);

      if (countError) {
        console.error('Error fetching review count:', countError);
      }

      setTotalReviews(count ?? 0);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    totalKanji,
    totalVocab,
    totalGrammar,
    srsBreakdown,
    dailyActivity,
    accuracy,
    reviewsToday,
    totalReviews,
    isLoading,
    refresh: fetchProgress,
  };
}
