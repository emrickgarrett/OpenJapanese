'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, Flame, BookOpen, Trophy } from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { getXPProgress } from '@/lib/progression/xp';
import { ACHIEVEMENTS } from '@/lib/achievements/definitions';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import AchievementCard from '@/components/progress/AchievementCard';
import ShareButton from '@/components/social/ShareButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

import type { Profile } from '@/providers/ProfileProvider';
import type { UnlockedAchievement } from '@/types/achievement';

export default function PublicProfilePage() {
  const params = useParams();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Stats
  const [totalItems, setTotalItems] = useState(0);
  const [streak, setStreak] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    if (!profileId) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      // Fetch item count
      const { count } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId);

      setTotalItems(count ?? 0);

      // Fetch streak
      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('profile_id', profileId)
        .single();

      setStreak(streakData?.current_streak ?? 0);

      // Fetch achievements
      const { data: achievementData } = await supabase
        .from('unlocked_achievements')
        .select('*')
        .eq('profile_id', profileId);

      if (achievementData) {
        setUnlockedAchievements(
          achievementData.map((row) => ({
            id: row.id,
            profileId: row.profile_id,
            achievementKey: row.achievement_key,
            unlockedAt: row.unlocked_at,
          }))
        );
      }

      setIsLoading(false);
    };

    fetchData();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <p className="text-muted-foreground">
          The profile you are looking for does not exist or may have been removed.
        </p>
      </div>
    );
  }

  const xpProgress = getXPProgress(profile.total_xp);
  const unlockedKeys = new Set(unlockedAchievements.map((ua) => ua.achievementKey));
  const unlockedAtMap = new Map(
    unlockedAchievements.map((ua) => [ua.achievementKey, ua.unlockedAt])
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          This is {profile.display_name || profile.username}&apos;s profile
        </p>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.username}
                </h1>
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
          <ShareButton profileId={profileId} />
        </div>
      </motion.div>

      {/* XP Progress */}
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

      {/* Stat Cards */}
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
            value: totalItems.toLocaleString(),
            sub: 'Total items',
            icon: BookOpen,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Current Streak',
            value: `${streak} days`,
            sub: 'Keep it up!',
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
          },
          {
            label: 'Achievements',
            value: `${unlockedAchievements.length}`,
            sub: `of ${ACHIEVEMENTS.length} total`,
            icon: Trophy,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
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

      {/* Achievement Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" />
              Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {ACHIEVEMENTS.filter((a) => unlockedKeys.has(a.key)).map((achievement) => (
                <AchievementCard
                  key={achievement.key}
                  achievement={achievement}
                  unlocked
                  unlockedAt={unlockedAtMap.get(achievement.key)}
                />
              ))}
            </div>
            {unlockedAchievements.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No achievements unlocked yet.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
