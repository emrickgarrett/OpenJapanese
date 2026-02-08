'use client';

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewInput from '@/components/reviews/ReviewInput';
import ReviewResult from '@/components/reviews/ReviewResult';
import ReviewSummary from '@/components/reviews/ReviewSummary';
import { XP_REWARDS } from '@/lib/progression/xp';
import type { ReviewItem } from '@/hooks/useReviews';
import type { ItemType, KanjiItem, VocabItem, GrammarItem, CurriculumItem } from '@/types/curriculum';
import type { SRSUpdate } from '@/types/srs';

interface ReviewSessionProps {
  items: ReviewItem[];
  onSubmitReview: (
    itemId: string,
    itemType: ItemType,
    reviewType: 'meaning' | 'reading',
    wasCorrect: boolean,
    responseTimeMs: number
  ) => Promise<SRSUpdate>;
  onComplete: () => void;
}

type ReviewStep = 'meaning' | 'reading';

interface ReviewQueueItem {
  reviewItem: ReviewItem;
  step: ReviewStep;
  answered: boolean;
}

interface StageChange {
  itemId: string;
  itemDisplay: string;
  previousStage: number;
  newStage: number;
}

// Type guards
function isKanjiItem(item: CurriculumItem): item is KanjiItem {
  return 'character' in item && 'onyomi' in item;
}

function isVocabItem(item: CurriculumItem): item is VocabItem {
  return 'word' in item && 'reading' in item && 'partOfSpeech' in item;
}

function isGrammarItem(item: CurriculumItem): item is GrammarItem {
  return 'structure' in item && 'explanation' in item;
}

function getItemDisplay(item: CurriculumItem): string {
  if (isKanjiItem(item)) return item.character;
  if (isVocabItem(item)) return item.word;
  if (isGrammarItem(item)) return item.title;
  return '';
}

function getCorrectMeanings(item: CurriculumItem): string[] {
  if (isKanjiItem(item)) return item.meanings;
  if (isVocabItem(item)) return item.meanings;
  if (isGrammarItem(item)) return [item.meaning];
  return [];
}

function getCorrectReadings(item: CurriculumItem): string[] {
  if (isKanjiItem(item)) return [...item.onyomi, ...item.kunyomi];
  if (isVocabItem(item)) return [item.reading];
  return [];
}

function checkMeaning(answer: string, item: CurriculumItem): boolean {
  const meanings = getCorrectMeanings(item);
  const normalized = answer.toLowerCase().trim();
  return meanings.some((m) => m.toLowerCase().trim() === normalized);
}

function checkReading(answer: string, item: CurriculumItem): boolean {
  const readings = getCorrectReadings(item);
  const normalized = answer.trim();
  return readings.some((r) => r.trim() === normalized);
}

// Determine if an item needs a reading review
function needsReadingReview(item: ReviewItem): boolean {
  // Grammar items typically don't have a reading to review
  return item.itemType !== 'grammar';
}

export default function ReviewSession({
  items,
  onSubmitReview,
  onComplete,
}: ReviewSessionProps) {
  // Build the review queue: meaning + reading for each item
  const reviewQueue = useMemo((): ReviewQueueItem[] => {
    const queue: ReviewQueueItem[] = [];
    for (const reviewItem of items) {
      queue.push({ reviewItem, step: 'meaning', answered: false });
      if (needsReadingReview(reviewItem)) {
        queue.push({ reviewItem, step: 'reading', answered: false });
      }
    }
    // Shuffle
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    return queue;
  }, [items]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [promotions, setPromotions] = useState<StageChange[]>([]);
  const [demotions, setDemotions] = useState<StageChange[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    correctAnswers: string[];
    previousStage: number;
    newStage: number;
  } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const totalReviews = reviewQueue.length;
  const progressPercent =
    totalReviews > 0 ? (answeredCount / totalReviews) * 100 : 0;

  const currentQueueItem = currentIndex < reviewQueue.length ? reviewQueue[currentIndex] : null;

  // Handle answer submission
  const handleSubmit = useCallback(
    async (answer: string) => {
      if (!currentQueueItem) return;

      const { reviewItem, step } = currentQueueItem;
      const responseTimeMs = Date.now() - startTime;

      let wasCorrect = false;
      let correctAnswers: string[] = [];

      if (step === 'meaning') {
        wasCorrect = checkMeaning(answer, reviewItem.curriculum);
        correctAnswers = getCorrectMeanings(reviewItem.curriculum);
      } else {
        wasCorrect = checkReading(answer, reviewItem.curriculum);
        correctAnswers = getCorrectReadings(reviewItem.curriculum);
      }

      // Submit the review to the backend
      let srsUpdate: SRSUpdate;
      try {
        srsUpdate = await onSubmitReview(
          reviewItem.progress.itemId,
          reviewItem.progress.itemType,
          step,
          wasCorrect,
          responseTimeMs
        );
      } catch (err) {
        console.error('Error submitting review:', err);
        // Default SRS update for display if the API fails
        srsUpdate = {
          newStage: reviewItem.progress.srsStage,
          newEaseFactor: reviewItem.progress.easeFactor,
          newInterval: reviewItem.progress.intervalDays,
          newRepetitions: reviewItem.progress.repetitions,
          nextReviewAt: new Date(),
        };
      }

      // Update stats
      if (wasCorrect) {
        setCorrectCount((prev) => prev + 1);
        setXpEarned((prev) => prev + XP_REWARDS.REVIEW_CORRECT);
      } else {
        setIncorrectCount((prev) => prev + 1);
        setXpEarned((prev) => prev + XP_REWARDS.REVIEW_INCORRECT);
      }
      setAnsweredCount((prev) => prev + 1);

      // Track stage changes
      const previousStage = reviewItem.progress.srsStage;
      const newStage = srsUpdate.newStage;
      const itemDisplay = getItemDisplay(reviewItem.curriculum);

      if (newStage > previousStage) {
        setPromotions((prev) => {
          // Avoid duplicates for same item
          if (prev.some((p) => p.itemId === reviewItem.progress.itemId)) return prev;
          return [...prev, { itemId: reviewItem.progress.itemId, itemDisplay, previousStage, newStage }];
        });
      } else if (newStage < previousStage) {
        setDemotions((prev) => {
          if (prev.some((d) => d.itemId === reviewItem.progress.itemId)) return prev;
          return [...prev, { itemId: reviewItem.progress.itemId, itemDisplay, previousStage, newStage }];
        });
      }

      // Show result
      setLastResult({
        isCorrect: wasCorrect,
        correctAnswers,
        previousStage,
        newStage,
      });
      setShowResult(true);
    },
    [currentQueueItem, onSubmitReview, startTime]
  );

  // Handle continue after result
  const handleContinue = useCallback(() => {
    setShowResult(false);
    setLastResult(null);

    // Move to next item
    const nextIndex = currentIndex + 1;
    if (nextIndex >= reviewQueue.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, reviewQueue.length]);

  // Render summary when complete
  if (isComplete) {
    return (
      <ReviewSummary
        stats={{
          total: answeredCount,
          correct: correctCount,
          incorrect: incorrectCount,
          xpEarned,
          promotions,
          demotions,
        }}
      />
    );
  }

  // No current item (should not happen)
  if (!currentQueueItem) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {answeredCount} / {totalReviews}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Review card */}
      <ReviewCard
        item={currentQueueItem.reviewItem.curriculum}
        itemType={currentQueueItem.reviewItem.itemType}
        srsStage={currentQueueItem.reviewItem.progress.srsStage}
      />

      {/* Input or result */}
      <AnimatePresence mode="wait">
        {showResult && lastResult ? (
          <ReviewResult
            key="result"
            isCorrect={lastResult.isCorrect}
            correctAnswers={lastResult.correctAnswers}
            previousStage={lastResult.previousStage}
            newStage={lastResult.newStage}
            onContinue={handleContinue}
          />
        ) : (
          <ReviewInput
            key={`input-${currentIndex}-${currentQueueItem.step}`}
            type={currentQueueItem.step}
            onSubmit={handleSubmit}
            disabled={showResult}
          />
        )}
      </AnimatePresence>

      {/* Score display */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-green-500" />
          {correctCount} correct
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-red-500" />
          {incorrectCount} incorrect
        </span>
      </div>
    </div>
  );
}
