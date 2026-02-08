'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, Star } from 'lucide-react';
import { useProfile } from '@/providers/ProfileProvider';
import { useStreak } from '@/hooks/useStreak';
import { cn } from '@/lib/utils';

/** Maps route prefixes to human-readable page titles. */
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/lessons': 'Lessons',
  '/reviews': 'Reviews',
  '/games': 'Games',
  '/profile': 'Profile',
  '/leaderboard': 'Leaderboard',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return title;
    }
  }
  return 'OpenJapanese';
}

function formatXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
  return String(xp);
}

export default function Header() {
  const pathname = usePathname();
  const { profile, isLoading } = useProfile();
  const title = getPageTitle(pathname);

  const displayXp = useMemo(
    () => formatXp(profile?.total_xp ?? 0),
    [profile?.total_xp],
  );

  const level = profile?.current_level ?? 0;
  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.display_name ?? profile?.username ?? '?';
  const initial = displayName.charAt(0).toUpperCase();
  const { currentStreak } = useStreak(profile?.id);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
      {/* ── Left: page title ─────────────────────────────────────── */}
      <h1 className="text-lg font-bold tracking-tight md:text-xl">{title}</h1>

      {/* ── Right: stats & avatar ────────────────────────────────── */}
      <div className="flex items-center gap-2 md:gap-3">
        {!isLoading && profile && (
          <>
            {/* Streak */}
            <motion.div
              key={`streak-${currentStreak}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-sm font-semibold text-orange-600 dark:text-orange-400"
            >
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">{currentStreak}</span>
            </motion.div>

            {/* XP badge */}
            <motion.div
              key={`xp-${profile.total_xp}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-sm font-semibold text-amber-600 dark:text-amber-400"
            >
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">{displayXp}</span>
            </motion.div>

            {/* Level badge */}
            <motion.div
              key={`level-${level}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                'bg-primary/15 text-primary ring-2 ring-primary/30',
              )}
            >
              {level}
            </motion.div>

            {/* Avatar */}
            <Link
              href="/profile"
              className="flex-shrink-0 transition-transform hover:scale-105"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-primary/30">
                  {initial}
                </div>
              )}
            </Link>
          </>
        )}

        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          </div>
        )}
      </div>
    </header>
  );
}
