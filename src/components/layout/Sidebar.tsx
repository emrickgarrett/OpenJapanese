'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  Gamepad2,
  User,
  Trophy,
  Settings,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useProfile } from '@/providers/ProfileProvider';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lessons', label: 'Lessons', icon: BookOpen },
  { href: '/reviews', label: 'Reviews', icon: RefreshCw },
  { href: '/games', label: 'Games', icon: Gamepad2 },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { profile } = useProfile();

  // Derive streak from profile if available (fallback to 0)
  const streak = profile?.current_level ?? 0;

  return (
    <TooltipProvider delayDuration={100}>
      <motion.aside
        initial={false}
        animate={{ width: expanded ? 240 : 64 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-sidebar-border bg-sidebar"
      >
        {/* ── Logo & expand toggle ───────────────────────────────────── */}
        <div className="flex h-16 items-center gap-2 px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-sidebar-accent"
          >
            <span className="text-xl leading-none">🦊</span>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap text-sm font-bold text-sidebar-foreground"
                >
                  OpenJapanese
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </button>
        </div>

        {/* ── Navigation links ───────────────────────────────────────── */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0"
                >
                  <Icon className="h-5 w-5" />
                </motion.div>

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );

            // When collapsed, wrap each link in a tooltip
            if (!expanded) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* ── Streak display at bottom ───────────────────────────────── */}
        <div className="border-t border-sidebar-border px-2 py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm',
                  'bg-gradient-to-r from-orange-500/10 to-amber-500/10',
                )}
              >
                <Flame className="h-5 w-5 flex-shrink-0 text-orange-500" />
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-1 overflow-hidden whitespace-nowrap"
                    >
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {streak}
                      </span>
                      <span className="text-muted-foreground">day streak</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" sideOffset={8}>
                {streak} day streak
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
