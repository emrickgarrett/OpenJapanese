'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Gamepad2, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/providers/ProfileProvider';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const FEATURES = [
  {
    icon: Brain,
    title: 'Smart SRS',
    description:
      'Spaced repetition that adapts to how you learn. See items at the perfect time for long-term memory.',
  },
  {
    icon: Gamepad2,
    title: 'Fun Mini-Games',
    description:
      'Learn through play with 6 different game types. From matching pairs to speed challenges.',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    description:
      'Watch your fluency grow over time with detailed stats, streaks, and achievement badges.',
  },
] as const;

export default function LandingPage() {
  const { profile, isLoading } = useProfile();
  const hasProfile = !isLoading && profile !== null;

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* ── Animated gradient background ─────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-[350px] w-[350px] rounded-full bg-amber-400/15 blur-[100px]" />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="flex w-full max-w-4xl flex-col items-center gap-8 px-6 pt-24 pb-16 text-center md:pt-36"
      >
        {/* Logo mark */}
        <motion.div variants={fadeUp} className="text-5xl">
          🦊
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
        >
          Learn Japanese{' '}
          <span className="bg-gradient-to-r from-primary via-pink-400 to-purple-500 bg-clip-text text-transparent">
            the Fun Way
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="max-w-xl text-lg text-muted-foreground md:text-xl"
        >
          Master kanji, vocabulary, and grammar with smart SRS, engaging
          mini-games, and beautiful progress tracking.
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 sm:flex-row">
          {hasProfile ? (
            <Button asChild size="lg" className="h-12 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25">
              <Link href="/dashboard">
                <Sparkles className="mr-2 h-5 w-5" />
                Continue Learning
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="h-12 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25">
              <Link href="/welcome">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Your Journey
              </Link>
            </Button>
          )}
        </motion.div>
      </motion.section>

      {/* ── Feature cards ────────────────────────────────────────── */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="grid w-full max-w-4xl gap-6 px-6 pb-16 sm:grid-cols-3"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </motion.section>

      {/* ── Footer badge ─────────────────────────────────────────── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pb-12"
      >
        <Badge
          variant="secondary"
          className="gap-1.5 px-4 py-1.5 text-sm font-medium"
        >
          <span className="font-japanese">JLPT</span>
          <span>N5 → N1</span>
        </Badge>
      </motion.footer>
    </div>
  );
}
