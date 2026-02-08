'use client';

import { motion } from 'framer-motion';

interface LevelBadgeProps {
  level: number;
  jlptLevel: string;
  progressPercent: number;
}

const JLPT_COLORS: Record<string, { from: string; to: string; ring: string }> = {
  N5: { from: '#ec4899', to: '#f472b6', ring: '#ec4899' }, // pink
  N4: { from: '#f97316', to: '#fb923c', ring: '#f97316' }, // orange
  N3: { from: '#22c55e', to: '#4ade80', ring: '#22c55e' }, // green
  N2: { from: '#3b82f6', to: '#60a5fa', ring: '#3b82f6' }, // blue
  N1: { from: '#eab308', to: '#facc15', ring: '#eab308' }, // gold
};

export function LevelBadge({ level, jlptLevel, progressPercent }: LevelBadgeProps) {
  const colors = JLPT_COLORS[jlptLevel] ?? JLPT_COLORS.N5;

  // SVG circle properties for the progress ring
  const size = 72;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPercent / 100) * circumference;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Background ring + progress ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-xl font-bold text-white"
          key={level}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {level}
        </motion.span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/80">
          {jlptLevel}
        </span>
      </div>
    </motion.div>
  );
}
