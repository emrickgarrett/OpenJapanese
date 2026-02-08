'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameScore from '@/components/games/GameScore';
import GameResults from '@/components/games/GameResults';
import { useGameStore } from '@/stores/game-store';
import { XP_REWARDS } from '@/lib/progression/xp';
import {
  speakJapanese,
  loadVoices,
  isSpeechSupported,
} from '@/lib/audio/speech';

interface ListeningItem {
  id: string;
  japanese: string;
  reading: string;
  meaning: string;
}

interface ListeningGameProps {
  items: ListeningItem[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Question {
  item: ListeningItem;
  choices: ListeningItem[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const QUESTIONS_PER_ROUND = 15;

export default function ListeningGame({
  items,
  difficulty,
}: ListeningGameProps) {
  const { startGame, endGame, resetGame } = useGameStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [startTime] = useState(Date.now());
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(true);

  // Pre-load voices on mount so they are ready for playback
  useEffect(() => {
    if (!isSpeechSupported()) {
      setIsSpeechAvailable(false);
      return;
    }

    loadVoices().then((voices) => {
      if (voices.length === 0) {
        setIsSpeechAvailable(false);
      }
    });
  }, []);

  const generateQuestions = useCallback(() => {
    const shuffled = shuffleArray(items);
    const selected = shuffled.slice(
      0,
      Math.min(QUESTIONS_PER_ROUND, shuffled.length)
    );

    return selected.map((item) => {
      const distractors = shuffleArray(
        items.filter((i) => i.id !== item.id)
      ).slice(0, 3);

      const choices = shuffleArray([item, ...distractors]);
      return { item, choices };
    });
  }, [items]);

  const initGame = useCallback(() => {
    const q = generateQuestions();
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResults(false);
    setHasPlayed(false);
    startGame('listening');
  }, [generateQuestions, startGame]);

  useEffect(() => {
    initGame();
    return () => {
      resetGame();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!isSpeechAvailable) return;

      const rate =
        difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 0.85 : 1;

      await speakJapanese({
        text,
        rate,
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          setIsPlaying(false);
          setHasPlayed(true);
        },
        onError: () => {
          setIsPlaying(false);
          setHasPlayed(true);
        },
      });
    },
    [isSpeechAvailable, difficulty]
  );

  const handlePlay = () => {
    if (questions.length === 0 || isPlaying) return;
    const question = questions[currentIndex];
    // Speak the reading (hiragana) for clearer pronunciation
    speak(question.item.reading || question.item.japanese);
  };

  const handleAnswer = useCallback(
    (answerId: string) => {
      if (selectedAnswer !== null) return;

      const question = questions[currentIndex];
      const correct = answerId === question.item.id;

      setSelectedAnswer(answerId);
      setIsCorrect(correct);

      if (correct) {
        setScore((prev) => prev + 10);
        setCorrectCount((prev) => prev + 1);
      } else {
        setIncorrectCount((prev) => prev + 1);
      }

      setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          endGame();
          setTimeout(() => setShowResults(true), 300);
        } else {
          setCurrentIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setIsCorrect(null);
          setHasPlayed(false);
        }
      }, 1200);
    },
    [selectedAnswer, questions, currentIndex, endGame]
  );

  const totalAnswered = correctCount + incorrectCount;
  const accuracy =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const maxScore = QUESTIONS_PER_ROUND * 10;
  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
  const xpEarned =
    XP_REWARDS.GAME_BASE +
    Math.round((accuracy / 100) * XP_REWARDS.GAME_PERFECT);

  if (showResults) {
    return (
      <GameResults
        gameType="listening"
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

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <GameScore score={score} />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {currentIndex + 1}
          </span>{' '}
          / {questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
          animate={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Play Button Area */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="flex flex-col items-center gap-6 rounded-2xl border border-teal-400/30 bg-teal-500/10 p-8"
        >
          {!isSpeechAvailable ? (
            <div className="flex flex-col items-center gap-2">
              <VolumeX className="h-10 w-10 text-red-400" />
              <p className="text-sm text-red-400">
                Speech synthesis is not available in your browser
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Listen and select the correct word
              </p>

              {/* Play button */}
              <motion.button
                onClick={handlePlay}
                disabled={isPlaying}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/30 transition-shadow hover:shadow-xl hover:shadow-teal-500/40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Volume2 className="h-10 w-10 text-white" />

                {/* Audio wave animation */}
                {isPlaying && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-teal-400/50"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-teal-400/30"
                      animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeOut',
                        delay: 0.3,
                      }}
                    />
                  </>
                )}
              </motion.button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlay}
                  disabled={isPlaying}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Replay
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Answer Choices */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice) => {
          const isSelected = selectedAnswer === choice.id;
          const isCorrectChoice = choice.id === question.item.id;
          const showFeedback = selectedAnswer !== null;

          let bgClass =
            'border-border/50 bg-card hover:border-teal-400/50 hover:bg-teal-500/5';

          if (showFeedback) {
            if (isCorrectChoice) {
              bgClass = 'border-emerald-400/50 bg-emerald-500/10';
            } else if (isSelected && !isCorrectChoice) {
              bgClass = 'border-red-400/50 bg-red-500/10';
            } else {
              bgClass = 'border-border/30 bg-card/50 opacity-50';
            }
          }

          return (
            <motion.button
              key={choice.id}
              onClick={() => handleAnswer(choice.id)}
              disabled={selectedAnswer !== null}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-colors ${bgClass}`}
              whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
              whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
              animate={
                isSelected && !isCorrect
                  ? { x: [0, -4, 4, -4, 4, 0] }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              <span className="text-xl font-bold text-foreground">
                {choice.japanese}
              </span>
              <span className="text-xs text-muted-foreground">
                {choice.reading}
              </span>
              {showFeedback && (
                <span className="text-xs text-muted-foreground">
                  {choice.meaning}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
