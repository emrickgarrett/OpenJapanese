'use client';

import { motion } from 'framer-motion';
import { Loader2, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReviewSession from '@/components/reviews/ReviewSession';
import { useReviews } from '@/hooks/useReviews';
import { useAchievements } from '@/hooks/useAchievements';
import { useMascot } from '@/hooks/useMascot';
import { useProfile } from '@/providers/ProfileProvider';

export default function ReviewsPage() {
  const { profile, refreshProfile } = useProfile();
  const { dueItems, isLoading, submitReview, refreshReviews } = useReviews(
    profile?.id
  );
  const { checkAfterAction } = useAchievements(profile?.id);
  const { triggerReaction } = useMascot();

  const handleComplete = async () => {
    await refreshProfile();
    await refreshReviews();

    // Check achievements after review session
    try {
      const newlyUnlocked = await checkAfterAction();
      for (const achievement of newlyUnlocked) {
        triggerReaction('achievement.unlocked', { name: achievement.name });
      }
    } catch (err) {
      console.error('Error checking achievements after reviews:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  // Empty state - no reviews due
  if (dueItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4"
      >
        {/* Yuki mascot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
          className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 text-6xl"
        >
          🦊
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            All caught up!
          </h1>
          <p className="max-w-sm text-muted-foreground">
            Yuki says great job! You have no reviews due right now. Come back later
            or learn some new lessons!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-3"
        >
          <Button
            variant="outline"
            onClick={refreshReviews}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Check Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/lessons')}
            className="gap-2"
          >
            <Inbox className="size-4" />
            Go to Lessons
          </Button>
        </motion.div>

        {/* Fun stats */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-muted-foreground/60"
        >
          Reviews refresh as your SRS intervals come due
        </motion.p>
      </motion.div>
    );
  }

  // Review session
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-3xl"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Review Session
        </h1>
        <p className="text-sm text-muted-foreground">
          {dueItems.length} item{dueItems.length !== 1 ? 's' : ''} to review
        </p>
      </div>

      <ReviewSession
        items={dueItems}
        onSubmitReview={submitReview}
        onComplete={handleComplete}
      />
    </motion.div>
  );
}
