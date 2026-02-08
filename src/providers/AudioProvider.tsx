'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { audioManager } from '@/lib/audio/manager';
import type { SoundName } from '@/lib/audio/sounds';
import { useProfile } from '@/providers/ProfileProvider';

// ── Context value shape ────────────────────────────────────────────────────

export interface AudioContextValue {
  /** Play a named sound effect. No-op when sound is disabled. */
  playSound: (name: SoundName) => void;
  /** Whether sound effects are currently enabled. */
  isSoundEnabled: boolean;
  /** Toggle sound on/off, persisting the preference to the user's profile. */
  toggleSound: () => void;
}

export const AudioContext = createContext<AudioContextValue | undefined>(
  undefined,
);

// ── Provider ───────────────────────────────────────────────────────────────

export function AudioProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useProfile();

  // Derive initial enabled state from the profile, defaulting to true
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // Sync the audioManager whenever the profile's sound_enabled value changes
  useEffect(() => {
    if (profile) {
      const enabled = profile.sound_enabled;
      setIsSoundEnabled(enabled);
      audioManager.setEnabled(enabled);
    }
  }, [profile?.sound_enabled, profile]);

  // Preload the most commonly used sounds so they play without delay
  useEffect(() => {
    audioManager.preload('correct', 'incorrect', 'click');
  }, []);

  // ── playSound ──────────────────────────────────────────────────────────

  const playSound = useCallback((name: SoundName) => {
    audioManager.play(name);
  }, []);

  // ── toggleSound ────────────────────────────────────────────────────────

  const toggleSound = useCallback(() => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    audioManager.setEnabled(next);

    // Persist to the user profile (fire-and-forget)
    updateProfile({ sound_enabled: next }).catch((err) => {
      console.warn('[AudioProvider] Failed to persist sound preference:', err);
    });
  }, [isSoundEnabled, updateProfile]);

  // ── Value ──────────────────────────────────────────────────────────────

  const value: AudioContextValue = {
    playSound,
    isSoundEnabled,
    toggleSound,
  };

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
