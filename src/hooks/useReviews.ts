'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { processReview } from '@/lib/srs/engine';
import { loadKanji, loadVocabulary, loadGrammar } from '@/lib/curriculum/loader';
import { XP_REWARDS } from '@/lib/progression/xp';
import { SRS_STAGES } from '@/lib/srs/constants';
import type { UserProgress } from '@/types/progress';
import type { SRSUpdate } from '@/types/srs';
import type {
  CurriculumItem,
  KanjiItem,
  VocabItem,
  GrammarItem,
  ItemType,
  JLPTLevel,
} from '@/types/curriculum';

export interface ReviewItem {
  progress: UserProgress;
  curriculum: CurriculumItem;
  itemType: ItemType;
}

interface UseReviewsReturn {
  dueItems: ReviewItem[];
  isLoading: boolean;
  submitReview: (
    itemId: string,
    itemType: ItemType,
    reviewType: 'meaning' | 'reading',
    wasCorrect: boolean,
    responseTimeMs: number
  ) => Promise<SRSUpdate>;
  refreshReviews: () => Promise<void>;
}

export function useReviews(profileId: string | undefined): UseReviewsReturn {
  const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [curriculumData, setCurriculumData] = useState<{
    kanji: KanjiItem[];
    vocabulary: VocabItem[];
    grammar: GrammarItem[];
  }>({ kanji: [], vocabulary: [], grammar: [] });

  // Load all curriculum data for matching
  const loadCurriculum = useCallback(async () => {
    const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
    const allKanji: KanjiItem[] = [];
    const allVocab: VocabItem[] = [];
    const allGrammar: GrammarItem[] = [];

    for (const level of levels) {
      try {
        const [kanji, vocab, grammar] = await Promise.all([
          loadKanji(level),
          loadVocabulary(level),
          loadGrammar(level),
        ]);
        allKanji.push(...kanji);
        allVocab.push(...vocab);
        allGrammar.push(...grammar);
      } catch {
        // Level data may not exist yet, skip
      }
    }

    setCurriculumData({
      kanji: allKanji,
      vocabulary: allVocab,
      grammar: allGrammar,
    });

    return { kanji: allKanji, vocabulary: allVocab, grammar: allGrammar };
  }, []);

  // Match a progress entry to its curriculum item
  const matchCurriculumItem = useCallback(
    (
      itemId: string,
      itemType: ItemType,
      data: { kanji: KanjiItem[]; vocabulary: VocabItem[]; grammar: GrammarItem[] }
    ): CurriculumItem | undefined => {
      switch (itemType) {
        case 'kanji':
          return data.kanji.find((k) => k.id === itemId);
        case 'vocabulary':
          return data.vocabulary.find((v) => v.id === itemId);
        case 'grammar':
          return data.grammar.find((g) => g.id === itemId);
        default:
          return undefined;
      }
    },
    []
  );

  // Fetch due review items from Supabase
  const fetchDueItems = useCallback(async () => {
    if (!profileId) return;

    setIsLoading(true);
    try {
      const now = new Date().toISOString();

      const { data: progressItems, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('profile_id', profileId)
        .lte('next_review_at', now)
        .lt('srs_stage', SRS_STAGES.BURNED)
        .order('next_review_at', { ascending: true });

      if (error) {
        console.error('Error fetching reviews:', error);
        setDueItems([]);
        return;
      }

      // Load curriculum data if not already loaded
      let data = curriculumData;
      if (data.kanji.length === 0 && data.vocabulary.length === 0 && data.grammar.length === 0) {
        data = await loadCurriculum();
      }

      // Map progress entries to review items
      const items: ReviewItem[] = [];
      for (const progress of progressItems ?? []) {
        const mapped: UserProgress = {
          id: progress.id,
          profileId: progress.profile_id,
          itemType: progress.item_type as ItemType,
          itemId: progress.item_id,
          jlptLevel: (progress.jlpt_level ?? 'N5') as JLPTLevel,
          srsStage: progress.srs_stage,
          easeFactor: progress.ease_factor,
          intervalDays: progress.interval_days,
          repetitions: progress.repetitions,
          nextReviewAt: progress.next_review_at,
          lastReviewedAt: progress.last_reviewed_at,
          timesCorrect: progress.times_correct,
          timesIncorrect: progress.times_incorrect,
          meaningCorrect: progress.meaning_correct,
          meaningIncorrect: progress.meaning_incorrect,
          readingCorrect: progress.reading_correct,
          readingIncorrect: progress.reading_incorrect,
          unlockedAt: progress.unlocked_at,
          burnedAt: progress.burned_at,
        };

        const curriculum = matchCurriculumItem(
          mapped.itemId,
          mapped.itemType,
          data
        );

        if (curriculum) {
          items.push({
            progress: mapped,
            curriculum,
            itemType: mapped.itemType,
          });
        }
      }

      setDueItems(items);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setDueItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, curriculumData, loadCurriculum, matchCurriculumItem]);

  // Submit a review result
  const submitReview = useCallback(
    async (
      itemId: string,
      itemType: ItemType,
      reviewType: 'meaning' | 'reading',
      wasCorrect: boolean,
      responseTimeMs: number
    ): Promise<SRSUpdate> => {
      if (!profileId) {
        throw new Error('No profile ID provided');
      }

      // Find the current progress for this item
      const reviewItem = dueItems.find(
        (item) => item.progress.itemId === itemId && item.progress.itemType === itemType
      );

      const currentStage = reviewItem?.progress.srsStage ?? 1;
      const currentEaseFactor = reviewItem?.progress.easeFactor ?? 2.5;
      const currentRepetitions = reviewItem?.progress.repetitions ?? 0;

      // Quality: 5 for correct, 1 for incorrect (SM-2 scale)
      const quality = wasCorrect ? 5 : 1;

      const srsUpdate = processReview({
        quality,
        currentStage,
        easeFactor: currentEaseFactor,
        repetitions: currentRepetitions,
        interval: reviewItem?.progress.intervalDays ?? 0,
      });

      // Determine accuracy field updates
      const accuracyUpdates: Record<string, number> = {};
      if (wasCorrect) {
        accuracyUpdates.times_correct = (reviewItem?.progress.timesCorrect ?? 0) + 1;
        if (reviewType === 'meaning') {
          accuracyUpdates.meaning_correct = (reviewItem?.progress.meaningCorrect ?? 0) + 1;
        } else {
          accuracyUpdates.reading_correct = (reviewItem?.progress.readingCorrect ?? 0) + 1;
        }
      } else {
        accuracyUpdates.times_incorrect = (reviewItem?.progress.timesIncorrect ?? 0) + 1;
        if (reviewType === 'meaning') {
          accuracyUpdates.meaning_incorrect = (reviewItem?.progress.meaningIncorrect ?? 0) + 1;
        } else {
          accuracyUpdates.reading_incorrect = (reviewItem?.progress.readingIncorrect ?? 0) + 1;
        }
      }

      // Update user_progress in Supabase
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          srs_stage: srsUpdate.newStage,
          ease_factor: srsUpdate.newEaseFactor,
          interval_days: srsUpdate.newInterval,
          repetitions: srsUpdate.newRepetitions,
          next_review_at: srsUpdate.nextReviewAt.toISOString(),
          last_reviewed_at: new Date().toISOString(),
          burned_at:
            srsUpdate.newStage === SRS_STAGES.BURNED
              ? new Date().toISOString()
              : null,
          updated_at: new Date().toISOString(),
          ...accuracyUpdates,
        })
        .eq('profile_id', profileId)
        .eq('item_type', itemType)
        .eq('item_id', itemId);

      if (updateError) {
        console.error('Error updating progress:', updateError);
      }

      // Insert into review_history
      const { error: historyError } = await supabase
        .from('review_history')
        .insert({
          profile_id: profileId,
          item_type: itemType,
          item_id: itemId,
          review_type: reviewType,
          was_correct: wasCorrect,
          previous_stage: currentStage,
          new_stage: srsUpdate.newStage,
          response_time_ms: responseTimeMs,
          source: 'review',
        });

      if (historyError) {
        console.error('Error inserting review history:', historyError);
      }

      // Award XP
      const xpReward = wasCorrect
        ? XP_REWARDS.REVIEW_CORRECT
        : XP_REWARDS.REVIEW_INCORRECT;

      // Bonus XP for stage milestones
      let bonusXp = 0;
      if (wasCorrect) {
        if (srsUpdate.newStage === SRS_STAGES.GURU_1) bonusXp = XP_REWARDS.ITEM_GURU;
        else if (srsUpdate.newStage === SRS_STAGES.MASTER) bonusXp = XP_REWARDS.ITEM_MASTER;
        else if (srsUpdate.newStage === SRS_STAGES.ENLIGHTENED) bonusXp = XP_REWARDS.ITEM_ENLIGHTENED;
        else if (srsUpdate.newStage === SRS_STAGES.BURNED) bonusXp = XP_REWARDS.ITEM_BURNED;
      }

      const totalXpEarned = xpReward + bonusXp;

      // Update profile XP (increment)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', profileId)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({
            total_xp: profileData.total_xp + totalXpEarned,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
      }

      return srsUpdate;
    },
    [profileId, dueItems]
  );

  // Initial load
  useEffect(() => {
    fetchDueItems();
  }, [fetchDueItems]);

  return {
    dueItems,
    isLoading,
    submitReview,
    refreshReviews: fetchDueItems,
  };
}
