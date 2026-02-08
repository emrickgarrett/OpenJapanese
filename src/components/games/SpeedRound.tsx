'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import GameScore from '@/components/games/GameScore';
import GameResults from '@/components/games/GameResults';
import { useGameStore } from '@/stores/game-store';
import { XP_REWARDS } from '@/lib/progression/xp';

interface QuestionItem {
  id: string;
  japanese: string;
  correctAnswer: string;
  choices: string[];
}

interface SpeedRoundProps {
  items: { id: string; japanese: string; meaning: string }[];
  difficulty: 'easy' | 'medium' | 'hard';
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const TOTAL_QUESTIONS = 20;

export default function SpeedRound({ items, difficulty }: SpeedRoundProps) {
  const timePerQuestion = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 5 : 3;

  const { startGame, endGame, resetGame } = useGameStore();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateQuestions = useCallback(() => {
    const shuffled = shuffleArray(items);
    const selected = shuffled.slice(0, Math.min(TOTAL_QUESTIONS, shuffled.length));

    const generatedQuestions: QuestionItem[] = selected.map((item) => {
      const distractors = shuffleArray(
        items.filter((i) => i.id !== item.id).map((i) => i.meaning)
      ).slice(0, 3);

      const choices = shuffleArray([item.meaning, ...distractors]);

      return {
        id: item.id,
        japanese: item.japanese,
        correctAnswer: item.meaning,
        choices,
      };
    });

    return generatedQuestions;
  }, [items]);

  const initGame = useCallback(() => {
    const q = generateQuestions();
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setCorrectCount(0);
    setIncorrectCount(0);
    setTimeLeft(timePerQuestion);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResults(false);
    setIsTransitioning(false);
    startGame('speed-round');
  }, [generateQuestions, timePerQuestion, startGame]);

  useEffect(() => {
    initGame();
    return () => {
      resetGame();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (showResults || isTransitioning || selectedAnswer !== null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up for this question
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, showResults, isTransitioning, selectedAnswer]);

  const handleTimeUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCombo(1);
    setIncorrectCount((prev) => prev + 1);
    setIsCorrect(false);
    setSelectedAnswer('__timeout__');

    setTimeout(() => {
      moveToNext();
    }, 1200);
  }, [currentIndex]);

  const moveToNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      endGame();
      setTimeout(() => setShowResults(true), 300);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setTimeLeft(timePerQuestion);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setIsTransitioning(false);
      }, 200);
    }
  }, [currentIndex, questions.length, timePerQuestion, endGame]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer !== null) return;
      if (timerRef.current) clearInterval(timerRef.current);

      const question = questions[currentIndex];
      const correct = answer === question.correctAnswer;

      setSelectedAnswer(answer);
      setIsCorrect(correct);

      if (correct) {
        const points = 10 * combo;
        setScore((prev) => prev + points);
        setCorrectCount((prev) => prev + 1);
        const newCombo = Math.min(combo + 1, 5);
        setCombo(newCombo);
        setMaxCombo((prev) => Math.max(prev, newCombo));
      } else {
        setCombo(1);
        setIncorrectCount((prev) => prev + 1);
      }

      setTimeout(() => {
        moveToNext();
      }, correct ? 800 : 1200);
    },
    [selectedAnswer, questions, currentIndex, combo, moveToNext]
  );

  const totalQuestions = questions.length;
  const accuracy =
    correctCount + incorrectCount > 0
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
      : 0;
  const maxScore = TOTAL_QUESTIONS * 10 * 5; // Perfect with max combo
  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
  const xpEarned =
    XP_REWARDS.GAME_BASE +
    Math.round((accuracy / 100) * XP_REWARDS.GAME_PERFECT);

  if (showResults) {
    return (
      <GameResults
        gameType="speed-round"
        score={score}
        maxScore={maxScore}
        accuracy={accuracy}
        timeSeconds={elapsedSeconds}
        xpEarned={xpEarned}
        onPlayAgain={initGame}
      />
    );
  }

  if (questions.length === 0) return null;

  const question = questions[currentIndex];
  const timerPercent = (timeLeft / timePerQuestion) * 100;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <GameScore score={score} combo={combo} />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {currentIndex + 1}
          </span>{' '}
          / {totalQuestions}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Timer Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className={`h-full rounded-full transition-colors ${
            timerPercent > 60
              ? 'bg-emerald-400'
              : timerPercent > 30
              ? 'bg-amber-400'
              : 'bg-red-400'
          }`}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Japanese Word */}
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-8">
            <Zap className="mb-2 h-6 w-6 text-orange-400" />
            <span className="text-4xl font-bold text-foreground">
              {question.japanese}
            </span>
            <span className="text-sm text-muted-foreground">
              What does this mean?
            </span>
          </div>

          {/* Answer Choices */}
          <div className="grid grid-cols-2 gap-3">
            {question.choices.map((choice, idx) => {
              const isSelected = selectedAnswer === choice;
              const isCorrectChoice = choice === question.correctAnswer;
              const showFeedback = selectedAnswer !== null;

              let bgClass =
                'border-border/50 bg-card hover:border-orange-400/50 hover:bg-orange-500/5';

              if (showFeedback) {
                if (isCorrectChoice) {
                  bgClass =
                    'border-emerald-400/50 bg-emerald-500/10';
                } else if (isSelected && !isCorrectChoice) {
                  bgClass =
                    'border-red-400/50 bg-red-500/10';
                } else {
                  bgClass = 'border-border/30 bg-card/50 opacity-50';
                }
              }

              return (
                <motion.button
                  key={`${currentIndex}-${idx}`}
                  onClick={() => handleAnswer(choice)}
                  disabled={selectedAnswer !== null}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${bgClass}`}
                  whileHover={
                    selectedAnswer === null ? { scale: 1.02 } : {}
                  }
                  whileTap={
                    selectedAnswer === null ? { scale: 0.98 } : {}
                  }
                  animate={
                    isSelected && !isCorrect
                      ? {
                          x: [0, -5, 5, -5, 5, 0],
                        }
                      : {}
                  }
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-sm font-medium text-foreground">
                    {choice}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Timeout feedback */}
          <AnimatePresence>
            {selectedAnswer === '__timeout__' && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-sm text-amber-400"
              >
                Time&apos;s up! The answer was{' '}
                <span className="font-semibold">
                  {question.correctAnswer}
                </span>
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
