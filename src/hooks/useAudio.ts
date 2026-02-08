'use client';

import { useContext } from 'react';
import {
  AudioContext,
  type AudioContextValue,
} from '@/providers/AudioProvider';

/**
 * Access the Audio context from any client component wrapped in
 * `<AudioProvider>`.
 *
 * Provides: playSound, isSoundEnabled, toggleSound.
 */
export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an <AudioProvider>');
  }
  return context;
}
