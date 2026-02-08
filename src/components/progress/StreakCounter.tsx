'use client';

import { motion } from 'framer-motion';
import { Flame, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  currentStreak: number;
  isActive: boolean;
}

export function StreakCounter({ currentStreak, isActive }: StreakCounterProps) {
  const isFrozen = !isActive && currentStreak > 0;
  const isBroken = !isActive && currentStreak === 0;

  return (
    <div className="flex items-center gap-2">
      {/* Icon */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center',
          isActive && 'drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]'
        )}
        animate={
          isActive
            ? {
                scale: [1, 1.15, 1],
              }
            : {}
        }
        transition={
          isActive
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        {isFrozen ? (
          <Snowflake
            className="size-5 text-blue-400"
            aria-label="Streak frozen"
          />
        ) : (
          <Flame
            className={cn(
              'size-5',
              isActive ? 'text-orange-500' : 'text-gray-300'
            )}
            aria-label={isActive ? 'Streak active' : 'No streak'}
          />
        )}

        {/* Glow ring for active streak */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(251,146,60,0)',
                '0 0 0 6px rgba(251,146,60,0.2)',
                '0 0 0 0 rgba(251,146,60,0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Counter text */}
      <div className="flex flex-col">
        <span
          className={cn(
            'text-lg font-bold leading-tight',
            isActive
              ? 'text-orange-600'
              : isFrozen
                ? 'text-blue-500'
                : 'text-gray-400'
          )}
        >
          {currentStreak}
        </span>
        <span
          className={cn(
            'text-[10px] leading-tight',
            isActive
              ? 'text-orange-500/80'
              : isFrozen
                ? 'text-blue-400/80'
                : 'text-gray-400'
          )}
        >
          day streak
        </span>
      </div>
    </div>
  );
}
