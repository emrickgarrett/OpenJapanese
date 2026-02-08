import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/progress
 * Fetch user progress. Query params: profileId (required), itemType (optional), jlptLevel (optional)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');
  const itemType = searchParams.get('itemType');
  const jlptLevel = searchParams.get('jlptLevel');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  let query = supabase
    .from('user_progress')
    .select('*')
    .eq('profile_id', profileId);

  if (itemType) {
    query = query.eq('item_type', itemType);
  }

  if (jlptLevel) {
    query = query.eq('jlpt_level', jlptLevel);
  }

  const { data, error } = await query.order('unlocked_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/progress
 * Create or update a progress entry.
 * Body: { profileId, itemType, itemId, jlptLevel, srsStage, easeFactor, intervalDays, repetitions, nextReviewAt, ... }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    profileId,
    itemType,
    itemId,
    jlptLevel,
    srsStage,
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt,
    lastReviewedAt,
    timesCorrect,
    timesIncorrect,
    meaningCorrect,
    meaningIncorrect,
    readingCorrect,
    readingIncorrect,
    burnedAt,
  } = body;

  if (!profileId || !itemType || !itemId) {
    return NextResponse.json(
      { error: 'profileId, itemType, and itemId are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Upsert: update if exists, insert if not
  const upsertData: Record<string, unknown> = {
    profile_id: profileId,
    item_type: itemType,
    item_id: itemId,
  };

  if (jlptLevel !== undefined) upsertData.jlpt_level = jlptLevel;
  if (srsStage !== undefined) upsertData.srs_stage = srsStage;
  if (easeFactor !== undefined) upsertData.ease_factor = easeFactor;
  if (intervalDays !== undefined) upsertData.interval_days = intervalDays;
  if (repetitions !== undefined) upsertData.repetitions = repetitions;
  if (nextReviewAt !== undefined) upsertData.next_review_at = nextReviewAt;
  if (lastReviewedAt !== undefined) upsertData.last_reviewed_at = lastReviewedAt;
  if (timesCorrect !== undefined) upsertData.times_correct = timesCorrect;
  if (timesIncorrect !== undefined) upsertData.times_incorrect = timesIncorrect;
  if (meaningCorrect !== undefined) upsertData.meaning_correct = meaningCorrect;
  if (meaningIncorrect !== undefined) upsertData.meaning_incorrect = meaningIncorrect;
  if (readingCorrect !== undefined) upsertData.reading_correct = readingCorrect;
  if (readingIncorrect !== undefined) upsertData.reading_incorrect = readingIncorrect;
  if (burnedAt !== undefined) upsertData.burned_at = burnedAt;

  const { data, error } = await supabase
    .from('user_progress')
    .upsert(upsertData, {
      onConflict: 'profile_id,item_type,item_id',
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
