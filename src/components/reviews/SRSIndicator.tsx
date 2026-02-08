'use client';

import { SRS_STAGE_NAMES, SRS_STAGE_COLORS } from '@/lib/srs/constants';
import { cn } from '@/lib/utils';

interface SRSIndicatorProps {
  stage: number;
  compact?: boolean;
  className?: string;
}

export default function SRSIndicator({
  stage,
  compact = false,
  className,
}: SRSIndicatorProps) {
  const name = SRS_STAGE_NAMES[stage] ?? 'Unknown';
  const color = SRS_STAGE_COLORS[stage] ?? '#A0A0A0';

  if (compact) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5', className)}
        title={name}
      >
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        color: color,
        borderColor: `${color}40`,
        borderWidth: '1px',
      }}
    >
      <span
        className="inline-block size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
