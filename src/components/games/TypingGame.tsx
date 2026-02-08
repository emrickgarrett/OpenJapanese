'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Keyboard } from 'lucide-react';
import * as wanakana from 'wanakana';
import GameTimer from '@/components/games/GameTimer';
import GameScore from '@/components/games/GameScore';
import GameResults from '@/components/games/GameResults';
import { useGameStore } from '@/stores/game-store';
import { XP_REWARDS } from '@/lib/progression/xp';

interface TypingItem {
  id: string;
  japanese: string;
  reading: string;
  meaning: string;
}

interface TypingGameProps {
  items: TypingItem[];
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

const WORDS_PER_SESSION = 20;

export default function TypingGame({ items, difficulty }: TypingGameProps) {
  const { startGame, endGame, resetGame } = useGameStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const [gameItems, setGameItems] = useState<TypingItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [convertedValue, setConvertedValue] = useState('');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(
    null
  );
  const [showResults, setShowResults] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [correctReading, setCorrectReading] = useState('');

  const initGame = useCallback(() => {
    const shuffled = shuffleArray(items);
    const selected = shuffled.slice(
      0,
      Math.min(WORDS_PER_SESSION, shuffled.length)
    );
    setGameItems(selected);
    setCurrentIndex(0);
    setInputValue('');
    setConvertedValue('');
    setScore(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setFeedback(null);
    setShowResults(false);
    setIsRunning(true);
    setElapsedSeconds(0);
    setIsTransitioning(false);
    setCorrectReading('');
    startGame('typing');

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [items, startGame]);

  useEffect(() => {
    initGame();
    return () => resetGame();
  }, []);

  // Track elapsed time
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Bind wanakana to input
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    wanakana.bind(input, { IMEMode: 'toHiragana' });
    return () => {
      wanakana.unbind(input);
    };
  }, []);

  // Focus input on new question
  useEffect(() => {
    if (!isTransitioning && !showResults) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentIndex, isTransitioning, showResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (feedback !== null) return;
    const rawValue = e.target.value;
    setInputValue(rawValue);
    // wanakana.bind handles the conversion automatically
    // We read the converted value from the input
    setConvertedValue(rawValue);
  };

  const normalizeReading = (reading: string): string => {
    // Convert to hiragana for comparison
    return wanakana.toHiragana(reading.trim().toLowerCase());
  };

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (feedback !== null || isTransitioning) return;
      if (!inputValue.trim()) return;

      const currentItem = gameItems[currentIndex];
      const userReading = normalizeReading(inputValue);
      const expectedReading = normalizeReading(currentItem.reading);

      // Also accept if the user typed the reading in romaji
      const userRomajiConverted = wanakana.toHiragana(inputValue.trim());

      const isCorrect =
        userReading === expectedReading ||
        userRomajiConverted === expectedReading;

      if (isCorrect) {
        const timeBonus =
          difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15;
        setScore((prev) => prev + 10 + timeBonus);
        setCorrectCount((prev) => prev + 1);
        setFeedback('correct');
        setCorrectReading('');
      } else {
        setIncorrectCount((prev) => prev + 1);
        setFeedback('incorrect');
        setCorrectReading(currentItem.reading);
      }

      const delay = isCorrect ? 800 : 2000;
      setTimeout(() => {
        if (currentIndex + 1 >= gameItems.length) {
          setIsRunning(false);
          endGame();
          setTimeout(() => setShowResults(true), 300);
        } else {
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
            setInputValue('');
            setConvertedValue('');
            setFeedback(null);
            setCorrectReading('');
            setIsTransitioning(false);
          }, 150);
        }
      }, delay);
    },
    [
      feedback,
      isTransitioning,
      inputValue,
      gameItems,
      currentIndex,
      difficulty,
      endGame,
    ]
  );

  const totalAnswered = correctCount + incorrectCount;
  const accuracy =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const maxScore = WORDS_PER_SESSION * 25; // max with time bonus
  const xpEarned =
    XP_REWARDS.GAME_BASE +
    Math.round((accuracy / 100) * XP_REWARDS.GAME_PERFECT);

  if (showResults) {
    return (
      <GameResults
        gameType="typing"
        score={score}
        maxScore={maxScore}
        accuracy={accuracy}
        timeSeconds={elapsedSeconds}
        xpEarned={xpEarned}
        onPlayAgain={initGame}
      />
    );
  }

  if (gameItems.length === 0) return null;

  const currentItem = gameItems[currentIndex];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <GameTimer mode="up" isRunning={isRunning} />
        <GameScore score={score} />
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">
            {currentIndex + 1}
          </span>{' '}
          / {gameItems.length}
        </span>
        <span>
          Accuracy:{' '}
          <span className="font-semibold text-foreground">{accuracy}%</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-400"
          animate={{
            width: `${((currentIndex + 1) / gameItems.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Word Display */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl border-2 p-8 text-center transition-colors ${
            feedback === 'correct'
              ? 'border-emerald-400/50 bg-emerald-500/10'
              : feedback === 'incorrect'
              ? 'border-red-400/50 bg-red-500/10'
              : 'border-pink-400/30 bg-pink-500/10'
          }`}
        >
          <p className="mb-2 text-sm text-muted-foreground">
            Type the reading for:
          </p>
          <p className="mb-2 text-5xl font-bold text-foreground">
            {currentItem.japanese}
          </p>
          <p className="text-sm text-muted-foreground">
            {currentItem.meaning}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Keyboard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            disabled={feedback !== null || isTransitioning}
            placeholder="Type reading here..."
            className="w-full rounded-xl border-2 border-border/50 bg-card px-12 py-4 text-center text-xl font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-pink-400/50 focus:outline-none focus:ring-2 focus:ring-pink-400/20 disabled:opacity-50"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {inputValue && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <motion.button
                type="submit"
                className="rounded-lg bg-pink-500 p-1.5 text-white transition-colors hover:bg-pink-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Check className="h-4 w-4" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Live conversion display */}
        {inputValue && feedback === null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-lg text-muted-foreground"
          >
            {wanakana.toHiragana(inputValue)}
          </motion.p>
        )}
      </form>

      {/* Feedback */}
      <AnimatePresence>
        {feedback !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl p-4 text-center ${
              feedback === 'correct'
                ? 'border border-emerald-400/30 bg-emerald-500/10'
                : 'border border-red-400/30 bg-red-500/10'
            }`}
          >
            {feedback === 'correct' ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Check className="h-5 w-5" />
                <span className="font-semibold">Correct!</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <X className="h-5 w-5" />
                  <span className="font-semibold">Incorrect</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The correct reading is:{' '}
                  <span className="font-medium text-foreground">
                    {correctReading}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Hint */}
      <p className="text-center text-xs text-muted-foreground/60">
        Type in romaji and it will auto-convert to hiragana. Press Enter to
        submit.
      </p>
    </div>
  );
}
