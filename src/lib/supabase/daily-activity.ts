import { supabase } from '@/lib/supabase/client';

/**
 * Increments daily activity counters for a profile.
 *
 * Fetches any existing row for the given profile + date, then upserts
 * with the incremented values. This avoids overwriting existing counts
 * and works without a server-side RPC function.
 */
export async function trackDailyActivity(
  profileId: string,
  updates: {
    xpEarned?: number;
    reviewsCompleted?: number;
    lessonsCompleted?: number;
    gamesPlayed?: number;
    itemsLearned?: number;
    itemsBurned?: number;
  }
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Fetch existing row for today (may not exist)
  const { data: existing } = await supabase
    .from('daily_activity')
    .select('xp_earned, reviews_completed, lessons_completed, games_played, items_learned, items_burned')
    .eq('profile_id', profileId)
    .eq('activity_date', today)
    .single();

  const row = {
    profile_id: profileId,
    activity_date: today,
    xp_earned: (existing?.xp_earned ?? 0) + (updates.xpEarned ?? 0),
    reviews_completed: (existing?.reviews_completed ?? 0) + (updates.reviewsCompleted ?? 0),
    lessons_completed: (existing?.lessons_completed ?? 0) + (updates.lessonsCompleted ?? 0),
    games_played: (existing?.games_played ?? 0) + (updates.gamesPlayed ?? 0),
    items_learned: (existing?.items_learned ?? 0) + (updates.itemsLearned ?? 0),
    items_burned: (existing?.items_burned ?? 0) + (updates.itemsBurned ?? 0),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('daily_activity')
    .upsert(row, { onConflict: 'profile_id,activity_date' });

  if (error) {
    console.error('[trackDailyActivity] Failed to upsert daily_activity:', error);
  }
}
