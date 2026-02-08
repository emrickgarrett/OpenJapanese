'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotBubbleProps {
  text: string;
  isOpen: boolean;
  onClose?: () => void;
}

/**
 * Speech bubble with a typewriter text animation.
 *
 * Renders a rounded rectangle with a small triangle pointer at the bottom
 * that visually connects to the mascot below. Text types in character by
 * character using a simple interval-based approach, while the container
 * fades + scales in/out with framer-motion.
 */
export function MascotBubble({ text, isOpen, onClose }: MascotBubbleProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // ── Typewriter effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !text) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);

    let index = 0;
    const speed = 30; // ms per character

    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && text && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative max-w-[250px]"
        >
          {/* Bubble body */}
          <div
            className="rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-black/5"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm leading-relaxed text-gray-800">
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block ml-0.5 w-[2px] h-[14px] bg-gray-500 align-middle"
                />
              )}
            </p>

            {/* Close button */}
            {onClose && !isTyping && (
              <button
                onClick={onClose}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs hover:bg-gray-300 transition-colors"
                aria-label="Close speech bubble"
              >
                &times;
              </button>
            )}
          </div>

          {/* Triangle pointer pointing down */}
          <div className="flex justify-center">
            <div
              className="h-0 w-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid white',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
