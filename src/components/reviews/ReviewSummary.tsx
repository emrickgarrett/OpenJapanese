'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import {
  Trophy,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Target,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SRS_STAGE_NAMES } from '@/lib/srs/constants';
import { useRouter } from 'next/navigation';

interface PromotionDemotion {
  itemId: string;
  itemDisplay: string;
  previousStage: number;
  newStage: number;
}

interface ReviewSummaryProps {
  stats: {
    total: number;
    correct: number;
    incorrect: number;
    xpEarned: number;
    promotions: PromotionDemotion[];
    demotions: PromotionDemotion[];
  };
}

export default function ReviewSummary({ stats }: ReviewSummaryProps) {
  const router = useRouter();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  const accuracy =
    stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    if (accuracy > 80) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [accuracy]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-8 px-4 py-8"
    >
      {/* Confetti */}
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#DD0093', '#882D9E', '#FAB819', '#449944', '#294DDB']}
        />
      )}

      {/* Trophy */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 10,
          delay: 0.2,
        }}
      >
        <Trophy className="size-20 text-amber-500" />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Review Complete!
        </h1>
        <p className="text-muted-foreground">
          {accuracy >= 90
            ? 'Outstanding work!'
            : accuracy >= 70
              ? 'Great job, keep it up!'
              : 'Every review helps you improve!'}
        </p>
      </motion.div>

      {/* XP earned */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="flex items-center gap-2 rounded-full bg-amber-100 px-6 py-3 dark:bg-amber-950/40"
      >
        <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
          +{stats.xpEarned} XP
        </span>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <Target className="mb-1 size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              {stats.total}
            </span>
            <span className="text-xs text-muted-foreground">Reviewed</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <CheckCircle2 className="mb-1 size-5 text-green-500" />
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.correct}
            </span>
            <span className="text-xs text-muted-foreground">Correct</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <XCircle className="mb-1 size-5 text-red-500" />
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.incorrect}
            </span>
            <span className="text-xs text-muted-foreground">Incorrect</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <Zap className="mb-1 size-5 text-amber-500" />
            <span className="text-2xl font-bold text-foreground">
              {accuracy}%
            </span>
            <span className="text-xs text-muted-foreground">Accuracy</span>
          </CardContent>
        </Card>
      </motion.div>

      {/* Promotions */}
      {stats.promotions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="w-full max-w-md"
        >
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="size-4 text-green-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
              Leveled Up
            </p>
          </div>
          <div className="space-y-1">
            {stats.promotions.map((promo, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/20"
              >
                <span className="font-japanese text-sm font-medium">
                  {promo.itemDisplay}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{SRS_STAGE_NAMES[promo.previousStage]}</span>
                  <ArrowRight className="size-3" />
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {SRS_STAGE_NAMES[promo.newStage]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Demotions */}
      {stats.demotions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="w-full max-w-md"
        >
          <div className="mb-2 flex items-center gap-2">
            <TrendingDown className="size-4 text-red-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Needs Practice
            </p>
          </div>
          <div className="space-y-1">
            {stats.demotions.map((demo, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950/20"
              >
                <span className="font-japanese text-sm font-medium">
                  {demo.itemDisplay}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{SRS_STAGE_NAMES[demo.previousStage]}</span>
                  <ArrowRight className="size-3" />
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {SRS_STAGE_NAMES[demo.newStage]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Back to dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        <Button
          size="lg"
          onClick={() => router.push('/')}
          className="gap-2 px-8 text-lg"
        >
          Back to Dashboard
          <ArrowRight className="size-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
