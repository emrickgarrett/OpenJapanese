import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/leaderboard
 * Fetch leaderboard data.
 * Query params:
 *  - timeFilter: 'all' | 'weekly' | 'daily' (default: 'all')
 *  - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeFilter = searchParams.get('timeFilter') ?? 'all';
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  const supabase = createServerClient();

  if (timeFilter === 'all') {
    // Simple total_xp ordering from profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, total_xp, current_level')
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch streaks for these profiles
    const profileIds = profiles.map((p) => p.id);
    const { data: streaks } = await supabase
      .from('streaks')
      .select('profile_id, current_streak')
      .in('profile_id', profileIds);

    const streakMap = new Map<string, number>();
    if (streaks) {
      for (const s of streaks) {
        streakMap.set(s.profile_id, s.current_streak ?? 0);
      }
    }

    const entries = profiles.map((p, index) => ({
      rank: index + 1,
      profileId: p.id,
      username: p.username ?? 'Anonymous',
      avatarUrl: p.avatar_url ?? '',
      totalXp: p.total_xp ?? 0,
      currentLevel: p.current_level ?? 0,
      currentStreak: streakMap.get(p.id) ?? 0,
    }));

    return NextResponse.json({ data: entries });
  }

  // Time-filtered leaderboard: sum xp_earned from daily_activity
  const now = new Date();
  let startDate: string;

  if (timeFilter === 'weekly') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate = weekAgo.toISOString().split('T')[0];
  } else {
    // daily
    startDate = now.toISOString().split('T')[0];
  }

  const { data: activityData, error: activityError } = await supabase
    .from('daily_activity')
    .select('profile_id, xp_earned')
    .gte('activity_date', startDate);

  if (activityError) {
    return NextResponse.json({ error: activityError.message }, { status: 500 });
  }

  if (!activityData || activityData.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Aggregate XP per profile
  const xpMap = new Map<string, number>();
  for (const row of activityData) {
    const current = xpMap.get(row.profile_id) ?? 0;
    xpMap.set(row.profile_id, current + (row.xp_earned ?? 0));
  }

  // Sort and limit
  const sorted = Array.from(xpMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const profileIds = sorted.map(([id]) => id);

  // Fetch profile details
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, total_xp, current_level')
    .in('id', profileIds);

  const { data: streaks } = await supabase
    .from('streaks')
    .select('profile_id, current_streak')
    .in('profile_id', profileIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const streakMap = new Map<string, number>();
  if (streaks) {
    for (const s of streaks) {
      streakMap.set(s.profile_id, s.current_streak ?? 0);
    }
  }

  const entries = sorted.map(([id, xp], index) => {
    const p = profileMap.get(id);
    return {
      rank: index + 1,
      profileId: id,
      username: p?.username ?? 'Anonymous',
      avatarUrl: p?.avatar_url ?? '',
      totalXp: xp,
      currentLevel: p?.current_level ?? 0,
      currentStreak: streakMap.get(id) ?? 0,
    };
  });

  return NextResponse.json({ data: entries });
}
