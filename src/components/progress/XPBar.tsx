'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getXPProgress } from '@/lib/progression/xp';

interface XPBarProps {
  currentXP: number;
  level: number;
}

export function XPBar({ currentXP, level }: XPBarProps) {
  const progress = getXPProgress(currentXP);
  const [showSparkle, setShowSparkle] = useState(false);
  const [prevXP, setPrevXP] = useState(currentXP);

  // Detect XP changes to trigger sparkle animation
  useEffect(() => {
    if (currentXP !== prevXP) {
      setShowSparkle(true);
      setPrevXP(currentXP);
      const timer = setTimeout(() => setShowSparkle(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentXP, prevXP]);

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {/* Level labels */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Level {progress.currentLevel}
          </span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Level {progress.currentLevel + 1}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mt-3">
        <div className="h-4 w-full overflow-hidden rounded-full bg-pink-100 dark:bg-pink-950/50">
          <motion.div
            className="relative h-full rounded-full bg-gradient-to-r from-pink-400 via-pink-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress.progressPercent}%` }}
            transition={{
              type: 'spring',
              stiffness: 60,
              damping: 15,
              duration: 1,
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: 'easeInOut',
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Sparkle animation on XP change */}
        <AnimatePresence>
          {showSparkle && (
            <motion.div
              className="absolute right-0 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{ left: `${progress.progressPercent}%` }}
            >
              <Sparkles className="size-5 text-yellow-400 drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* XP numbers */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {progress.xpInCurrentLevel.toLocaleString()}
          </span>
          {' / '}
          {progress.xpForNextLevel.toLocaleString()} XP
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round(progress.progressPercent)}%
        </p>
      </div>
    </div>
  );
}
