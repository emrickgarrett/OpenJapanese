'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Gamepad2,
  Grid3X3,
  Zap,
  Pencil,
  Puzzle,
  Headphones,
  Keyboard,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GameType } from '@/types/game';

interface GameCardData {
  type: GameType;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  hoverGradient: string;
  href: string;
}

const GAMES: GameCardData[] = [
  {
    type: 'matching',
    title: 'Matching',
    description: 'Match pairs of kanji and meanings',
    icon: <Grid3X3 className="h-8 w-8" />,
    gradient: 'from-purple-500/20 to-violet-600/20',
    hoverGradient: 'group-hover:from-purple-500/30 group-hover:to-violet-600/30',
    href: '/games/matching',
  },
  {
    type: 'speed-round',
    title: 'Speed Round',
    description: 'Race against the clock!',
    icon: <Zap className="h-8 w-8" />,
    gradient: 'from-orange-500/20 to-amber-600/20',
    hoverGradient: 'group-hover:from-orange-500/30 group-hover:to-amber-600/30',
    href: '/games/speed-round',
  },
  {
    type: 'kanji-draw',
    title: 'Kanji Drawing',
    description: 'Draw kanji from memory',
    icon: <Pencil className="h-8 w-8" />,
    gradient: 'from-blue-500/20 to-cyan-600/20',
    hoverGradient: 'group-hover:from-blue-500/30 group-hover:to-cyan-600/30',
    href: '/games/kanji-draw',
  },
  {
    type: 'sentence-builder',
    title: 'Sentence Builder',
    description: 'Build sentences word by word',
    icon: <Puzzle className="h-8 w-8" />,
    gradient: 'from-emerald-500/20 to-green-600/20',
    hoverGradient: 'group-hover:from-emerald-500/30 group-hover:to-green-600/30',
    href: '/games/sentence-builder',
  },
  {
    type: 'listening',
    title: 'Listening',
    description: 'Test your listening skills',
    icon: <Headphones className="h-8 w-8" />,
    gradient: 'from-teal-500/20 to-cyan-600/20',
    hoverGradient: 'group-hover:from-teal-500/30 group-hover:to-cyan-600/30',
    href: '/games/listening',
  },
  {
    type: 'typing',
    title: 'Typing Practice',
    description: 'Type readings in kana',
    icon: <Keyboard className="h-8 w-8" />,
    gradient: 'from-pink-500/20 to-rose-600/20',
    hoverGradient: 'group-hover:from-pink-500/30 group-hover:to-rose-600/30',
    href: '/games/typing',
  },
];

const ICON_COLORS: Record<GameType, string> = {
  matching: 'text-purple-400',
  'speed-round': 'text-orange-400',
  'kanji-draw': 'text-blue-400',
  'sentence-builder': 'text-emerald-400',
  listening: 'text-teal-400',
  typing: 'text-pink-400',
};

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

export default function GamesPage() {
  const [difficulties, setDifficulties] = useState<
    Record<GameType, (typeof DIFFICULTY_OPTIONS)[number]>
  >({
    matching: 'medium',
    'speed-round': 'medium',
    'kanji-draw': 'medium',
    'sentence-builder': 'medium',
    listening: 'medium',
    typing: 'medium',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
          <Gamepad2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mini-Games</h1>
          <p className="text-sm text-muted-foreground">
            Practice Japanese through fun challenges
          </p>
        </div>
      </motion.div>

      {/* Game Grid */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {GAMES.map((game) => (
          <motion.div key={game.type} variants={cardVariants}>
            <Link
              href={`${game.href}?difficulty=${difficulties[game.type]}`}
              className="group block"
            >
              <div
                className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${game.gradient} ${game.hoverGradient} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10`}
              >
                {/* Icon */}
                <div
                  className={`mb-4 inline-flex rounded-xl bg-background/80 p-3 ${ICON_COLORS[game.type]}`}
                >
                  {game.icon}
                </div>

                {/* Title + Description */}
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {game.title}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {game.description}
                </p>

                {/* Difficulty Selector */}
                <div
                  className="flex gap-2"
                  onClick={(e) => e.preventDefault()}
                >
                  {DIFFICULTY_OPTIONS.map((diff) => (
                    <button
                      key={diff}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDifficulties((prev) => ({
                          ...prev,
                          [game.type]: diff,
                        }));
                      }}
                      className="relative"
                    >
                      <Badge
                        variant={
                          difficulties[game.type] === diff
                            ? 'default'
                            : 'outline'
                        }
                        className={`cursor-pointer capitalize transition-all ${
                          difficulties[game.type] === diff
                            ? 'scale-105'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {diff}
                      </Badge>
                    </button>
                  ))}
                </div>

                {/* Decorative glow */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl transition-all group-hover:bg-white/10" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
