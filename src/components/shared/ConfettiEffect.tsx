'use client';

import { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiEffectProps {
  isActive: boolean;
}

export function ConfettiEffect({ isActive }: ConfettiEffectProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [shouldRun, setShouldRun] = useState(false);
  const [numberOfPieces, setNumberOfPieces] = useState(200);

  // Track window dimensions
  useEffect(() => {
    function updateDimensions() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Start confetti when active, stop after 3 seconds
  useEffect(() => {
    if (isActive) {
      setShouldRun(true);
      setNumberOfPieces(200);

      const stopTimer = setTimeout(() => {
        setNumberOfPieces(0);
      }, 3000);

      const hideTimer = setTimeout(() => {
        setShouldRun(false);
      }, 6000);

      return () => {
        clearTimeout(stopTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShouldRun(false);
    }
  }, [isActive]);

  if (!shouldRun) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <ReactConfetti
        width={dimensions.width}
        height={dimensions.height}
        numberOfPieces={numberOfPieces}
        recycle={false}
        colors={[
          '#ec4899', // pink-500
          '#a855f7', // purple-500
          '#f472b6', // pink-400
          '#c084fc', // purple-400
          '#fbbf24', // amber-400
          '#34d399', // emerald-400
          '#60a5fa', // blue-400
        ]}
        gravity={0.25}
        tweenDuration={5000}
      />
    </div>
  );
}
