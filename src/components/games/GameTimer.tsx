'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';

interface GameTimerProps {
  mode: 'up' | 'down';
  initialSeconds?: number;
  onTimeUp?: () => void;
  isRunning: boolean;
}

export default function GameTimer({
  mode,
  initialSeconds = 60,
  onTimeUp,
  isRunning,
}: GameTimerProps) {
  const [seconds, setSeconds] = useState(
    mode === 'down' ? initialSeconds : 0
  );

  useEffect(() => {
    if (mode === 'down') {
      setSeconds(initialSeconds);
    } else {
      setSeconds(0);
    }
  }, [initialSeconds, mode]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (mode === 'down') {
          if (prev <= 1) {
            clearInterval(interval);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, onTimeUp]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${minutes}:${secs.toString().padStart(2, '0')}`;

  const getColor = useCallback(() => {
    if (mode === 'up') return 'text-emerald-400';
    if (seconds > 30) return 'text-emerald-400';
    if (seconds > 10) return 'text-amber-400';
    return 'text-red-400';
  }, [mode, seconds]);

  const isUrgent = mode === 'down' && seconds <= 10 && seconds > 0;

  return (
    <motion.div
      className="flex items-center gap-2"
      animate={
        isUrgent
          ? {
              scale: [1, 1.1, 1],
            }
          : {}
      }
      transition={
        isUrgent
          ? {
              duration: 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : {}
      }
    >
      <Timer className={`h-5 w-5 ${getColor()}`} />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={display}
          className={`text-2xl font-bold tabular-nums ${getColor()}`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
