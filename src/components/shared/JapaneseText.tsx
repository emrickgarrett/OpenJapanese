'use client';

import { cn } from '@/lib/utils';

interface JapaneseTextProps {
  text: string;
  reading?: string;
  showReading?: boolean;
  className?: string;
}

export default function JapaneseText({
  text,
  reading,
  showReading = true,
  className,
}: JapaneseTextProps) {
  if (!reading || !showReading) {
    return (
      <span className={cn('font-japanese', className)}>
        {text}
      </span>
    );
  }

  return (
    <ruby className={cn('font-japanese', className)}>
      {text}
      <rt className="text-[0.5em] font-normal text-muted-foreground">
        {reading}
      </rt>
    </ruby>
  );
}
