'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

import { useProfile } from '@/providers/ProfileProvider';
import { useLeaderboard } from '@/hooks/useLeaderboard';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeaderboardTable from '@/components/social/LeaderboardTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function LeaderboardPage() {
  const { profile } = useProfile();
  const { entries, isLoading, timeFilter, setTimeFilter } = useLeaderboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Trophy className="h-6 w-6 text-amber-500" />
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See how you stack up against other learners.
        </p>
      </motion.div>

      {/* Time filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs
          value={timeFilter}
          onValueChange={(v) => setTimeFilter(v as 'all' | 'weekly' | 'daily')}
        >
          <TabsList>
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="daily">Today</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Leaderboard content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {timeFilter === 'all'
                ? 'All Time Rankings'
                : timeFilter === 'weekly'
                  ? 'This Week\'s Top Learners'
                  : 'Today\'s Top Learners'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <LeaderboardTable entries={entries} currentUserId={profile?.id} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
