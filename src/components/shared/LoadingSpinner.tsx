'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  /** Optional label shown below the spinner. Defaults to "Loading..." */
  label?: string;
  /** Size of the spinner circle in pixels. Defaults to 40. */
  size?: number;
}

export default function LoadingSpinner({
  label = 'Loading...',
  size = 40,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: size, height: size }}
        className="rounded-full border-4 border-primary/20 border-t-primary"
      />
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
