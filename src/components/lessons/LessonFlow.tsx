'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import KanjiDisplay from '@/components/lessons/KanjiDisplay';
import VocabDisplay from '@/components/lessons/VocabDisplay';
import GrammarDisplay from '@/components/lessons/GrammarDisplay';
import type {
  LessonGroup,
  CurriculumItem,
  KanjiItem,
  VocabItem,
  GrammarItem,
} from '@/types/curriculum';

type LessonPhase = 'intro' | 'teaching' | 'quiz' | 'summary';

interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  itemIndex: number;
}

interface LessonFlowProps {
  lessonGroup: LessonGroup;
  items: CurriculumItem[];
  onComplete: (xpEarned: number) => void;
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

function getItemMeanings(item: CurriculumItem): string[] {
  if (isKanjiItem(item)) return item.meanings;
  if (isVocabItem(item)) return item.meanings;
  if (isGrammarItem(item)) return [item.meaning];
  return [];
}

export default function LessonFlow({
  lessonGroup,
  items,
  onComplete,
}: LessonFlowProps) {
  const [phase, setPhase] = useState<LessonPhase>('intro');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizIncorrect, setQuizIncorrect] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Generate quiz questions
  const quizQuestions = useMemo((): QuizQuestion[] => {
    if (items.length === 0) return [];

    const questions: QuizQuestion[] = [];
    const numQuestions = Math.min(items.length, 5);

    // Shuffle items for quiz
    const shuffled = [...items]
      .map((item, idx) => ({ item, idx }))
      .sort(() => Math.random() - 0.5)
      .slice(0, numQuestions);

    for (const { item, idx } of shuffled) {
      const display = getItemDisplay(item);
      const meanings = getItemMeanings(item);
      const correctMeaning = meanings[0];

      // Generate wrong answers from other items
      const wrongAnswers: string[] = [];
      const otherItems = items.filter((_, i) => i !== idx);

      for (const other of otherItems) {
        const otherMeanings = getItemMeanings(other);
        if (otherMeanings.length > 0 && !meanings.includes(otherMeanings[0])) {
          wrongAnswers.push(otherMeanings[0]);
        }
        if (wrongAnswers.length >= 3) break;
      }

      // If not enough wrong answers from lesson items, add generic ones
      const fillerAnswers = [
        'water', 'fire', 'mountain', 'tree', 'person',
        'big', 'small', 'go', 'come', 'see',
        'eat', 'read', 'write', 'speak', 'listen',
      ];

      while (wrongAnswers.length < 3) {
        const filler =
          fillerAnswers[Math.floor(Math.random() * fillerAnswers.length)];
        if (!wrongAnswers.includes(filler) && filler !== correctMeaning) {
          wrongAnswers.push(filler);
        }
      }

      // Shuffle options
      const options = [correctMeaning, ...wrongAnswers.slice(0, 3)].sort(
        () => Math.random() - 0.5
      );

      let questionText = `What does "${display}" mean?`;
      if (isGrammarItem(item)) {
        questionText = `What does "${item.title}" express?`;
      }

      questions.push({
        question: questionText,
        correctAnswer: correctMeaning,
        options,
        itemIndex: idx,
      });
    }

    return questions;
  }, [items]);

  // Handle teaching navigation
  const goNextItem = useCallback(() => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
    } else {
      // Move to quiz phase
      setPhase('quiz');
    }
  }, [currentItemIndex, items.length]);

  const goPrevItem = useCallback(() => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex((prev) => prev - 1);
    }
  }, [currentItemIndex]);

  // Handle quiz answer
  const handleQuizAnswer = useCallback(
    (answer: string) => {
      if (isAnswerRevealed) return;

      setSelectedAnswer(answer);
      setIsAnswerRevealed(true);

      const isCorrect = answer === quizQuestions[quizIndex].correctAnswer;
      if (isCorrect) {
        setQuizCorrect((prev) => prev + 1);
      } else {
        setQuizIncorrect((prev) => prev + 1);
      }

      // Auto-advance after a brief delay
      setTimeout(() => {
        if (quizIndex < quizQuestions.length - 1) {
          setQuizIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setIsAnswerRevealed(false);
        } else {
          setPhase('summary');
        }
      }, 1500);
    },
    [isAnswerRevealed, quizIndex, quizQuestions]
  );

  // Calculate totals
  const totalQuestions = quizQuestions.length;
  const accuracy =
    totalQuestions > 0
      ? Math.round((quizCorrect / totalQuestions) * 100)
      : 100;
  const xpEarned = items.length * 10; // XP_REWARDS.LESSON_COMPLETE per item

  // Slide animation variants
  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  // ─── Phase: Introduction ───────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4"
      >
        {/* Mascot avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
          className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-5xl"
        >
          🦊
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Let&apos;s learn {lessonGroup.title}!
          </h1>
          <p className="text-muted-foreground">{lessonGroup.description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="size-4" />
            <span>{items.length} items</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>~{lessonGroup.estimatedMinutes} min</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            size="lg"
            onClick={() => setPhase('teaching')}
            className="gap-2 px-8 text-lg"
          >
            <Sparkles className="size-5" />
            Start Learning
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Phase: Teaching ──────────────────────────────────────────────────────
  if (phase === 'teaching') {
    const currentItem = items[currentItemIndex];
    const progressPercent = ((currentItemIndex + 1) / items.length) * 100;

    return (
      <div className="flex flex-col gap-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Item {currentItemIndex + 1} of {items.length}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Item display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItemIndex}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {isKanjiItem(currentItem) && <KanjiDisplay kanji={currentItem} />}
            {isVocabItem(currentItem) && <VocabDisplay vocab={currentItem} />}
            {isGrammarItem(currentItem) && (
              <GrammarDisplay grammar={currentItem} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={goPrevItem}
            disabled={currentItemIndex === 0}
          >
            Back
          </Button>
          <Button onClick={goNextItem} className="gap-2">
            {currentItemIndex === items.length - 1 ? (
              <>
                Start Quiz
                <Sparkles className="size-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Phase: Quiz ──────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    // If no quiz questions (e.g., only 1 item), skip to summary
    if (quizQuestions.length === 0) {
      setPhase('summary');
      return null;
    }

    const currentQuestion = quizQuestions[quizIndex];
    const progressPercent = ((quizIndex + 1) / quizQuestions.length) * 100;

    return (
      <div className="flex flex-col gap-6">
        {/* Quiz header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              Quick Quiz
            </Badge>
            <span className="text-sm text-muted-foreground">
              {quizIndex + 1} / {quizQuestions.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={quizIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="space-y-6 py-8">
                <h2 className="text-center text-xl font-semibold text-foreground">
                  {currentQuestion.question}
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectOption =
                      option === currentQuestion.correctAnswer;
                    const showResult = isAnswerRevealed;

                    let optionStyle = '';
                    if (showResult && isCorrectOption) {
                      optionStyle =
                        'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300';
                    } else if (showResult && isSelected && !isCorrectOption) {
                      optionStyle =
                        'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 animate-shake';
                    }

                    return (
                      <motion.button
                        key={option}
                        whileHover={!isAnswerRevealed ? { scale: 1.02 } : undefined}
                        whileTap={!isAnswerRevealed ? { scale: 0.98 } : undefined}
                        onClick={() => handleQuizAnswer(option)}
                        disabled={isAnswerRevealed}
                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                          optionStyle ||
                          'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                        } ${isAnswerRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {showResult && isCorrectOption && (
                          <CheckCircle2 className="size-5 shrink-0 text-green-500" />
                        )}
                        {showResult && isSelected && !isCorrectOption && (
                          <XCircle className="size-5 shrink-0 text-red-500" />
                        )}
                        <span>{option}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Result feedback */}
                <AnimatePresence>
                  {isAnswerRevealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-center"
                    >
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          Correct!
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          The correct answer is{' '}
                          <span className="font-semibold text-foreground">
                            {currentQuestion.correctAnswer}
                          </span>
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Score tracker */}
        <div className="flex justify-center gap-6 text-sm">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-4" />
            {quizCorrect}
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <XCircle className="size-4" />
            {quizIncorrect}
          </span>
        </div>
      </div>
    );
  }

  // ─── Phase: Summary ───────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4"
    >
      {/* Celebration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 10,
          delay: 0.2,
        }}
      >
        <Trophy className="size-20 text-amber-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Lesson Complete!
        </h1>
        <p className="text-muted-foreground">{lessonGroup.title}</p>
      </motion.div>

      {/* XP animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="flex items-center gap-2 rounded-full bg-amber-100 px-6 py-3 dark:bg-amber-950/40"
      >
        <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
          +{xpEarned} XP
        </span>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="grid w-full max-w-sm grid-cols-3 gap-4"
      >
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-foreground">
              {items.length}
            </span>
            <span className="text-xs text-muted-foreground">Items Learned</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {accuracy}%
            </span>
            <span className="text-xs text-muted-foreground">Accuracy</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-foreground">
              {quizCorrect}/{totalQuestions}
            </span>
            <span className="text-xs text-muted-foreground">Quiz Score</span>
          </CardContent>
        </Card>
      </motion.div>

      {/* Items learned list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="w-full max-w-sm"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Items Learned
        </p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item.id} variant="secondary" className="font-japanese">
              {getItemDisplay(item)}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Button
          size="lg"
          onClick={() => onComplete(xpEarned)}
          className="gap-2 px-8 text-lg"
        >
          Continue
          <ArrowRight className="size-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
