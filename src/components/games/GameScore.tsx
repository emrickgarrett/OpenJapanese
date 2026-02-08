'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flame } from 'lucide-react';

interface GameScoreProps {
  score: number;
  combo?: number;
  maxScore?: number;
}

export default function GameScore({
  score,
  combo = 1,
  maxScore,
}: GameScoreProps) {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    if (displayScore === score) return;

    const diff = score - displayScore;
    const step = Math.max(1, Math.floor(diff / 10));
    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        const next = prev + step;
        if (next >= score) {
          clearInterval(interval);
          return score;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [score, displayScore]);

  return (
    <div className="flex items-center gap-4">
      {/* Score */}
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-400" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayScore}
            className="text-2xl font-bold tabular-nums text-foreground"
            initial={{ scale: 1.3, color: '#fbbf24' }}
            animate={{ scale: 1, color: 'var(--foreground)' }}
            transition={{ duration: 0.3 }}
          >
            {displayScore.toLocaleString()}
          </motion.span>
        </AnimatePresence>
        {maxScore && (
          <span className="text-sm text-muted-foreground">
            / {maxScore.toLocaleString()}
          </span>
        )}
      </div>

      {/* Combo multiplier */}
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1"
          >
            <Flame className="h-4 w-4 text-white" />
            <motion.span
              key={combo}
              className="text-sm font-bold text-white"
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              x{combo}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
