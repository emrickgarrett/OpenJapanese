'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const speechBubbles = [
  {
    text: "I'll remember what you know with smart spaced repetition",
    icon: '🧠',
  },
  {
    text: "We'll play games together to make learning fun",
    icon: '🎮',
  },
  {
    text: "I'll celebrate every milestone with you!",
    icon: '🎉',
  },
];

export default function WelcomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-100 via-pink-50 to-purple-100" />

      {/* Decorative floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[10%] top-[15%] h-64 w-64 rounded-full bg-pink-200/30 blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[10%] h-80 w-80 rounded-full bg-purple-200/30 blur-3xl"
          animate={{ y: [0, 15, 0], x: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-[50%] top-[60%] h-48 w-48 rounded-full bg-pink-300/20 blur-3xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="relative z-10 flex max-w-2xl flex-col items-center gap-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Mascot SVG */}
        <motion.div variants={fadeUp}>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <YukiMascot />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div variants={fadeUp} className="text-center">
          <h1 className="font-japanese text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
              こんにちは! I&apos;m Yuki!
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="max-w-md text-center text-lg text-muted-foreground sm:text-xl"
        >
          Your Japanese study companion. I&apos;ll help you go from zero to JLPT
          fluent!
        </motion.p>

        {/* Speech bubble cards */}
        <motion.div
          variants={fadeUp}
          className="flex w-full flex-col gap-4 sm:gap-5"
        >
          {speechBubbles.map((bubble, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative rounded-2xl border border-pink-200/60 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
            >
              {/* Speech bubble tail */}
              <div className="absolute -left-2 top-4 h-4 w-4 rotate-45 border-b border-l border-pink-200/60 bg-white/80" />
              <div className="flex items-center gap-4">
                <span className="text-2xl" role="img" aria-hidden="true">
                  {bubble.icon}
                </span>
                <p className="text-sm font-medium text-foreground sm:text-base">
                  {bubble.text}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={fadeUp} className="pt-4">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-10 text-lg font-semibold text-white shadow-lg shadow-pink-500/25 transition-all hover:from-pink-600 hover:to-purple-600 hover:shadow-xl hover:shadow-pink-500/30"
          >
            <Link href="/setup">
              <Sparkles className="mr-2 size-5" />
              Let&apos;s Get Started!
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Inline kawaii fox face SVG mascot */
function YukiMascot() {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Yuki the fox mascot"
      role="img"
    >
      {/* Left ear */}
      <path
        d="M50 90 L30 30 L80 70 Z"
        fill="#FF9F6B"
        stroke="#E8854A"
        strokeWidth="2"
      />
      <path d="M50 85 L38 42 L72 72 Z" fill="#FFD6B8" />

      {/* Right ear */}
      <path
        d="M150 90 L170 30 L120 70 Z"
        fill="#FF9F6B"
        stroke="#E8854A"
        strokeWidth="2"
      />
      <path d="M150 85 L162 42 L128 72 Z" fill="#FFD6B8" />

      {/* Face - round */}
      <circle cx="100" cy="110" r="65" fill="#FF9F6B" stroke="#E8854A" strokeWidth="2" />

      {/* Inner face (lighter) */}
      <ellipse cx="100" cy="120" rx="45" ry="40" fill="#FFD6B8" />

      {/* Left eye */}
      <ellipse cx="78" cy="100" rx="8" ry="10" fill="#2D1B0E" />
      <ellipse cx="75" cy="97" rx="3" ry="4" fill="white" />

      {/* Right eye */}
      <ellipse cx="122" cy="100" rx="8" ry="10" fill="#2D1B0E" />
      <ellipse cx="119" cy="97" rx="3" ry="4" fill="white" />

      {/* Nose */}
      <ellipse cx="100" cy="115" rx="5" ry="4" fill="#2D1B0E" />

      {/* Mouth - small smile */}
      <path
        d="M92 122 Q100 130 108 122"
        stroke="#2D1B0E"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Blush left */}
      <ellipse cx="68" cy="118" rx="8" ry="5" fill="#FFB0B0" opacity="0.6" />

      {/* Blush right */}
      <ellipse cx="132" cy="118" rx="8" ry="5" fill="#FFB0B0" opacity="0.6" />
    </svg>
  );
}
