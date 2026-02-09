'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LessonFlow from '@/components/lessons/LessonFlow';
import { useLessons } from '@/hooks/useLessons';
import { useAchievements } from '@/hooks/useAchievements';
import { useMascot } from '@/hooks/useMascot';
import { useProfile } from '@/providers/ProfileProvider';
import {
  loadLessons,
  loadKanji,
  loadVocabulary,
  loadGrammar,
  getLessonItems,
} from '@/lib/curriculum/loader';
import type {
  LessonGroup,
  CurriculumItem,
  VocabItem,
  GrammarItem,
  JLPTLevel,
} from '@/types/curriculum';

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { profile, refreshProfile } = useProfile();

  const [lessonGroup, setLessonGroup] = useState<LessonGroup | null>(null);
  const [lessonItems, setLessonItems] = useState<CurriculumItem[]>([]);
  const [allVocab, setAllVocab] = useState<VocabItem[]>([]);
  const [allGrammar, setAllGrammar] = useState<GrammarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentJlptLevel = (profile?.current_jlpt_level ?? 'N5') as JLPTLevel;
  const { completeLesson } = useLessons(profile?.id, currentJlptLevel);
  const { checkAfterAction } = useAchievements(profile?.id);
  const { triggerReaction } = useMascot();

  // Load lesson data
  useEffect(() => {
    async function loadLessonData() {
      if (!lessonId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Try loading lessons for each JLPT level to find the one matching our ID
        const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
        let foundLesson: LessonGroup | null = null;
        let foundLevel: JLPTLevel = 'N5';

        for (const level of levels) {
          try {
            const lessons = await loadLessons(level);
            const match = lessons.find((l) => l.id === lessonId);
            if (match) {
              foundLesson = match;
              foundLevel = level;
              break;
            }
          } catch {
            // Level data may not exist, continue
          }
        }

        if (!foundLesson) {
          setError('Lesson not found');
          return;
        }

        setLessonGroup(foundLesson);

        // Load curriculum items for this lesson
        const [kanji, vocab, grammar] = await Promise.all([
          loadKanji(foundLevel),
          loadVocabulary(foundLevel),
          loadGrammar(foundLevel),
        ]);

        const items = getLessonItems(foundLesson, kanji, vocab, grammar);
        setLessonItems(items.all);
        setAllVocab(vocab);
        setAllGrammar(grammar);
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError('Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    }

    loadLessonData();
  }, [lessonId]);

  // Handle lesson completion
  const handleComplete = useCallback(
    async (_xpEarned: number) => {
      if (!lessonGroup || !profile?.id) {
        router.push('/lessons');
        return;
      }

      try {
        // Await lesson completion so progress is persisted before navigating
        const itemIds: { id: string; type: string }[] = [
          ...lessonGroup.items.kanji.map((id) => ({ id, type: 'kanji' })),
          ...lessonGroup.items.vocabulary.map((id) => ({
            id,
            type: 'vocabulary',
          })),
          ...lessonGroup.items.grammar.map((id) => ({ id, type: 'grammar' })),
        ];

        await completeLesson(lessonGroup.id, itemIds);
      } catch (err) {
        console.error('Error completing lesson:', err);
      }

      // Navigate as soon as progress is saved — next lesson will be unlocked
      router.push('/lessons');

      // Fire-and-forget: profile refresh & achievements can happen in the background
      refreshProfile()
        .then(() => checkAfterAction())
        .then((newlyUnlocked) => {
          for (const achievement of newlyUnlocked) {
            triggerReaction('achievement.unlocked', { name: achievement.name });
          }
        })
        .catch((err) => {
          console.error('Error refreshing profile/achievements:', err);
        });
    },
    [lessonGroup, profile?.id, completeLesson, refreshProfile, checkAfterAction, triggerReaction, router]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  // Error state
  if (error || !lessonGroup) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            {error ?? 'Lesson not found'}
          </p>
          <p className="text-sm text-muted-foreground">
            We could not find this lesson.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/lessons')}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Lessons
        </Button>
      </div>
    );
  }

  // Empty lesson
  if (lessonItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            No items in this lesson
          </p>
          <p className="text-sm text-muted-foreground">
            This lesson doesn&apos;t have any content yet.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/lessons')}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Lessons
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-3xl"
    >
      {/* Back button (subtle, top-left) */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/lessons')}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-1 size-4" />
          Exit Lesson
        </Button>
      </div>

      <LessonFlow
        lessonGroup={lessonGroup}
        items={lessonItems}
        allVocab={allVocab}
        allGrammar={allGrammar}
        onComplete={handleComplete}
      />
    </motion.div>
  );
}
