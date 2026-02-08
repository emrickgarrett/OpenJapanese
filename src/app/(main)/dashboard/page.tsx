'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flame,
  Star,
  BookOpen,
  Target,
  Play,
  GraduationCap,
  Gamepad2,
  Trophy,
  BarChart3,
  Sparkles,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/providers/ProfileProvider';
import { getXPProgress } from '@/lib/progression/xp';
import { SRS_STAGE_COLORS } from '@/lib/srs/constants';
import { XPBar } from '@/components/progress/XPBar';
import { StreakCounter } from '@/components/progress/StreakCounter';
import { LevelBadge } from '@/components/progress/LevelBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

// ─── Mock Data ──────────────────────────────────────────────────────────────
// TODO: Replace with real Supabase queries

const MOCK_STATS = {
  streak: 7,
  isStreakActive: true,
  totalXp: 1_234,
  itemsLearned: 142,
  reviewsDoneToday: 15,
  reviewGoalToday: 25,
};

const MOCK_REVIEWS = {
  pending: 42,
};

const MOCK_LESSONS = {
  available: 5,
  nextTitle: 'Lesson 12: Family Members',
  nextDescription: 'Learn words for family like お母さん, お父さん, and more',
};

const MOCK_SRS_BREAKDOWN = {
  apprentice: 45,
  guru: 38,
  master: 27,
  enlightened: 19,
  burned: 13,
};

// Last 30 days of activity (0 = none, 1 = light, 2 = moderate, 3 = heavy)
// TODO: Replace with real activity data from Supabase
const MOCK_ACTIVITY: number[] = Array.from({ length: 30 }, () =>
  Math.floor(Math.random() * 4)
);

// ─── Animation Variants ─────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function getJapaneseDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[now.getDay()];
  return `${year}年${month}月${day}日 (${weekday})`;
}

function getActivityColor(level: number): string {
  switch (level) {
    case 0:
      return 'bg-pink-100';
    case 1:
      return 'bg-pink-300';
    case 2:
      return 'bg-pink-500';
    case 3:
      return 'bg-pink-700';
    default:
      return 'bg-pink-100';
  }
}

function getActivityLabel(level: number): string {
  switch (level) {
    case 0:
      return 'No activity';
    case 1:
      return 'Light activity';
    case 2:
      return 'Moderate activity';
    case 3:
      return 'Heavy activity';
    default:
      return 'No activity';
  }
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile } = useProfile();

  const displayName =
    profile?.display_name || profile?.username || 'Learner';
  const totalXp = profile?.total_xp ?? MOCK_STATS.totalXp;
  const currentLevel = profile?.current_level ?? 1;
  const jlptLevel = profile?.current_jlpt_level ?? 'N5';
  const xpProgress = useMemo(() => getXPProgress(totalXp), [totalXp]);

  const srsTotal =
    MOCK_SRS_BREAKDOWN.apprentice +
    MOCK_SRS_BREAKDOWN.guru +
    MOCK_SRS_BREAKDOWN.master +
    MOCK_SRS_BREAKDOWN.enlightened +
    MOCK_SRS_BREAKDOWN.burned;

  return (
    <motion.div
      className="mx-auto max-w-6xl space-y-6 p-4 pb-20 sm:p-6 lg:p-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 p-6 text-white shadow-lg shadow-pink-500/20 sm:p-8"
      >
        <div className="relative z-10 flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:block">
            <MiniYukiDashboard />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80">
              {getJapaneseDateString()}
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Ready to learn something new today?
            </p>
          </div>
          <div className="flex-shrink-0">
            <LevelBadge
              level={currentLevel}
              jlptLevel={jlptLevel}
              progressPercent={xpProgress.progressPercent}
            />
          </div>
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
      </motion.div>

      {/* ── XP Bar ──────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <XPBar currentXP={totalXp} level={currentLevel} />
      </motion.div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <StatCard
          icon={<Flame className="size-5 text-orange-500" />}
          label="Streak"
          value={`${MOCK_STATS.streak} days`}
          accent="orange"
        >
          <StreakCounter
            currentStreak={MOCK_STATS.streak}
            isActive={MOCK_STATS.isStreakActive}
          />
        </StatCard>

        <StatCard
          icon={<Star className="size-5 text-yellow-500" />}
          label="Total XP"
          value={formatNumber(totalXp)}
          accent="yellow"
          extra={`Level ${currentLevel}`}
        />

        <StatCard
          icon={<BookOpen className="size-5 text-blue-500" />}
          label="Items Learned"
          value={formatNumber(MOCK_STATS.itemsLearned)}
          accent="blue"
        />

        <StatCard
          icon={<Target className="size-5 text-green-500" />}
          label="Today's Progress"
          value={`${MOCK_STATS.reviewsDoneToday}/${MOCK_STATS.reviewGoalToday}`}
          accent="green"
        >
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-green-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(
                  (MOCK_STATS.reviewsDoneToday / MOCK_STATS.reviewGoalToday) *
                    100,
                  100
                )}%`,
              }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
        </StatCard>
      </motion.div>

      {/* ── Main Action Cards ───────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:gap-6 md:grid-cols-2"
      >
        {/* Reviews card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-shadow hover:shadow-lg sm:p-8"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
              <Sparkles className="size-4" />
              Reviews Due
            </div>
            {MOCK_REVIEWS.pending > 0 ? (
              <>
                <p className="mt-3 text-5xl font-bold text-purple-700">
                  {MOCK_REVIEWS.pending}
                </p>
                <p className="mt-1 text-sm text-purple-500">
                  items waiting for review
                </p>
                <Button
                  asChild
                  className="mt-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 text-white shadow-md shadow-purple-500/25 hover:from-purple-600 hover:to-pink-600"
                >
                  <Link href="/reviews">
                    <Play className="mr-2 size-4" />
                    Start Reviews
                  </Link>
                </Button>
              </>
            ) : (
              <div className="mt-4 flex flex-col items-center py-4">
                <PartyPopper className="size-12 text-purple-400" />
                <p className="mt-2 text-lg font-semibold text-purple-700">
                  All caught up!
                </p>
                <p className="text-sm text-purple-500">
                  Great job! Come back later for more.
                </p>
              </div>
            )}
          </div>
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-purple-200/30" />
          <div className="pointer-events-none absolute -top-4 right-8 h-20 w-20 rounded-full bg-pink-200/20" />
        </motion.div>

        {/* Lessons card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-blue-50 p-6 shadow-sm transition-shadow hover:shadow-lg sm:p-8"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm font-medium text-teal-600">
              <GraduationCap className="size-4" />
              New Lessons
            </div>
            {MOCK_LESSONS.available > 0 ? (
              <>
                <p className="mt-3 text-5xl font-bold text-teal-700">
                  {MOCK_LESSONS.available}
                </p>
                <p className="mt-1 text-sm font-medium text-teal-600">
                  {MOCK_LESSONS.nextTitle}
                </p>
                <p className="mt-0.5 text-xs text-teal-500">
                  {MOCK_LESSONS.nextDescription}
                </p>
                <Button
                  asChild
                  className="mt-5 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 px-6 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-blue-600"
                >
                  <Link href="/lessons">
                    <BookOpen className="mr-2 size-4" />
                    Start Lesson
                  </Link>
                </Button>
              </>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No new lessons"
                description="Complete your reviews to unlock more lessons."
              />
            )}
          </div>
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-teal-200/30" />
          <div className="pointer-events-none absolute -top-4 right-8 h-20 w-20 rounded-full bg-blue-200/20" />
        </motion.div>
      </motion.div>

      {/* ── SRS Progress ────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border bg-card p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-foreground">
          SRS Progress
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatNumber(srsTotal)} items across all stages
        </p>

        {/* Stacked bar */}
        <div className="mt-5 flex h-6 w-full overflow-hidden rounded-full">
          {Object.entries(MOCK_SRS_BREAKDOWN).map(([stage, count]) => {
            const percent = srsTotal > 0 ? (count / srsTotal) * 100 : 0;
            const colorMap: Record<string, string> = {
              apprentice: SRS_STAGE_COLORS[1],
              guru: SRS_STAGE_COLORS[5],
              master: SRS_STAGE_COLORS[7],
              enlightened: SRS_STAGE_COLORS[8],
              burned: SRS_STAGE_COLORS[9],
            };
            return (
              <motion.div
                key={stage}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ backgroundColor: colorMap[stage] }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                title={`${stage}: ${count}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(MOCK_SRS_BREAKDOWN).map(([stage, count]) => {
            const colorMap: Record<string, string> = {
              apprentice: SRS_STAGE_COLORS[1],
              guru: SRS_STAGE_COLORS[5],
              master: SRS_STAGE_COLORS[7],
              enlightened: SRS_STAGE_COLORS[8],
              burned: SRS_STAGE_COLORS[9],
            };
            return (
              <div key={stage} className="flex items-center gap-2 text-sm">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colorMap[stage] }}
                />
                <span className="capitalize text-muted-foreground">
                  {stage}
                </span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Quick Access Grid ───────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <QuickAccessCard
          href="/games"
          icon={<Gamepad2 className="size-6 text-purple-500" />}
          title="Mini-Games"
          description="Practice with fun games"
          className="border-purple-200/60 bg-gradient-to-br from-purple-50 to-fuchsia-50"
        />
        <QuickAccessCard
          href="/leaderboard"
          icon={<Trophy className="size-6 text-amber-500" />}
          title="Leaderboard"
          description="See how you rank"
          className="border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50"
        />
        <QuickAccessCard
          href="/profile"
          icon={<BarChart3 className="size-6 text-blue-500" />}
          title="Profile & Stats"
          description="View your progress"
          className="border-blue-200/60 bg-gradient-to-br from-blue-50 to-cyan-50"
        />
      </motion.div>

      {/* ── Activity Heatmap ────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border bg-card p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-foreground">
          Activity (Last 30 Days)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your daily study activity
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {MOCK_ACTIVITY.map((level, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            return (
              <motion.div
                key={i}
                className={cn(
                  'h-6 w-6 rounded-md sm:h-7 sm:w-7',
                  getActivityColor(level)
                )}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                title={`${dateStr}: ${getActivityLabel(level)}`}
              />
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((level) => (
              <div
                key={level}
                className={cn('h-4 w-4 rounded-sm', getActivityColor(level))}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
  extra,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  extra?: string;
  children?: React.ReactNode;
}) {
  const bgMap: Record<string, string> = {
    orange: 'bg-orange-50 border-orange-200/60',
    yellow: 'bg-yellow-50 border-yellow-200/60',
    blue: 'bg-blue-50 border-blue-200/60',
    green: 'bg-green-50 border-green-200/60',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md',
        bgMap[accent] || 'bg-card border'
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {extra && (
        <p className="mt-0.5 text-xs text-muted-foreground">{extra}</p>
      )}
      {children}
    </motion.div>
  );
}

// ─── Quick Access Card ──────────────────────────────────────────────────────

function QuickAccessCard({
  href,
  icon,
  title,
  description,
  className: cardClassName,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  className: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={cn(
          'flex items-center gap-4 rounded-2xl border p-5 transition-shadow hover:shadow-lg',
          cardClassName
        )}
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Mini Yuki for Dashboard ────────────────────────────────────────────────

function MiniYukiDashboard() {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Yuki"
        role="img"
      >
        <path d="M50 90 L30 30 L80 70 Z" fill="#FF9F6B" />
        <path d="M50 85 L38 42 L72 72 Z" fill="#FFD6B8" />
        <path d="M150 90 L170 30 L120 70 Z" fill="#FF9F6B" />
        <path d="M150 85 L162 42 L128 72 Z" fill="#FFD6B8" />
        <circle cx="100" cy="110" r="65" fill="#FF9F6B" />
        <ellipse cx="100" cy="120" rx="45" ry="40" fill="#FFD6B8" />
        <ellipse cx="78" cy="100" rx="8" ry="10" fill="#2D1B0E" />
        <ellipse cx="75" cy="97" rx="3" ry="4" fill="white" />
        <ellipse cx="122" cy="100" rx="8" ry="10" fill="#2D1B0E" />
        <ellipse cx="119" cy="97" rx="3" ry="4" fill="white" />
        <ellipse cx="100" cy="115" rx="5" ry="4" fill="#2D1B0E" />
        <path
          d="M90 120 Q100 132 110 120"
          stroke="#2D1B0E"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="68" cy="118" rx="8" ry="5" fill="#FFB0B0" opacity="0.6" />
        <ellipse
          cx="132"
          cy="118"
          rx="8"
          ry="5"
          fill="#FFB0B0"
          opacity="0.6"
        />
      </svg>
    </motion.div>
  );
}
