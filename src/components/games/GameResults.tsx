'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star, RotateCcw, ArrowLeft, Trophy, Target, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameType } from '@/types/game';
import { useProfile } from '@/providers/ProfileProvider';
import { useAchievements } from '@/hooks/useAchievements';
import { useMascot } from '@/hooks/useMascot';
import { trackDailyActivity } from '@/lib/supabase/daily-activity';
import ReactConfetti from 'react-confetti';

interface GameResultsProps {
  gameType: GameType;
  score: number;
  maxScore: number;
  accuracy: number;
  timeSeconds: number;
  xpEarned: number;
  onPlayAgain: () => void;
}

export default function GameResults({
  gameType,
  score,
  maxScore,
  accuracy,
  timeSeconds,
  xpEarned,
  onPlayAgain,
}: GameResultsProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const { checkAfterAction } = useAchievements(profile?.id);
  const { triggerReaction } = useMascot();
  const [displayScore, setDisplayScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const achievementsCheckedRef = useRef(false);

  const stars = useMemo(() => {
    if (accuracy >= 80) return 3;
    if (accuracy >= 50) return 2;
    return 1;
  }, [accuracy]);

  const minutes = Math.floor(timeSeconds / 60);
  const secs = timeSeconds % 60;
  const timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;

  const correctCount = Math.round((accuracy / 100) * (score / 10 || 1));
  const totalCount = Math.round(score / 10 || 1);

  // Check achievements & track daily activity when game results are shown
  useEffect(() => {
    if (!profile?.id || achievementsCheckedRef.current) return;
    achievementsCheckedRef.current = true;

    const checkAchievements = async () => {
      try {
        // Track game in daily activity
        await trackDailyActivity(profile.id, { gamesPlayed: 1 });

        // Check achievements with game-specific overrides
        const gameScore = accuracy / 100;
        const newlyUnlocked = await checkAfterAction({
          gameScores: { [gameType]: gameScore },
          gameTypesPlayed: new Set([gameType]),
        });

        for (const achievement of newlyUnlocked) {
          triggerReaction('achievement.unlocked', { name: achievement.name });
        }
      } catch (err) {
        console.error('Error checking achievements after game:', err);
      }
    };

    checkAchievements();
  }, [profile?.id, gameType, accuracy, checkAfterAction, triggerReaction]);

  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const step = Math.max(1, Math.floor(score / 30));
    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
        if (stars === 3) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } else {
        setDisplayScore(current);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [score, stars]);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.2}
        />
      )}

      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Trophy className="mx-auto mb-3 h-12 w-12 text-amber-400" />
        <h2 className="text-3xl font-bold text-foreground">
          {stars === 3 ? 'Perfect!' : stars === 2 ? 'Great Job!' : 'Game Complete!'}
        </h2>
      </motion.div>

      {/* Stars */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: i <= stars ? 1 : 0.6,
              rotate: 0,
              opacity: i <= stars ? 1 : 0.3,
            }}
            transition={{
              delay: 0.4 + i * 0.15,
              type: 'spring',
              stiffness: 300,
              damping: 15,
            }}
          >
            <Star
              className={`h-10 w-10 ${
                i <= stars
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-muted text-muted'
              }`}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Score */}
      <motion.div
        className="text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-sm text-muted-foreground mb-1">Score</p>
        <p className="text-5xl font-bold tabular-nums text-foreground">
          {displayScore.toLocaleString()}
        </p>
        {maxScore > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            of {maxScore.toLocaleString()}
          </p>
        )}
      </motion.div>

      {/* Accuracy Ring */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
      >
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={
              accuracy >= 80
                ? 'text-emerald-400'
                : accuracy >= 50
                ? 'text-amber-400'
                : 'text-red-400'
            }
            style={{ strokeDasharray: circumference }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {Math.round(accuracy)}%
          </span>
          <span className="text-xs text-muted-foreground">Accuracy</span>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        className="grid grid-cols-3 gap-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex flex-col items-center gap-1">
          <Target className="h-5 w-5 text-emerald-400" />
          <span className="text-lg font-semibold text-foreground">
            {Math.round((accuracy / 100) * totalCount)}
          </span>
          <span className="text-xs text-muted-foreground">Correct</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clock className="h-5 w-5 text-blue-400" />
          <span className="text-lg font-semibold text-foreground">
            {timeDisplay}
          </span>
          <span className="text-xs text-muted-foreground">Time</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <span className="text-lg font-semibold text-foreground">
            +{xpEarned}
          </span>
          <span className="text-xs text-muted-foreground">XP</span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push('/games')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Button>
        <Button
          size="lg"
          onClick={onPlayAgain}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Play Again
        </Button>
      </motion.div>
    </div>
  );
}
