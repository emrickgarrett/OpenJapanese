'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Flame,
  BookOpen,
  BarChart3,
  Trophy,
  Target,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { useProfile } from '@/providers/ProfileProvider';
import { useProgress } from '@/hooks/useProgress';
import { useStreak } from '@/hooks/useStreak';
import { useAchievements } from '@/hooks/useAchievements';
import { getXPProgress } from '@/lib/progression/xp';
import { SRS_STAGE_NAMES, SRS_STAGE_COLORS } from '@/lib/srs/constants';
import { ACHIEVEMENTS } from '@/lib/achievements/definitions';
import { supabase } from '@/lib/supabase/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import StatsChart from '@/components/progress/StatsChart';
import HeatMap from '@/components/progress/HeatMap';
import KanjiGrid from '@/components/progress/KanjiGrid';
import AchievementCard from '@/components/progress/AchievementCard';
import ShareButton from '@/components/social/ShareButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

import type { AchievementCategory } from '@/types/achievement';

// ─── SRS Bar Breakdown ──────────────────────────────────────────────────────

function SRSBreakdownBar({ srsBreakdown }: { srsBreakdown: Record<number, number> }) {
  const stages = [
    { label: 'Apprentice', stages: [1, 2, 3, 4], color: SRS_STAGE_COLORS[1] },
    { label: 'Guru', stages: [5, 6], color: SRS_STAGE_COLORS[5] },
    { label: 'Master', stages: [7], color: SRS_STAGE_COLORS[7] },
    { label: 'Enlightened', stages: [8], color: SRS_STAGE_COLORS[8] },
    { label: 'Burned', stages: [9], color: SRS_STAGE_COLORS[9] },
  ];

  const counts = stages.map((s) => ({
    ...s,
    count: s.stages.reduce((sum, st) => sum + (srsBreakdown[st] ?? 0), 0),
  }));

  const total = counts.reduce((sum, c) => sum + c.count, 0);

  if (total === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No items studied yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-8 overflow-hidden rounded-lg">
        {counts.map((stage) => {
          const pct = total > 0 ? (stage.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={stage.label}
              className="flex items-center justify-center text-xs font-medium text-white transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: stage.color,
                minWidth: stage.count > 0 ? '24px' : 0,
              }}
            >
              {pct > 8 ? stage.count : ''}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {counts.map((stage) => (
          <div key={stage.label} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-xs text-muted-foreground">
              {stage.label}: {stage.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Accuracy Chart ──────────────────────────────────────────────────────────

function AccuracyChart({
  dailyActivity,
}: {
  dailyActivity: { activityDate: string; reviewsCompleted: number }[];
}) {
  // Use last 14 days of data
  const chartData = useMemo(() => {
    const last14 = dailyActivity.slice(-14);
    return last14.map((d) => ({
      date: d.activityDate,
      reviews: d.reviewsCompleted,
    }));
  }, [dailyActivity]);

  if (chartData.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No review data for accuracy chart yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: string) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          width={30}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold">{payload[0].value} reviews</p>
              </div>
            );
          }}
        />
        <Bar dataKey="reviews" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.reviews >= 20
                  ? '#22c55e'
                  : entry.reviews >= 10
                    ? '#eab308'
                    : '#ef4444'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { profile } = useProfile();
  const { totalKanji, totalVocab, totalGrammar, srsBreakdown, dailyActivity, accuracy, reviewsToday, totalReviews, isLoading: progressLoading } = useProgress(profile?.id);
  const { currentStreak, longestStreak, isLoading: streakLoading } = useStreak(profile?.id);
  const { unlockedAchievements, isLoading: achievementsLoading } = useAchievements(profile?.id);
  const [achievementFilter, setAchievementFilter] = useState<'all' | AchievementCategory>('all');
  const [kanjiProgress, setKanjiProgress] = useState<
    { character: string; meanings: string[]; readings?: string[]; stage: number; jlptLevel?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' }[]
  >([]);
  const [kanjiLoaded, setKanjiLoaded] = useState(false);

  // Fetch kanji progress for grid
  useMemo(() => {
    if (!profile?.id || kanjiLoaded) return;

    const fetchKanji = async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('item_id, srs_stage, jlpt_level')
        .eq('profile_id', profile.id)
        .eq('item_type', 'kanji');

      if (data && data.length > 0) {
        // Fetch kanji details
        const itemIds = data.map((d) => d.item_id);
        const { data: kanjiData } = await supabase
          .from('kanji')
          .select('id, character, meanings, onyomi, kunyomi, jlpt_level')
          .in('id', itemIds);

        if (kanjiData) {
          const progressMap = new Map(data.map((d) => [d.item_id, d]));
          const mapped = kanjiData.map((k) => {
            const prog = progressMap.get(k.id);
            return {
              character: k.character,
              meanings: k.meanings ?? [],
              readings: [...(k.onyomi ?? []), ...(k.kunyomi ?? [])],
              stage: prog?.srs_stage ?? 0,
              jlptLevel: (k.jlpt_level ?? prog?.jlpt_level) as 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | undefined,
            };
          });
          setKanjiProgress(mapped);
        }
      }
      setKanjiLoaded(true);
    };

    fetchKanji();
  }, [profile?.id, kanjiLoaded]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isLoading = progressLoading || streakLoading || achievementsLoading;
  const xpProgress = getXPProgress(profile.total_xp);
  const totalItemsLearned = totalKanji + totalVocab + totalGrammar;

  // Build XP growth chart from daily activity
  const xpChartData = useMemo(() => {
    const last30 = dailyActivity.slice(-30);
    let cumulativeXp = profile.total_xp;

    // Calculate total XP earned in last 30 days to find starting point
    const totalEarned = last30.reduce((sum, d) => sum + d.xpEarned, 0);
    cumulativeXp = profile.total_xp - totalEarned;

    return last30.map((d) => {
      cumulativeXp += d.xpEarned;
      return { date: d.activityDate, value: cumulativeXp };
    });
  }, [dailyActivity, profile.total_xp]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    return dailyActivity.map((d) => ({
      date: d.activityDate,
      count: d.reviewsCompleted + d.lessonsCompleted,
    }));
  }, [dailyActivity]);

  // Achievement filtering
  const unlockedKeys = new Set(unlockedAchievements.map((ua) => ua.achievementKey));
  const unlockedAtMap = new Map(
    unlockedAchievements.map((ua) => [ua.achievementKey, ua.unlockedAt])
  );

  const filteredAchievements =
    achievementFilter === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === achievementFilter);

  const achievementCategories: { label: string; value: 'all' | AchievementCategory }[] = [
    { label: 'All', value: 'all' },
    { label: 'Learning', value: 'learning' },
    { label: 'Streak', value: 'streak' },
    { label: 'Mastery', value: 'mastery' },
    { label: 'Games', value: 'games' },
    { label: 'Special', value: 'special' },
  ];

  return (
    <div className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-primary/20">
            {profile.avatar_url && /^https?:\/\/|^\//.test(profile.avatar_url) ? (
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
              {profile.avatar_url && !/^https?:\/\/|^\//.test(profile.avatar_url)
                ? profile.avatar_url
                : profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
              <Badge variant="secondary" className="text-xs">
                Lv. {xpProgress.currentLevel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                {profile.current_jlpt_level}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Member since{' '}
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
        <ShareButton profileId={profile.id} />
      </motion.div>

      {/* XP Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Level {xpProgress.currentLevel}</span>
          <span className="text-muted-foreground">
            {xpProgress.xpInCurrentLevel.toLocaleString()} / {xpProgress.xpForNextLevel.toLocaleString()} XP
          </span>
        </div>
        <Progress value={xpProgress.progressPercent} className="mt-1 h-3" />
      </motion.div>

      {/* ─── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Total XP',
            value: profile.total_xp.toLocaleString(),
            sub: `Level ${xpProgress.currentLevel}`,
            icon: Star,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Items Learned',
            value: totalItemsLearned.toLocaleString(),
            sub: `${totalKanji} kanji, ${totalVocab} vocab, ${totalGrammar} grammar`,
            icon: BookOpen,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Reviews Done',
            value: totalReviews.toLocaleString(),
            sub: `${accuracy}% accuracy`,
            icon: BarChart3,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Current Streak',
            value: `${currentStreak} days`,
            sub: `Best: ${longestStreak} days`,
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-xl font-bold">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── XP Progress Chart ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-amber-500" />
              XP Growth (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {xpChartData.length > 0 ? (
              <StatsChart data={xpChartData} label="" color="#e91e63" />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Start studying to see your XP growth!
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── SRS Breakdown ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              SRS Stage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SRSBreakdownBar srsBreakdown={srsBreakdown} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Activity Heatmap ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-green-500" />
              Activity (Last 90 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HeatMap data={heatmapData} days={90} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Kanji Grid ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kanji Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {kanjiProgress.length > 0 ? (
              <KanjiGrid progress={kanjiProgress} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No kanji learned yet. Start your first lesson!
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Achievement Showcase ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" />
              Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={achievementFilter}
              onValueChange={(v) => setAchievementFilter(v as 'all' | AchievementCategory)}
              className="mb-4"
            >
              <TabsList className="flex-wrap">
                {achievementCategories.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {/* Unlocked achievements first, then locked */}
              {[...filteredAchievements]
                .sort((a, b) => {
                  const aUnlocked = unlockedKeys.has(a.key);
                  const bUnlocked = unlockedKeys.has(b.key);
                  if (aUnlocked && !bUnlocked) return -1;
                  if (!aUnlocked && bUnlocked) return 1;
                  return 0;
                })
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.key}
                    achievement={achievement}
                    unlocked={unlockedKeys.has(achievement.key)}
                    unlockedAt={unlockedAtMap.get(achievement.key)}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Accuracy Chart ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-green-500" />
              Daily Reviews (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AccuracyChart dailyActivity={dailyActivity} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
