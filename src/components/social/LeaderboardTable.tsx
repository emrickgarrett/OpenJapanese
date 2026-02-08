'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { LeaderboardEntry } from '@/types/leaderboard';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

function getMedalEmoji(rank: number): string | null {
  if (rank === 1) return '\u{1F947}';
  if (rank === 2) return '\u{1F948}';
  if (rank === 3) return '\u{1F949}';
  return null;
}

function getRankStyles(rank: number): string {
  if (rank === 1) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
  if (rank === 2) return 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700';
  if (rank === 3) return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
  return '';
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">No leaderboard data available yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start studying to appear on the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Level
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  XP
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const medal = getMedalEmoji(entry.rank);
                const isCurrentUser = currentUserId === entry.profileId;
                const rankStyle = getRankStyles(entry.rank);

                return (
                  <motion.tr
                    key={entry.profileId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`border-b border-border transition-colors last:border-b-0 ${
                      isCurrentUser
                        ? 'bg-primary/5 dark:bg-primary/10'
                        : index % 2 === 0
                          ? 'bg-card'
                          : 'bg-muted/20'
                    } ${rankStyle}`}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        {medal ? (
                          <span className="text-lg">{medal}</span>
                        ) : (
                          <span className="text-muted-foreground">#{entry.rank}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/profile/${entry.profileId}`}
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                          <AvatarFallback className="text-xs">
                            {entry.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`text-sm font-medium ${
                            isCurrentUser ? 'text-primary' : ''
                          }`}
                        >
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="text-xs">
                        Lv. {entry.currentLevel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold">
                        {entry.totalXp.toLocaleString()}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">XP</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-sm">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {entry.currentStreak}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="space-y-2 md:hidden">
        {entries.map((entry, index) => {
          const medal = getMedalEmoji(entry.rank);
          const isCurrentUser = currentUserId === entry.profileId;
          const rankStyle = getRankStyles(entry.rank);

          return (
            <motion.div
              key={entry.profileId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link
                href={`/profile/${entry.profileId}`}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  isCurrentUser ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
                } ${rankStyle}`}
              >
                {/* Rank */}
                <div className="flex w-8 items-center justify-center">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar + name */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                  <AvatarFallback className="text-xs">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      isCurrentUser ? 'text-primary' : ''
                    }`}
                  >
                    {entry.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Lv. {entry.currentLevel}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {entry.totalXp.toLocaleString()} XP
                  </p>
                  <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {entry.currentStreak}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
