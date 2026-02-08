'use client';

import { useContext } from 'react';
import { MascotContext, type MascotContextValue } from '@/providers/MascotProvider';

/**
 * Access the Mascot context from any client component wrapped in
 * `<MascotProvider>`.
 *
 * Provides: triggerReaction, setMood, hideMascot, showMascot, toggleBubble,
 * plus the current MascotState fields.
 */
export function useMascot(): MascotContextValue {
  const context = useContext(MascotContext);
  if (context === undefined) {
    throw new Error('useMascot must be used within a <MascotProvider>');
  }
  return context;
}
