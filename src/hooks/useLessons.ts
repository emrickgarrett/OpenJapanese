'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  loadLessons,
  loadKanji,
  loadVocabulary,
  loadGrammar,
  getLessonItems,
} from '@/lib/curriculum/loader';
import { XP_REWARDS } from '@/lib/progression/xp';
import type {
  LessonGroup,
  JLPTLevel,
  KanjiItem,
  VocabItem,
  GrammarItem,
  CurriculumItem,
} from '@/types/curriculum';

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface LessonWithStatus extends LessonGroup {
  status: LessonStatus;
  completedItemCount: number;
  totalItemCount: number;
}

interface UseLessonsReturn {
  lessons: LessonWithStatus[];
  currentLesson: LessonWithStatus | null;
  isLoading: boolean;
  startLesson: (lessonId: string) => LessonWithStatus | undefined;
  completeLesson: (lessonId: string, itemIds: { id: string; type: string }[]) => Promise<number>;
  getLessonCurriculumItems: (
    lessonGroup: LessonGroup
  ) => Promise<{ kanji: KanjiItem[]; vocabulary: VocabItem[]; grammar: GrammarItem[]; all: CurriculumItem[] }>;
  kanjiData: KanjiItem[];
  vocabData: VocabItem[];
  grammarData: GrammarItem[];
}

export function useLessons(
  profileId: string | undefined,
  jlptLevel: JLPTLevel
): UseLessonsReturn {
  const [lessons, setLessons] = useState<LessonWithStatus[]>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonWithStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kanjiData, setKanjiData] = useState<KanjiItem[]>([]);
  const [vocabData, setVocabData] = useState<VocabItem[]>([]);
  const [grammarData, setGrammarData] = useState<GrammarItem[]>([]);

  // Load lessons and determine statuses
  const loadData = useCallback(async () => {
    if (!profileId) return;

    setIsLoading(true);
    try {
      // Load lesson groups and curriculum data for the level
      const [lessonGroups, kanji, vocab, grammar] = await Promise.all([
        loadLessons(jlptLevel),
        loadKanji(jlptLevel),
        loadVocabulary(jlptLevel),
        loadGrammar(jlptLevel),
      ]);

      setKanjiData(kanji);
      setVocabData(vocab);
      setGrammarData(grammar);

      // Fetch user progress for this level
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('item_id, item_type, srs_stage')
        .eq('profile_id', profileId);

      // Fetch profile for current level
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_level')
        .eq('id', profileId)
        .single();

      const userLevel = profileData?.current_level ?? 1;

      // Build a set of learned item IDs
      const learnedItems = new Set<string>();
      if (progressData) {
        for (const p of progressData) {
          learnedItems.add(`${p.item_type}:${p.item_id}`);
        }
      }

      // Build a set of completed lesson IDs
      const completedLessonIds = new Set<string>();

      // Sort lessons by order
      const sorted = [...lessonGroups].sort((a, b) => a.order - b.order);

      // Determine status for each lesson
      const lessonsWithStatus: LessonWithStatus[] = sorted.map((lesson) => {
        const totalItems =
          lesson.items.kanji.length +
          lesson.items.vocabulary.length +
          lesson.items.grammar.length;

        // Count how many items in this lesson the user has already learned
        let completedCount = 0;
        for (const id of lesson.items.kanji) {
          if (learnedItems.has(`kanji:${id}`)) completedCount++;
        }
        for (const id of lesson.items.vocabulary) {
          if (learnedItems.has(`vocabulary:${id}`)) completedCount++;
        }
        for (const id of lesson.items.grammar) {
          if (learnedItems.has(`grammar:${id}`)) completedCount++;
        }

        const isComplete = completedCount >= totalItems && totalItems > 0;
        if (isComplete) {
          completedLessonIds.add(lesson.id);
        }

        return {
          ...lesson,
          status: 'locked' as LessonStatus,
          completedItemCount: completedCount,
          totalItemCount: totalItems,
        };
      });

      // Now determine lock/available status
      for (const lesson of lessonsWithStatus) {
        const totalItems = lesson.totalItemCount;
        const completedCount = lesson.completedItemCount;

        if (completedCount >= totalItems && totalItems > 0) {
          lesson.status = 'completed';
        } else if (completedCount > 0 && completedCount < totalItems) {
          lesson.status = 'in_progress';
        } else {
          // Check prerequisites and app level
          const prerequisitesMet =
            lesson.prerequisites.length === 0 ||
            lesson.prerequisites.every((prereqId) =>
              completedLessonIds.has(prereqId)
            );
          const levelMet = userLevel >= lesson.appLevel;

          if (prerequisitesMet && levelMet) {
            lesson.status = 'available';
          } else {
            lesson.status = 'locked';
          }
        }
      }

      setLessons(lessonsWithStatus);
    } catch (err) {
      console.error('Error loading lessons:', err);
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, jlptLevel]);

  // Start a lesson
  const startLesson = useCallback(
    (lessonId: string): LessonWithStatus | undefined => {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (lesson && (lesson.status === 'available' || lesson.status === 'completed' || lesson.status === 'in_progress')) {
        setCurrentLesson(lesson);
        return lesson;
      }
      return undefined;
    },
    [lessons]
  );

  // Complete a lesson
  const completeLesson = useCallback(
    async (
      lessonId: string,
      itemIds: { id: string; type: string }[]
    ): Promise<number> => {
      if (!profileId) return 0;

      const now = new Date();
      // First review in 4 hours (Apprentice 1)
      const nextReview = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      // Find the lesson to get its JLPT level
      const lesson = lessons.find((l) => l.id === lessonId);
      const level = lesson?.jlptLevel ?? jlptLevel;

      // Create user_progress entries for each new item
      for (const item of itemIds) {
        // Check if progress already exists (upsert)
        const { data: existing } = await supabase
          .from('user_progress')
          .select('id')
          .eq('profile_id', profileId)
          .eq('item_type', item.type)
          .eq('item_id', item.id)
          .single();

        if (!existing) {
          await supabase.from('user_progress').insert({
            profile_id: profileId,
            item_type: item.type,
            item_id: item.id,
            jlpt_level: level,
            srs_stage: 1,
            ease_factor: 2.5,
            interval_days: 0.167, // ~4 hours
            repetitions: 0,
            next_review_at: nextReview.toISOString(),
            unlocked_at: now.toISOString(),
          });
        }
      }

      // Calculate XP earned
      const xpEarned = XP_REWARDS.LESSON_COMPLETE * itemIds.length;

      // Update profile total_xp
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', profileId)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({
            total_xp: profileData.total_xp + xpEarned,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
      }

      // Refresh lesson data
      await loadData();

      setCurrentLesson(null);
      return xpEarned;
    },
    [profileId, lessons, jlptLevel, loadData]
  );

  // Get curriculum items for a specific lesson
  const getLessonCurriculumItems = useCallback(
    async (lessonGroup: LessonGroup) => {
      let kanji = kanjiData;
      let vocab = vocabData;
      let grammar = grammarData;

      // If data isn't loaded yet, load it
      if (kanji.length === 0 && vocab.length === 0 && grammar.length === 0) {
        [kanji, vocab, grammar] = await Promise.all([
          loadKanji(lessonGroup.jlptLevel),
          loadVocabulary(lessonGroup.jlptLevel),
          loadGrammar(lessonGroup.jlptLevel),
        ]);
      }

      return getLessonItems(lessonGroup, kanji, vocab, grammar);
    },
    [kanjiData, vocabData, grammarData]
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    lessons,
    currentLesson,
    isLoading,
    startLesson,
    completeLesson,
    getLessonCurriculumItems,
    kanjiData,
    vocabData,
    grammarData,
  };
}
