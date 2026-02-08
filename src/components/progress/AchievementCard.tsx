'use client';

import { motion } from 'framer-motion';
import type { AchievementDefinition, AchievementRarity } from '@/types/achievement';

interface AchievementCardProps {
  achievement: AchievementDefinition;
  unlocked?: boolean;
  unlockedAt?: string;
}

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const RARITY_BG: Record<AchievementRarity, string> = {
  common: 'rgba(156, 163, 175, 0.1)',
  uncommon: 'rgba(34, 197, 94, 0.1)',
  rare: 'rgba(59, 130, 246, 0.1)',
  epic: 'rgba(168, 85, 247, 0.1)',
  legendary: 'rgba(245, 158, 11, 0.1)',
};

export default function AchievementCard({
  achievement,
  unlocked = false,
  unlockedAt,
}: AchievementCardProps) {
  const borderColor = RARITY_COLORS[achievement.rarity];
  const bgColor = RARITY_BG[achievement.rarity];

  return (
    <motion.div
      whileHover={{ scale: unlocked ? 1.03 : 1, y: unlocked ? -2 : 0 }}
      className={`relative flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all ${
        unlocked ? 'bg-card shadow-sm' : 'opacity-50 grayscale'
      }`}
      style={{
        borderColor: unlocked ? borderColor : 'var(--border)',
        backgroundColor: unlocked ? bgColor : undefined,
      }}
    >
      {/* Icon */}
      <div
        className="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
        style={{
          backgroundColor: unlocked ? `${borderColor}20` : 'var(--muted)',
        }}
      >
        {unlocked ? (
          <span>{achievement.icon}</span>
        ) : (
          <span className="text-xl text-muted-foreground">?</span>
        )}
      </div>

      {/* Name */}
      <h4 className="mb-1 text-sm font-semibold leading-tight">{achievement.name}</h4>

      {/* Description */}
      <p className="mb-2 text-xs text-muted-foreground">{achievement.description}</p>

      {/* Unlock date or locked state */}
      <div className="mt-auto">
        {unlocked && unlockedAt ? (
          <p className="text-xs text-muted-foreground">
            {new Date(unlockedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        ) : (
          <p className="text-xs font-medium text-muted-foreground">Locked</p>
        )}
      </div>

      {/* XP reward badge */}
      {unlocked && (
        <div
          className="absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: borderColor }}
        >
          +{achievement.xpReward} XP
        </div>
      )}

      {/* Rarity indicator */}
      <div
        className="absolute bottom-1 right-1 h-2 w-2 rounded-full"
        style={{ backgroundColor: borderColor }}
        title={achievement.rarity}
      />
    </motion.div>
  );
}
