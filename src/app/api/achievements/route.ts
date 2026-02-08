import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/achievements
 * Fetch unlocked achievements for a profile.
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
    .from('unlocked_achievements')
    .select('*')
    .eq('profile_id', profileId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/achievements
 * Unlock a new achievement.
 * Body: { profileId, achievementKey }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { profileId, achievementKey } = body;

  if (!profileId || !achievementKey) {
    return NextResponse.json(
      { error: 'profileId and achievementKey are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Check if already unlocked
  const { data: existing } = await supabase
    .from('unlocked_achievements')
    .select('id')
    .eq('profile_id', profileId)
    .eq('achievement_key', achievementKey)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'Achievement already unlocked', data: existing },
      { status: 409 }
    );
  }

  // Insert new achievement unlock
  const { data, error } = await supabase
    .from('unlocked_achievements')
    .insert({
      profile_id: profileId,
      achievement_key: achievementKey,
      unlocked_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
