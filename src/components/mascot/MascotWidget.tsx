'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMascot } from '@/hooks/useMascot';
import { Mascot } from './Mascot';
import { MascotBubble } from './MascotBubble';

/**
 * Floating mascot widget anchored to the bottom-right corner.
 *
 * - Pulls mood and dialogue from MascotProvider
 * - Clicking the mascot toggles the speech bubble
 * - Extra bottom offset on mobile to account for a bottom nav bar
 * - Z-index is high but below typical modal overlays (z-50)
 */
export function MascotWidget() {
  const {
    currentMood,
    currentDialogue,
    isVisible,
    isBubbleOpen,
    toggleBubble,
  } = useMascot();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="fixed bottom-20 right-4 z-40 flex flex-col items-center gap-1 sm:bottom-6 sm:right-6"
        >
          {/* Speech bubble */}
          <MascotBubble
            text={currentDialogue ?? ''}
            isOpen={isBubbleOpen && currentDialogue !== null}
            onClose={toggleBubble}
          />

          {/* Mascot avatar button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleBubble}
            className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            aria-label="Talk to Yuki"
          >
            <Mascot mood={currentMood} size="sm" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
