'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { SRS_STAGE_NAMES } from '@/lib/srs/constants';

interface ReviewResultProps {
  isCorrect: boolean;
  correctAnswers: string[];
  previousStage: number;
  newStage: number;
  onContinue: () => void;
}

export default function ReviewResult({
  isCorrect,
  correctAnswers,
  previousStage,
  newStage,
  onContinue,
}: ReviewResultProps) {
  const prevStageName = SRS_STAGE_NAMES[previousStage] ?? 'Unknown';
  const newStageName = SRS_STAGE_NAMES[newStage] ?? 'Unknown';
  const stageChanged = previousStage !== newStage;

  // Auto-advance after 2 seconds
  useEffect(() => {
    const timer = setTimeout(onContinue, 2000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onContinue}
      className={`w-full cursor-pointer rounded-xl px-6 py-5 ${
        isCorrect
          ? 'bg-green-50 dark:bg-green-950/40'
          : 'bg-red-50 dark:bg-red-950/40'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Icon and result text */}
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="size-6 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-lg font-bold ${
              isCorrect
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}
          >
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </span>
        </div>

        {/* Show correct answers for incorrect */}
        {!isCorrect && correctAnswers.length > 0 && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Correct: <span className="font-semibold">{correctAnswers.join(', ')}</span>
          </p>
        )}

        {/* SRS stage change */}
        {stageChanged && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{prevStageName}</span>
            <ArrowRight className="size-3" />
            <span
              className={
                newStage > previousStage
                  ? 'font-semibold text-green-600 dark:text-green-400'
                  : 'font-semibold text-red-600 dark:text-red-400'
              }
            >
              {newStageName}
            </span>
          </div>
        )}

        {/* Tap to continue hint */}
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          Click to continue
        </p>
      </div>
    </motion.div>
  );
}
