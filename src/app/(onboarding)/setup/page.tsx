'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/providers/ProfileProvider';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────────────────

const AVATAR_OPTIONS = [
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🐱', label: 'Cat' },
  { emoji: '🐶', label: 'Dog' },
  { emoji: '🐼', label: 'Panda' },
  { emoji: '🐰', label: 'Rabbit' },
  { emoji: '🐸', label: 'Frog' },
  { emoji: '🌸', label: 'Sakura' },
  { emoji: '🎌', label: 'Flag' },
  { emoji: '⛩️', label: 'Torii' },
  { emoji: '🗾', label: 'Japan' },
  { emoji: '🎎', label: 'Dolls' },
  { emoji: '🎋', label: 'Tanabata' },
];

const LEVEL_OPTIONS = [
  {
    id: 'beginner',
    title: 'Complete Beginner',
    description: "I don't know any Japanese yet",
    jlptLevel: 'N5',
    icon: '🌱',
  },
  {
    id: 'basics',
    title: 'Know the Basics',
    description: 'I know hiragana/katakana and some words',
    jlptLevel: 'N5',
    icon: '📖',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'I can read basic sentences',
    jlptLevel: 'N4',
    icon: '📝',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: "I'm studying for N2/N1",
    jlptLevel: 'N2',
    icon: '🏯',
  },
];

const YUKI_MESSAGES = [
  'What should I call you?',
  'Choose your look!',
  'Where should we start?',
];

const TOTAL_STEPS = 3;

// ─── Animation Variants ─────────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Username Validation ────────────────────────────────────────────────────

function validateUsername(value: string): string | null {
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 20) return 'Username must be at most 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(value))
    return 'Only letters, numbers, and underscores allowed';
  return null;
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const { createProfile } = useProfile();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1: Name
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Step 2: Avatar
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // Step 3: Level
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Step Navigation ────────────────────────────────────────────────────

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return username.length >= 3 && validateUsername(username) === null;
      case 1:
        return selectedAvatar !== null;
      case 2:
        return selectedLevel !== null;
      default:
        return false;
    }
  }

  function goNext() {
    if (!canProceed()) return;

    if (step === 0) {
      const error = validateUsername(username);
      if (error) {
        setUsernameError(error);
        return;
      }
    }

    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  // ─── Form Submission ────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedAvatar || !selectedLevel) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createProfile({
        username: username.trim(),
        avatarUrl: selectedAvatar,
        displayName: displayName.trim() || undefined,
      });

      // TODO: Also set JLPT level from selectedLevel using updateProfile
      router.push('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      if (message.toLowerCase().includes('unique') || message.toLowerCase().includes('duplicate')) {
        setSubmitError('That username is already taken. Please choose another.');
        setDirection(-1);
        setStep(0);
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-3">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    i < step
                      ? 'bg-pink-500 text-white'
                      : i === step
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25'
                        : 'bg-pink-100 text-pink-400'
                  )}
                  animate={i === step ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </motion.div>
                {i < TOTAL_STEPS - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-12 rounded-full transition-colors',
                      i < step ? 'bg-pink-500' : 'bg-pink-100'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Yuki speech bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex items-start gap-3"
        >
          <div className="flex-shrink-0">
            <MiniYuki />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative rounded-2xl border border-pink-200/60 bg-white/90 px-5 py-3 shadow-sm backdrop-blur-sm"
            >
              <div className="absolute -left-2 top-3 h-3 w-3 rotate-45 border-b border-l border-pink-200/60 bg-white/90" />
              <p className="text-sm font-medium text-foreground">
                {YUKI_MESSAGES[step]}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Step content */}
        <div className="relative min-h-[340px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full"
            >
              {step === 0 && (
                <StepName
                  username={username}
                  displayName={displayName}
                  error={usernameError}
                  onUsernameChange={(val) => {
                    setUsername(val);
                    setUsernameError(null);
                    setSubmitError(null);
                  }}
                  onDisplayNameChange={setDisplayName}
                />
              )}
              {step === 1 && (
                <StepAvatar
                  selected={selectedAvatar}
                  onSelect={setSelectedAvatar}
                />
              )}
              {step === 2 && (
                <StepLevel
                  selected={selectedLevel}
                  onSelect={setSelectedLevel}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error display */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex items-center justify-between"
        >
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step === 0 || isSubmitting}
            className="gap-2 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <Button
            onClick={goNext}
            disabled={!canProceed() || isSubmitting}
            className="gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-8 text-white shadow-lg shadow-pink-500/25 transition-all hover:from-pink-600 hover:to-purple-600 hover:shadow-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating profile...
              </>
            ) : step === TOTAL_STEPS - 1 ? (
              <>
                Finish Setup
                <Check className="size-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Step 1: Name ───────────────────────────────────────────────────────────

function StepName({
  username,
  displayName,
  error,
  onUsernameChange,
  onDisplayNameChange,
}: {
  username: string;
  displayName: string;
  error: string | null;
  onUsernameChange: (val: string) => void;
  onDisplayNameChange: (val: string) => void;
}) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="text-sm font-medium text-foreground"
        >
          Username <span className="text-pink-500">*</span>
        </label>
        <Input
          id="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="e.g. sakura_fan"
          maxLength={20}
          className={cn(
            'h-12 rounded-xl border-pink-200 bg-white/80 text-base backdrop-blur-sm focus-visible:border-pink-400 focus-visible:ring-pink-400/30',
            error && 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/30'
          )}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
        <p className="text-xs text-muted-foreground">
          3-20 characters. Letters, numbers, and underscores only.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="displayName"
          className="text-sm font-medium text-foreground"
        >
          Display Name{' '}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="e.g. Sakura"
          maxLength={30}
          className="h-12 rounded-xl border-pink-200 bg-white/80 text-base backdrop-blur-sm focus-visible:border-pink-400 focus-visible:ring-pink-400/30"
        />
        <p className="text-xs text-muted-foreground">
          How Yuki will greet you. Defaults to your username.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Avatar ─────────────────────────────────────────────────────────

function StepAvatar({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (emoji: string) => void;
}) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {AVATAR_OPTIONS.map((avatar) => (
          <motion.button
            key={avatar.emoji}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(avatar.emoji)}
            className={cn(
              'flex h-16 w-full items-center justify-center rounded-2xl border-2 text-3xl transition-all',
              selected === avatar.emoji
                ? 'border-pink-500 bg-pink-50 shadow-lg shadow-pink-500/20'
                : 'border-pink-100 bg-white/80 hover:border-pink-300 hover:bg-pink-50/50'
            )}
            aria-label={avatar.label}
          >
            {avatar.emoji}
          </motion.button>
        ))}
      </div>
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 flex flex-col items-center gap-2"
        >
          <span className="text-6xl">{selected}</span>
          <p className="text-sm text-muted-foreground">Looking great!</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Step 3: Level ──────────────────────────────────────────────────────────

function StepLevel({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
      {LEVEL_OPTIONS.map((level) => (
        <motion.button
          key={level.id}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(level.id)}
          className={cn(
            'flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all',
            selected === level.id
              ? 'border-pink-500 bg-pink-50 shadow-lg shadow-pink-500/15'
              : 'border-pink-100 bg-white/80 hover:border-pink-300 hover:bg-pink-50/50'
          )}
        >
          <span className="mt-0.5 text-2xl" role="img" aria-hidden="true">
            {level.icon}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{level.title}</p>
              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-600">
                {level.jlptLevel}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {level.description}
            </p>
          </div>
          {selected === level.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-pink-500 text-white"
            >
              <Check className="size-3.5" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─── Mini Yuki SVG ──────────────────────────────────────────────────────────

function MiniYuki() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Yuki"
      role="img"
    >
      <path d="M50 90 L30 30 L80 70 Z" fill="#FF9F6B" />
      <path d="M50 85 L38 42 L72 72 Z" fill="#FFD6B8" />
      <path d="M150 90 L170 30 L120 70 Z" fill="#FF9F6B" />
      <path d="M150 85 L162 42 L128 72 Z" fill="#FFD6B8" />
      <circle cx="100" cy="110" r="65" fill="#FF9F6B" />
      <ellipse cx="100" cy="120" rx="45" ry="40" fill="#FFD6B8" />
      <ellipse cx="78" cy="100" rx="8" ry="10" fill="#2D1B0E" />
      <ellipse cx="75" cy="97" rx="3" ry="4" fill="white" />
      <ellipse cx="122" cy="100" rx="8" ry="10" fill="#2D1B0E" />
      <ellipse cx="119" cy="97" rx="3" ry="4" fill="white" />
      <ellipse cx="100" cy="115" rx="5" ry="4" fill="#2D1B0E" />
      <path
        d="M92 122 Q100 130 108 122"
        stroke="#2D1B0E"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="68" cy="118" rx="8" ry="5" fill="#FFB0B0" opacity="0.6" />
      <ellipse cx="132" cy="118" rx="8" ry="5" fill="#FFB0B0" opacity="0.6" />
    </svg>
  );
}
