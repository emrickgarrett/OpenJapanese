'use client';

/**
 * Shared speech synthesis utility.
 *
 * Handles the main cross-browser pitfalls:
 *  - `getVoices()` returns [] on the first call in Firefox / Chrome.
 *    We wait for the `voiceschanged` event before resolving, plus
 *    poll every 200 ms as a fallback.
 *  - Firefox on Windows will not speak at all unless a voice object
 *    is explicitly assigned to the utterance — **and** often has zero
 *    Japanese voices installed via SAPI.
 *  - When no Japanese voice is available, we fall back to a server-side
 *    Google Translate TTS proxy (`/api/tts`) that returns MP3 audio.
 *  - Provides a single `speakJapanese()` API so every call-site
 *    behaves identically.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;
let voiceLoadPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/** Cached result of whether we found a Japanese voice. `null` = not checked yet. */
let hasJapaneseVoiceCache: boolean | null = null;

// ── Voice loading ──────────────────────────────────────────────────────

/**
 * Returns the list of available voices, waiting for them to load if
 * necessary.  Safe to call multiple times — the result is cached.
 *
 * Improvement over the original: polls every 200 ms for up to 3 s in
 * addition to listening for the `voiceschanged` event, because Firefox
 * on Windows sometimes never fires the event.
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }

  if (voicesLoaded && cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  // Try synchronous first (works in some browsers after first load)
  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length > 0) {
    cachedVoices = immediate;
    voicesLoaded = true;
    return Promise.resolve(cachedVoices);
  }

  // Already waiting — return the same promise
  if (voiceLoadPromise) return voiceLoadPromise;

  voiceLoadPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        onVoicesChanged
      );
      if (pollTimer) clearInterval(pollTimer);
      resolve(cachedVoices);
    };

    const onVoicesChanged = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        cachedVoices = v;
        settle();
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Poll every 200 ms — Firefox on Windows may never fire voiceschanged
    const pollTimer = setInterval(() => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        cachedVoices = v;
        settle();
      }
    }, 200);

    // Hard timeout after 3 seconds — resolve with whatever we have
    setTimeout(() => {
      settle();
    }, 3000);
  });

  return voiceLoadPromise;
}

// ── Voice selection ────────────────────────────────────────────────────

/**
 * Find the best Japanese voice from the available set.
 */
export function findJapaneseVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  // Some browsers list ja-JP, others ja_JP, others just ja
  return (
    voices.find((v) => v.lang === 'ja-JP') ||
    voices.find((v) => v.lang.startsWith('ja'))
  );
}

// ── Speak options ──────────────────────────────────────────────────────

export interface SpeakOptions {
  /** Text to speak */
  text: string;
  /** BCP-47 language tag (default: 'ja-JP') */
  lang?: string;
  /** Speech rate 0.1 – 10 (default: 0.8) */
  rate?: number;
  /** Pitch 0 – 2 (default: 1) */
  pitch?: number;
  /** Called when speech starts */
  onStart?: () => void;
  /** Called when speech finishes normally */
  onEnd?: () => void;
  /** Called on error */
  onError?: (e: SpeechSynthesisErrorEvent | Event) => void;
}

// ── Fallback: Google Translate TTS via /api/tts ────────────────────────

/** Currently playing fallback audio element, so we can stop it. */
let activeFallbackAudio: HTMLAudioElement | null = null;

/**
 * Speak text using the server-side Google Translate TTS proxy.
 * Returns `true` if playback started successfully.
 */
async function speakViaFallback(opts: SpeakOptions): Promise<boolean> {
  const { text, lang = 'ja', onStart, onEnd, onError } = opts;

  // Stop any currently playing fallback audio
  if (activeFallbackAudio) {
    activeFallbackAudio.pause();
    activeFallbackAudio = null;
  }

  try {
    const params = new URLSearchParams({
      text,
      lang: lang.startsWith('ja') ? 'ja' : lang,
    });

    const response = await fetch(`/api/tts?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`TTS API returned ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeFallbackAudio = audio;

    audio.addEventListener('play', () => {
      onStart?.();
    }, { once: true });

    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
      activeFallbackAudio = null;
      onEnd?.();
    }, { once: true });

    audio.addEventListener('error', (e) => {
      URL.revokeObjectURL(url);
      activeFallbackAudio = null;
      onError?.(e);
    }, { once: true });

    await audio.play();
    return true;
  } catch (err) {
    console.error('[TTS Fallback] Error:', err);
    onError?.(new Event('error'));
    return false;
  }
}

// ── Main API ───────────────────────────────────────────────────────────

/**
 * Speak the given text using the Web Speech API, falling back to
 * Google Translate TTS when no Japanese voice is available.
 *
 * Returns `false` only if both methods are completely unavailable.
 */
export async function speakJapanese(opts: SpeakOptions): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  const {
    text,
    lang = 'ja-JP',
    rate = 0.8,
    pitch = 1,
    onStart,
    onEnd,
    onError,
  } = opts;

  // ── Try Web Speech API first ─────────────────────────────────────
  if ('speechSynthesis' in window) {
    // Cancel anything currently speaking
    window.speechSynthesis.cancel();

    const voices = await loadVoices();
    const japaneseVoice = findJapaneseVoice(voices);

    // Cache the result so AudioButton can check without re-loading
    hasJapaneseVoiceCache = !!japaneseVoice;

    if (japaneseVoice) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.voice = japaneseVoice;

      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;
      if (onError) utterance.onerror = onError;

      window.speechSynthesis.speak(utterance);
      return true;
    }
  }

  // ── Fallback to Google Translate TTS ─────────────────────────────
  return speakViaFallback(opts);
}

/**
 * Returns `true` when the browser supports the Web Speech API.
 * Note: even if this returns `false`, audio may still work via the
 * Google Translate TTS fallback.
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Returns `true` if *some* form of Japanese TTS is available.
 * This includes both the Web Speech API (when a Japanese voice exists)
 * and the server-side Google Translate fallback.
 *
 * Always returns `true` because the fallback API is always reachable.
 */
export function isJapaneseTTSAvailable(): boolean {
  return true;
}

/**
 * Returns the cached result of whether a native Japanese voice was found.
 * `null` if voices haven't been checked yet.
 */
export function hasNativeJapaneseVoice(): boolean | null {
  return hasJapaneseVoiceCache;
}
