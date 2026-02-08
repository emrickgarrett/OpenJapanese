import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/reviews
 * Fetch due reviews for a profile.
 * Query params: profileId (required), limit (default 100)
 * Returns user_progress rows where next_review_at <= now AND srs_stage < 9
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);

  if (!profileId) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('profile_id', profileId)
    .lt('srs_stage', 9)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count: data?.length ?? 0 });
}

/**
 * POST /api/reviews
 * Submit review result.
 * Body: { profileId, itemType, itemId, reviewType, wasCorrect, previousStage, newStage, responseTimeMs, source }
 * - Inserts into review_history
 * - Updates user_progress with new SRS values
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    profileId,
    itemType,
    itemId,
    reviewType,
    wasCorrect,
    previousStage,
    newStage,
    responseTimeMs,
    source,
    // Optional SRS update fields
    newEaseFactor,
    newIntervalDays,
    newRepetitions,
    nextReviewAt,
    burnedAt,
  } = body;

  if (!profileId || !itemType || !itemId || reviewType === undefined || wasCorrect === undefined) {
    return NextResponse.json(
      { error: 'profileId, itemType, itemId, reviewType, and wasCorrect are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Insert review history entry
  const { data: reviewEntry, error: reviewError } = await supabase
    .from('review_history')
    .insert({
      profile_id: profileId,
      item_type: itemType,
      item_id: itemId,
      review_type: reviewType,
      was_correct: wasCorrect,
      previous_stage: previousStage ?? 0,
      new_stage: newStage ?? 0,
      response_time_ms: responseTimeMs ?? 0,
      source: source ?? 'review',
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  // Update user_progress with new SRS values
  const progressUpdate: Record<string, unknown> = {
    srs_stage: newStage,
    last_reviewed_at: new Date().toISOString(),
  };

  if (newEaseFactor !== undefined) progressUpdate.ease_factor = newEaseFactor;
  if (newIntervalDays !== undefined) progressUpdate.interval_days = newIntervalDays;
  if (newRepetitions !== undefined) progressUpdate.repetitions = newRepetitions;
  if (nextReviewAt !== undefined) progressUpdate.next_review_at = nextReviewAt;
  if (burnedAt !== undefined) progressUpdate.burned_at = burnedAt;

  // Use raw SQL increment via update
  const { error: progressError } = await supabase
    .from('user_progress')
    .update(progressUpdate)
    .eq('profile_id', profileId)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  // Increment correct/incorrect counters
  if (wasCorrect) {
    await supabase.rpc('increment_counter', {
      row_profile_id: profileId,
      row_item_type: itemType,
      row_item_id: itemId,
      counter_name: 'times_correct',
    }).then(() => {});

    if (reviewType === 'meaning' || reviewType === 'both') {
      await supabase.rpc('increment_counter', {
        row_profile_id: profileId,
        row_item_type: itemType,
        row_item_id: itemId,
        counter_name: 'meaning_correct',
      }).then(() => {});
    }
    if (reviewType === 'reading' || reviewType === 'both') {
      await supabase.rpc('increment_counter', {
        row_profile_id: profileId,
        row_item_type: itemType,
        row_item_id: itemId,
        counter_name: 'reading_correct',
      }).then(() => {});
    }
  } else {
    await supabase.rpc('increment_counter', {
      row_profile_id: profileId,
      row_item_type: itemType,
      row_item_id: itemId,
      counter_name: 'times_incorrect',
    }).then(() => {});

    if (reviewType === 'meaning' || reviewType === 'both') {
      await supabase.rpc('increment_counter', {
        row_profile_id: profileId,
        row_item_type: itemType,
        row_item_id: itemId,
        counter_name: 'meaning_incorrect',
      }).then(() => {});
    }
    if (reviewType === 'reading' || reviewType === 'both') {
      await supabase.rpc('increment_counter', {
        row_profile_id: profileId,
        row_item_type: itemType,
        row_item_id: itemId,
        counter_name: 'reading_incorrect',
      }).then(() => {});
    }
  }

  return NextResponse.json({ data: reviewEntry });
}
