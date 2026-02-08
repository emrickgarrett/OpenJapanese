import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/streaks
 * Fetch streak for a profile.
 * Query param: profileId (required)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('profile_id', profileId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      data: {
        profile_id: profileId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        streak_freezes_available: 0,
      },
    });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/streaks
 * Update streak.
 * Body: { profileId, currentStreak, longestStreak, lastActivityDate, streakFreezesAvailable }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { profileId, currentStreak, longestStreak, lastActivityDate, streakFreezesAvailable } = body;

  if (!profileId) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  const upsertData: Record<string, unknown> = {
    profile_id: profileId,
  };

  if (currentStreak !== undefined) upsertData.current_streak = currentStreak;
  if (longestStreak !== undefined) upsertData.longest_streak = longestStreak;
  if (lastActivityDate !== undefined) upsertData.last_activity_date = lastActivityDate;
  if (streakFreezesAvailable !== undefined)
    upsertData.streak_freezes_available = streakFreezesAvailable;

  const { data, error } = await supabase
    .from('streaks')
    .upsert(upsertData, { onConflict: 'profile_id' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
