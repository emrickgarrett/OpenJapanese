'use client';

import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  speakJapanese,
  loadVoices,
  isSpeechSupported,
} from '@/lib/audio/speech';

interface AudioButtonProps {
  text: string;
  lang?: string;
  className?: string;
}

export default function AudioButton({
  text,
  lang = 'ja-JP',
  className,
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Pre-load voices on mount so they are ready when the user clicks
  useEffect(() => {
    if (!isSpeechSupported()) {
      setIsAvailable(false);
      return;
    }

    // Kick off voice loading early
    loadVoices().then((voices) => {
      // If the browser has speech synthesis but no voices at all,
      // mark as unavailable
      if (voices.length === 0) {
        setIsAvailable(false);
      }
    });
  }, []);

  const speak = useCallback(async () => {
    if (!isAvailable) return;

    const ok = await speakJapanese({
      text,
      lang,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });

    if (!ok) {
      setIsAvailable(false);
    }
  }, [text, lang, isAvailable]);

  if (!isAvailable) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        disabled
        className={cn('rounded-full cursor-not-allowed opacity-50', className)}
        aria-label="Pronunciation unavailable"
        title="Speech synthesis is not available in this browser"
      >
        <VolumeX className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={speak}
      disabled={isPlaying}
      className={cn(
        'rounded-full transition-colors',
        isPlaying && 'bg-primary/10 text-primary',
        className
      )}
      aria-label={`Play pronunciation for ${text}`}
    >
      <Volume2 className={cn('size-4', isPlaying && 'animate-pulse')} />
    </Button>
  );
}
