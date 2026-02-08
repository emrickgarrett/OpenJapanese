'use client';

/**
 * Shared speech synthesis utility.
 *
 * Handles the main cross-browser pitfalls:
 *  - `getVoices()` returns [] on the first call in Firefox / Chrome.
 *    We wait for the `voiceschanged` event before resolving.
 *  - Firefox on Windows will not speak at all unless a voice object
 *    is explicitly assigned to the utterance.
 *  - Provides a single `speakJapanese()` API so every call-site
 *    behaves identically.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;
let voiceLoadPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Returns the list of available voices, waiting for them to load if
 * necessary.  Safe to call multiple times — the result is cached.
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
    const onVoicesChanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        onVoicesChanged
      );
      resolve(cachedVoices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Safety timeout — some browsers never fire voiceschanged
    setTimeout(() => {
      if (!voicesLoaded) {
        cachedVoices = window.speechSynthesis.getVoices();
        voicesLoaded = true;
        window.speechSynthesis.removeEventListener(
          'voiceschanged',
          onVoicesChanged
        );
        resolve(cachedVoices);
      }
    }, 2000);
  });

  return voiceLoadPromise;
}

/**
 * Find the best Japanese voice from the available set.
 */
export function findJapaneseVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  // Prefer a voice whose lang starts with 'ja'
  // Some browsers list ja-JP, others ja_JP, others just ja
  return (
    voices.find((v) => v.lang === 'ja-JP') ||
    voices.find((v) => v.lang.startsWith('ja'))
  );
}

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
  onError?: (e: SpeechSynthesisErrorEvent) => void;
}

/**
 * Speak the given text using the Web Speech API.
 *
 * Automatically loads voices, picks the best Japanese voice, and
 * handles Firefox quirks.  Returns `false` if speech synthesis is
 * unavailable.
 */
export async function speakJapanese(opts: SpeakOptions): Promise<boolean> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
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

  // Cancel anything currently speaking
  window.speechSynthesis.cancel();

  const voices = await loadVoices();
  const japaneseVoice = findJapaneseVoice(voices);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;

  if (japaneseVoice) {
    utterance.voice = japaneseVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Returns `true` when the browser supports the Web Speech API.
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
