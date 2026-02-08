'use client';

import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LessonGroup } from '@/types/curriculum';

export type SkillNodeStatus = 'locked' | 'available' | 'in_progress' | 'completed';

interface SkillNodeProps {
  lesson: LessonGroup;
  status: SkillNodeStatus;
  onClick: () => void;
  index: number;
}

const statusConfig: Record<
  SkillNodeStatus,
  {
    bgClass: string;
    borderClass: string;
    textClass: string;
    ringClass: string;
  }
> = {
  locked: {
    bgClass: 'bg-muted',
    borderClass: 'border-muted-foreground/20',
    textClass: 'text-muted-foreground/50',
    ringClass: '',
  },
  available: {
    bgClass: 'bg-primary',
    borderClass: 'border-primary',
    textClass: 'text-primary-foreground',
    ringClass: 'animate-pulse-glow',
  },
  in_progress: {
    bgClass: 'bg-gradient-to-br from-primary to-primary/60',
    borderClass: 'border-primary',
    textClass: 'text-primary-foreground',
    ringClass: '',
  },
  completed: {
    bgClass: 'bg-gradient-to-br from-amber-400 to-amber-500',
    borderClass: 'border-amber-400',
    textClass: 'text-amber-950',
    ringClass: '',
  },
};

export default function SkillNode({
  lesson,
  status,
  onClick,
  index,
}: SkillNodeProps) {
  const config = statusConfig[status];
  const isClickable = status !== 'locked';
  const totalItems =
    lesson.items.kanji.length +
    lesson.items.vocabulary.length +
    lesson.items.grammar.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      className="flex flex-col items-center gap-2"
    >
      {/* Node circle */}
      <motion.button
        whileHover={isClickable ? { scale: 1.1 } : undefined}
        whileTap={isClickable ? { scale: 0.95 } : undefined}
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        className={cn(
          'relative flex size-16 items-center justify-center rounded-full border-[3px] transition-shadow',
          config.bgClass,
          config.borderClass,
          config.textClass,
          config.ringClass,
          isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
          isClickable && 'hover:shadow-lg'
        )}
        aria-label={`${lesson.title} - ${status}`}
      >
        {status === 'locked' ? (
          <Lock className="size-5" />
        ) : status === 'completed' ? (
          <Check className="size-6 stroke-[3]" />
        ) : (
          <span className="text-lg font-bold">{lesson.order}</span>
        )}

        {/* In-progress overlay (half-circle) */}
        {status === 'in_progress' && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-0 w-1/2 bg-primary-foreground/10" />
          </div>
        )}

        {/* Item count badge */}
        <span
          className={cn(
            'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
            status === 'locked'
              ? 'bg-muted-foreground/20 text-muted-foreground/60'
              : 'bg-background text-foreground shadow-sm border border-border'
          )}
        >
          {totalItems}
        </span>
      </motion.button>

      {/* Title below */}
      <p
        className={cn(
          'max-w-[100px] text-center text-xs font-medium leading-tight',
          status === 'locked' ? 'text-muted-foreground/50' : 'text-foreground'
        )}
      >
        {lesson.title}
      </p>
    </motion.div>
  );
}
