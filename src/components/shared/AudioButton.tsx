'use client';

import { useState, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
    utterance.pitch = 1;

    // Try to find a Japanese voice
    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice = voices.find((v) => v.lang.startsWith('ja'));
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [text, lang]);

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
