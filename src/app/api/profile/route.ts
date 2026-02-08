import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// ─── GET /api/profile?id=…  or  /api/profile?username=… ────────────────────

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');
  const username = searchParams.get('username');

  if (!id && !username) {
    return NextResponse.json(
      { error: 'Provide either "id" or "username" query parameter.' },
      { status: 400 }
    );
  }

  let query = supabase.from('profiles').select('*');

  if (id) {
    query = query.eq('id', id);
  } else if (username) {
    query = query.eq('username', username);
  }

  const { data, error } = await query.single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json(
      { error: status === 404 ? 'Profile not found.' : error.message },
      { status }
    );
  }

  return NextResponse.json(data);
}

// ─── POST /api/profile ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  let body: { username?: string; avatarUrl?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const { username, avatarUrl, displayName } = body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return NextResponse.json(
      { error: 'A non-empty "username" is required.' },
      { status: 400 }
    );
  }

  const trimmedUsername = username.trim();

  // Check uniqueness
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', trimmedUsername)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'Username is already taken.' },
      { status: 409 }
    );
  }

  // Insert
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      username: trimmedUsername,
      avatar_url: avatarUrl ?? null,
      display_name: displayName ?? null,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
