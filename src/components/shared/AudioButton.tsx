'use client';

import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  speakJapanese,
  loadVoices,
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

  // Pre-load voices on mount so they are ready when the user clicks.
  // We no longer disable the button when voices are empty because the
  // Google Translate TTS fallback is always available.
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      loadVoices();
    }
    // The button stays enabled regardless — speakJapanese() handles
    // the fallback internally.
  }, []);

  const speak = useCallback(async () => {
    if (!isAvailable || isPlaying) return;

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
  }, [text, lang, isAvailable, isPlaying]);

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
