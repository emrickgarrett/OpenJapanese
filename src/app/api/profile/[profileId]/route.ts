import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// ─── GET /api/profile/:profileId ───────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const supabase = createServerClient();
  const { profileId } = await params;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json(
      { error: status === 404 ? 'Profile not found.' : error.message },
      { status }
    );
  }

  return NextResponse.json(data);
}

// ─── PATCH /api/profile/:profileId ─────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const supabase = createServerClient();
  const { profileId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  // Whitelist of fields the client is allowed to update
  const allowedFields = new Set([
    'username',
    'avatar_url',
    'display_name',
    'current_jlpt_level',
    'total_xp',
    'current_level',
    'sound_enabled',
    'theme',
    'daily_goal',
    'lesson_batch_size',
    'review_order',
    'last_active_at',
  ]);

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedFields.has(key)) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update.' },
      { status: 400 }
    );
  }

  // Always bump updated_at
  updates.updated_at = new Date().toISOString();

  // If username is being changed, verify it's unique
  if (updates.username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', updates.username as string)
      .neq('id', profileId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Username is already taken.' },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select('*')
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json(
      { error: status === 404 ? 'Profile not found.' : error.message },
      { status }
    );
  }

  return NextResponse.json(data);
}
