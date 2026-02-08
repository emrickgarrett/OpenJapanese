'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameTimer from '@/components/games/GameTimer';
import GameResults from '@/components/games/GameResults';
import { VocabItem, KanjiItem } from '@/types/curriculum';
import { useGameStore } from '@/stores/game-store';
import { XP_REWARDS } from '@/lib/progression/xp';

interface MatchingGameProps {
  items: { id: string; japanese: string; meaning: string }[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CardData {
  id: string;
  pairId: string;
  content: string;
  type: 'japanese' | 'meaning';
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MatchingGame({
  items,
  difficulty,
}: MatchingGameProps) {
  const pairCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 12;
  const cols = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 4 : 6;

  const { startGame, endGame, resetGame } = useGameStore();

  const [cards, setCards] = useState<CardData[]>([]);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastMatchCorrect, setLastMatchCorrect] = useState<boolean | null>(null);

  const initGame = useCallback(() => {
    const selectedItems = shuffleArray(items).slice(0, pairCount);

    const cardPairs: CardData[] = [];
    selectedItems.forEach((item) => {
      cardPairs.push({
        id: `${item.id}-jp`,
        pairId: item.id,
        content: item.japanese,
        type: 'japanese',
      });
      cardPairs.push({
        id: `${item.id}-en`,
        pairId: item.id,
        content: item.meaning,
        type: 'meaning',
      });
    });

    setCards(shuffleArray(cardPairs));
    setFlipped(new Set());
    setMatched(new Set());
    setSelected([]);
    setMoves(0);
    setIsLocked(false);
    setIsRunning(true);
    setShowResults(false);
    setElapsedSeconds(0);
    setLastMatchCorrect(null);
    startGame('matching');
  }, [items, pairCount, startGame]);

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

  // Check if game is complete
  useEffect(() => {
    if (cards.length > 0 && matched.size === cards.length) {
      setIsRunning(false);
      endGame();
      setTimeout(() => setShowResults(true), 800);
    }
  }, [matched.size, cards.length, endGame]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (isLocked) return;
      if (flipped.has(cardId)) return;
      if (matched.has(cardId)) return;

      const newFlipped = new Set(flipped);
      newFlipped.add(cardId);
      setFlipped(newFlipped);

      const newSelected = [...selected, cardId];
      setSelected(newSelected);

      if (newSelected.length === 2) {
        setMoves((prev) => prev + 1);
        setIsLocked(true);

        const [first, second] = newSelected;
        const firstCard = cards.find((c) => c.id === first);
        const secondCard = cards.find((c) => c.id === second);

        if (
          firstCard &&
          secondCard &&
          firstCard.pairId === secondCard.pairId &&
          firstCard.type !== secondCard.type
        ) {
          // Match found
          setLastMatchCorrect(true);
          const newMatched = new Set(matched);
          newMatched.add(first);
          newMatched.add(second);
          setMatched(newMatched);
          setSelected([]);
          setIsLocked(false);
          setTimeout(() => setLastMatchCorrect(null), 600);
        } else {
          // No match
          setLastMatchCorrect(false);
          setTimeout(() => {
            const revertFlipped = new Set(newFlipped);
            revertFlipped.delete(first);
            revertFlipped.delete(second);
            setFlipped(revertFlipped);
            setSelected([]);
            setIsLocked(false);
            setLastMatchCorrect(null);
          }, 1000);
        }
      }
    },
    [isLocked, flipped, matched, selected, cards]
  );

  const accuracy = useMemo(() => {
    if (moves === 0) return 0;
    const pairs = matched.size / 2;
    return Math.min(100, Math.round((pairs / moves) * 100));
  }, [moves, matched.size]);

  const score = useMemo(() => {
    const pairs = matched.size / 2;
    const perfectMoves = pairCount;
    const efficiency = Math.max(0, 1 - (moves - perfectMoves) / (perfectMoves * 2));
    return Math.round(pairs * 100 * (0.5 + 0.5 * efficiency));
  }, [matched.size, moves, pairCount]);

  const maxScore = pairCount * 100;

  const xpEarned = useMemo(() => {
    const baseXP = XP_REWARDS.GAME_BASE;
    if (accuracy >= 80) return baseXP + XP_REWARDS.GAME_PERFECT;
    return baseXP + Math.round((accuracy / 100) * XP_REWARDS.GAME_PERFECT);
  }, [accuracy]);

  if (showResults) {
    return (
      <GameResults
        gameType="matching"
        score={score}
        maxScore={maxScore}
        accuracy={accuracy}
        timeSeconds={elapsedSeconds}
        xpEarned={xpEarned}
        onPlayAgain={initGame}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <GameTimer mode="up" isRunning={isRunning} />
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{moves}</span> moves
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {matched.size / 2}
            </span>{' '}
            / {pairCount} pairs
          </div>
          <Button variant="ghost" size="icon-sm" onClick={initGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Match feedback */}
      <AnimatePresence>
        {lastMatchCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-center text-sm font-medium ${
              lastMatchCorrect ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {lastMatchCorrect ? 'Match!' : 'Not a match'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {cards.map((card) => {
          const isFlipped = flipped.has(card.id) || matched.has(card.id);
          const isMatched = matched.has(card.id);

          return (
            <motion.button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="relative aspect-[3/4] w-full cursor-pointer perspective-[600px]"
              whileHover={!isFlipped ? { scale: 1.03 } : {}}
              whileTap={!isFlipped ? { scale: 0.97 } : {}}
              layout
            >
              <motion.div
                className="relative h-full w-full"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Back of card (face-down) */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-border/50 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <span className="text-lg text-muted-foreground">?</span>
                  </div>
                </div>

                {/* Front of card (face-up) */}
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-xl border-2 p-2 ${
                    isMatched
                      ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                      : card.type === 'japanese'
                      ? 'border-blue-400/30 bg-blue-500/10'
                      : 'border-amber-400/30 bg-amber-500/10'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <span
                    className={`text-center font-medium leading-tight ${
                      card.type === 'japanese'
                        ? 'text-lg text-foreground'
                        : 'text-sm text-foreground'
                    }`}
                  >
                    {card.content}
                  </span>
                  {isMatched && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-emerald-400/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
