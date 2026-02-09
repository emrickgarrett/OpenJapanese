import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tts?text=こんにちは&lang=ja
 *
 * Proxies text-to-speech requests to Google Translate's TTS endpoint.
 * Used as a fallback when the browser's Web Speech API has no Japanese
 * voices (e.g. Firefox on Windows).
 */

const ALLOWED_LANGS = new Set(['ja', 'ja-JP']);
const MAX_TEXT_LENGTH = 200;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const lang = searchParams.get('lang') ?? 'ja';

  if (!text || text.trim().length === 0) {
    return NextResponse.json(
      { error: 'text query parameter is required' },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `text must be ${MAX_TEXT_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  if (!ALLOWED_LANGS.has(lang)) {
    return NextResponse.json(
      { error: `lang must be one of: ${[...ALLOWED_LANGS].join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const ttsUrl = new URL('https://translate.google.com/translate_tts');
    ttsUrl.searchParams.set('ie', 'UTF-8');
    ttsUrl.searchParams.set('tl', lang);
    ttsUrl.searchParams.set('client', 'tw-ob');
    ttsUrl.searchParams.set('q', text);

    const response = await fetch(ttsUrl.toString(), {
      headers: {
        // Mimic a browser request to avoid being blocked
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      console.error(
        `[TTS] Google Translate returned ${response.status}: ${response.statusText}`
      );
      return NextResponse.json(
        { error: 'Failed to fetch audio from TTS service' },
        { status: 502 }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err) {
    console.error('[TTS] Error proxying TTS request:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
