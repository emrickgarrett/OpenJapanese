'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { MascotMood } from '@/lib/mascot/types';

// ── Size presets ──────────────────────────────────────────────────────────
const SIZE_MAP = {
  sm: 48,
  md: 96,
  lg: 160,
} as const;

interface MascotProps {
  mood: MascotMood;
  size?: 'sm' | 'md' | 'lg';
}

// ── Bounce animation per mood ─────────────────────────────────────────────
function getMoodAnimation(mood: MascotMood) {
  switch (mood) {
    case 'celebrating':
      return {
        animate: { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] },
        transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 },
      };
    case 'excited':
      return {
        animate: { scale: [1, 1.08, 1], y: [0, -4, 0] },
        transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 },
      };
    case 'happy':
      return {
        animate: { scale: [1, 1.04, 1] },
        transition: { duration: 0.8, repeat: Infinity, repeatDelay: 1 },
      };
    case 'sad':
      return {
        animate: { y: [0, 2, 0] },
        transition: { duration: 1.5, repeat: Infinity },
      };
    case 'sleeping':
      return {
        animate: { scale: [1, 1.02, 1], rotate: [0, 1, 0, -1, 0] },
        transition: { duration: 3, repeat: Infinity },
      };
    case 'thinking':
      return {
        animate: { rotate: [0, 2, 0] },
        transition: { duration: 2, repeat: Infinity },
      };
    default:
      return {
        animate: { scale: 1 },
        transition: { duration: 0.3 },
      };
  }
}

// ── SVG sub-components for each mood expression ───────────────────────────

/** Fox ears - pointed triangles with inner pink. Droopy when sad, perky when excited. */
function Ears({ mood }: { mood: MascotMood }) {
  const isDroopy = mood === 'sad';
  const isPerky = mood === 'excited' || mood === 'celebrating' || mood === 'happy';
  const isTeaching = mood === 'teaching';

  // Left ear rotation
  const leftRotation = isDroopy ? 15 : isPerky ? -5 : isTeaching ? -3 : 0;
  // Right ear rotation
  const rightRotation = isDroopy ? -15 : isPerky ? 5 : isTeaching ? 8 : 0;

  return (
    <g>
      {/* Left ear */}
      <g transform={`rotate(${leftRotation}, 35, 32)`}>
        {/* Outer ear */}
        <path
          d="M20,38 L30,8 L44,34 Z"
          fill="#F5A623"
          stroke="#E8941E"
          strokeWidth="1"
        />
        {/* Inner ear */}
        <path d="M27,35 L32,15 L40,33 Z" fill="#FFD4D4" />
      </g>
      {/* Right ear */}
      <g transform={`rotate(${rightRotation}, 65, 32)`}>
        {/* Outer ear */}
        <path
          d="M56,34 L70,8 L80,38 Z"
          fill="#F5A623"
          stroke="#E8941E"
          strokeWidth="1"
        />
        {/* Inner ear */}
        <path d="M60,33 L68,15 L73,35 Z" fill="#FFD4D4" />
      </g>
    </g>
  );
}

/** Eyes change significantly by mood */
function Eyes({ mood }: { mood: MascotMood }) {
  switch (mood) {
    // ── Celebrating: closed happy eyes (upside-down U) ─────────────
    case 'celebrating':
      return (
        <g>
          <path
            d="M32,52 Q36,46 40,52"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M60,52 Q64,46 68,52"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );

    // ── Sleeping: closed flat lines with Zzz ───────────────────────
    case 'sleeping':
      return (
        <g>
          <line
            x1="32"
            y1="52"
            x2="42"
            y2="52"
            stroke="#3D2B1F"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="58"
            y1="52"
            x2="68"
            y2="52"
            stroke="#3D2B1F"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Zzz */}
          <text
            x="76"
            y="40"
            fontSize="8"
            fontWeight="bold"
            fill="#9B8EC4"
            opacity="0.8"
          >
            Z
          </text>
          <text
            x="82"
            y="33"
            fontSize="6"
            fontWeight="bold"
            fill="#9B8EC4"
            opacity="0.6"
          >
            z
          </text>
          <text
            x="86"
            y="28"
            fontSize="4.5"
            fontWeight="bold"
            fill="#9B8EC4"
            opacity="0.4"
          >
            z
          </text>
        </g>
      );

    // ── Sad: big droopy eyes ───────────────────────────────────────
    case 'sad':
      return (
        <g>
          {/* Left eye */}
          <ellipse cx="37" cy="53" rx="5" ry="5.5" fill="white" />
          <ellipse cx="37" cy="54" rx="3" ry="3.5" fill="#3D2B1F" />
          <ellipse cx="36" cy="53" rx="1" ry="1" fill="white" />
          {/* Droopy eyebrow */}
          <path
            d="M30,47 Q37,44 44,48"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Right eye */}
          <ellipse cx="63" cy="53" rx="5" ry="5.5" fill="white" />
          <ellipse cx="63" cy="54" rx="3" ry="3.5" fill="#3D2B1F" />
          <ellipse cx="62" cy="53" rx="1" ry="1" fill="white" />
          {/* Droopy eyebrow */}
          <path
            d="M56,48 Q63,44 70,47"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      );

    // ── Excited: star/sparkle eyes ─────────────────────────────────
    case 'excited':
      return (
        <g>
          {/* Left star eye */}
          <polygon
            points="37,48 38.5,51 42,52 39,54 39.5,57.5 37,55.5 34.5,57.5 35,54 32,52 35.5,51"
            fill="#FFD700"
            stroke="#E8C100"
            strokeWidth="0.5"
          />
          {/* Right star eye */}
          <polygon
            points="63,48 64.5,51 68,52 65,54 65.5,57.5 63,55.5 60.5,57.5 61,54 58,52 61.5,51"
            fill="#FFD700"
            stroke="#E8C100"
            strokeWidth="0.5"
          />
        </g>
      );

    // ── Thinking: one squinted, one normal ─────────────────────────
    case 'thinking':
      return (
        <g>
          {/* Left eye - slightly squinted */}
          <ellipse cx="37" cy="52" rx="4.5" ry="3.5" fill="white" />
          <ellipse cx="38" cy="52" rx="2.5" ry="2.5" fill="#3D2B1F" />
          <ellipse cx="37.5" cy="51" rx="0.8" ry="0.8" fill="white" />
          {/* Raised eyebrow */}
          <path
            d="M30,46 Q37,43 44,46"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Right eye - normal */}
          <ellipse cx="63" cy="52" rx="5" ry="5" fill="white" />
          <ellipse cx="64" cy="52" rx="3" ry="3" fill="#3D2B1F" />
          <ellipse cx="63" cy="51" rx="1" ry="1" fill="white" />
        </g>
      );

    // ── Teaching: focused, one ear up look ─────────────────────────
    case 'teaching':
      return (
        <g>
          {/* Left eye */}
          <ellipse cx="37" cy="52" rx="5" ry="5" fill="white" />
          <ellipse cx="38" cy="52" rx="3" ry="3" fill="#3D2B1F" />
          <ellipse cx="37" cy="51" rx="1" ry="1" fill="white" />
          {/* Right eye - slight wink */}
          <ellipse cx="63" cy="52" rx="5" ry="4" fill="white" />
          <ellipse cx="64" cy="52" rx="3" ry="2.8" fill="#3D2B1F" />
          <ellipse cx="63" cy="51" rx="1" ry="1" fill="white" />
          {/* Glasses hint (small line under eyes) */}
          <path
            d="M31,52 Q34,57 42,52"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="0.6"
            opacity="0.3"
          />
          <path
            d="M58,52 Q61,56 69,52"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="0.6"
            opacity="0.3"
          />
        </g>
      );

    // ── Happy: big sparkly eyes ────────────────────────────────────
    case 'happy':
      return (
        <g>
          {/* Left eye */}
          <ellipse cx="37" cy="52" rx="5.5" ry="5.5" fill="white" />
          <ellipse cx="38" cy="52" rx="3.5" ry="3.5" fill="#3D2B1F" />
          <ellipse cx="36.5" cy="50.5" rx="1.5" ry="1.5" fill="white" />
          <ellipse cx="39" cy="53" rx="0.7" ry="0.7" fill="white" />
          {/* Right eye */}
          <ellipse cx="63" cy="52" rx="5.5" ry="5.5" fill="white" />
          <ellipse cx="64" cy="52" rx="3.5" ry="3.5" fill="#3D2B1F" />
          <ellipse cx="62.5" cy="50.5" rx="1.5" ry="1.5" fill="white" />
          <ellipse cx="65" cy="53" rx="0.7" ry="0.7" fill="white" />
        </g>
      );

    // ── Encouraging: soft gentle eyes ──────────────────────────────
    case 'encouraging':
      return (
        <g>
          {/* Left eye - soft, slightly tilted */}
          <ellipse cx="37" cy="52" rx="5" ry="5" fill="white" />
          <ellipse cx="37.5" cy="52" rx="3" ry="3" fill="#3D2B1F" />
          <ellipse cx="36.5" cy="51" rx="1.2" ry="1.2" fill="white" />
          {/* Gentle eyebrow */}
          <path
            d="M31,46 Q37,44 43,46"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Right eye */}
          <ellipse cx="63" cy="52" rx="5" ry="5" fill="white" />
          <ellipse cx="63.5" cy="52" rx="3" ry="3" fill="#3D2B1F" />
          <ellipse cx="62.5" cy="51" rx="1.2" ry="1.2" fill="white" />
          {/* Gentle eyebrow */}
          <path
            d="M57,46 Q63,44 69,46"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      );

    // ── Idle: relaxed, neutral ─────────────────────────────────────
    default:
      return (
        <g>
          {/* Left eye */}
          <ellipse cx="37" cy="52" rx="5" ry="5" fill="white" />
          <ellipse cx="37.5" cy="52" rx="3" ry="3" fill="#3D2B1F" />
          <ellipse cx="36.5" cy="51" rx="1" ry="1" fill="white" />
          {/* Right eye */}
          <ellipse cx="63" cy="52" rx="5" ry="5" fill="white" />
          <ellipse cx="63.5" cy="52" rx="3" ry="3" fill="#3D2B1F" />
          <ellipse cx="62.5" cy="51" rx="1" ry="1" fill="white" />
        </g>
      );
  }
}

/** Mouth / nose region changes with mood */
function Mouth({ mood }: { mood: MascotMood }) {
  // Small triangle nose (shared across all moods)
  const nose = (
    <ellipse cx="50" cy="58" rx="2" ry="1.5" fill="#3D2B1F" />
  );

  switch (mood) {
    case 'celebrating':
    case 'excited':
      return (
        <g>
          {nose}
          {/* Big open smile */}
          <path
            d="M42,63 Q50,72 58,63"
            fill="#FF8888"
            stroke="#3D2B1F"
            strokeWidth="1.5"
          />
          {/* Tongue */}
          <ellipse cx="50" cy="66" rx="3" ry="2" fill="#FF6B6B" />
        </g>
      );

    case 'happy':
      return (
        <g>
          {nose}
          {/* Curved smile */}
          <path
            d="M43,63 Q50,69 57,63"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      );

    case 'encouraging':
      return (
        <g>
          {nose}
          {/* Gentle smile */}
          <path
            d="M44,63 Q50,67 56,63"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      );

    case 'teaching':
      return (
        <g>
          {nose}
          {/* Slight open mouth (explaining) */}
          <path
            d="M44,63 Q50,67 56,63"
            fill="#FF8888"
            stroke="#3D2B1F"
            strokeWidth="1.2"
          />
        </g>
      );

    case 'thinking':
      return (
        <g>
          {nose}
          {/* Small "o" shape */}
          <ellipse
            cx="50"
            cy="64"
            rx="2.5"
            ry="2"
            fill="#FF8888"
            stroke="#3D2B1F"
            strokeWidth="1.2"
          />
        </g>
      );

    case 'sad':
      return (
        <g>
          {nose}
          {/* Frown */}
          <path
            d="M44,66 Q50,62 56,66"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      );

    case 'sleeping':
      return (
        <g>
          {nose}
          {/* Tiny peaceful mouth */}
          <path
            d="M47,63 Q50,65 53,63"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      );

    // idle
    default:
      return (
        <g>
          {nose}
          {/* Neutral smile */}
          <path
            d="M45,63 Q50,66 55,63"
            fill="none"
            stroke="#3D2B1F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      );
  }
}

/** Blush marks on cheeks */
function Blush({ mood }: { mood: MascotMood }) {
  const visible =
    mood === 'happy' ||
    mood === 'excited' ||
    mood === 'celebrating' ||
    mood === 'encouraging';

  if (!visible) return null;

  return (
    <g opacity="0.4">
      <ellipse cx="28" cy="58" rx="4" ry="2.5" fill="#FF9999" />
      <ellipse cx="72" cy="58" rx="4" ry="2.5" fill="#FF9999" />
    </g>
  );
}

/** Sparkles around the mascot for celebrating mood */
function Sparkles({ mood }: { mood: MascotMood }) {
  if (mood !== 'celebrating' && mood !== 'excited') return null;

  return (
    <g>
      {/* Top sparkles */}
      <polygon
        points="15,15 16.5,19 20,20 16.5,21 15,25 13.5,21 10,20 13.5,19"
        fill="#FFD700"
        opacity="0.8"
      />
      <polygon
        points="85,12 86,15 89,16 86,17 85,20 84,17 81,16 84,15"
        fill="#FFD700"
        opacity="0.7"
      />
      <polygon
        points="8,45 9,47.5 12,48 9,49 8,51.5 7,49 4,48 7,47.5"
        fill="#FF69B4"
        opacity="0.6"
      />
      <polygon
        points="92,42 93,44 95.5,45 93,46 92,48 91,46 88.5,45 91,44"
        fill="#87CEEB"
        opacity="0.6"
      />
    </g>
  );
}

/** Tail - fluffy fox tail behind the body */
function Tail({ mood }: { mood: MascotMood }) {
  const wagRotation =
    mood === 'happy' || mood === 'excited' || mood === 'celebrating' ? 5 : 0;

  return (
    <g transform={`rotate(${wagRotation}, 72, 85)`}>
      {/* Main tail shape */}
      <path
        d="M68,82 Q88,70 90,55 Q92,48 86,52 Q78,60 72,75 Z"
        fill="#F5A623"
        stroke="#E8941E"
        strokeWidth="0.8"
      />
      {/* White tail tip */}
      <path
        d="M86,55 Q90,49 86,52 Q82,56 84,58 Z"
        fill="white"
        opacity="0.9"
      />
    </g>
  );
}

/** Teaching pointer gesture (only in teaching mood) */
function TeachingGesture({ mood }: { mood: MascotMood }) {
  if (mood !== 'teaching') return null;

  return (
    <g>
      {/* Small raised paw/hand */}
      <circle cx="22" cy="72" r="3.5" fill="#F5A623" stroke="#E8941E" strokeWidth="0.5" />
      {/* Tiny pointer stick */}
      <line
        x1="19"
        y1="69"
        x2="12"
        y2="60"
        stroke="#8B4513"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Thinking hand on chin (only in thinking mood) */
function ThinkingGesture({ mood }: { mood: MascotMood }) {
  if (mood !== 'thinking') return null;

  return (
    <g>
      {/* Small paw near chin */}
      <circle cx="38" cy="68" r="3" fill="#F5A623" stroke="#E8941E" strokeWidth="0.5" />
    </g>
  );
}

// ── Main Mascot Component ─────────────────────────────────────────────────

export function Mascot({ mood, size = 'md' }: MascotProps) {
  const px = SIZE_MAP[size];
  const { animate, transition } = getMoodAnimation(mood);

  return (
    <motion.div
      style={{ width: px, height: px }}
      animate={animate}
      transition={transition}
      initial={{ scale: 0 }}
      whileHover={{ scale: 1.08 }}
      // Entrance animation
      {...(mood !== 'idle' ? {} : {})}
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <svg
          viewBox="0 0 100 100"
          width={px}
          height={px}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={`Yuki the fox mascot - ${mood}`}
        >
          {/* Sparkle effects (celebrating/excited only) */}
          <Sparkles mood={mood} />

          {/* Tail behind body */}
          <Tail mood={mood} />

          {/* Body - simple rounded shape suggesting a small outfit */}
          <ellipse cx="50" cy="85" rx="20" ry="12" fill="#F5A623" />
          {/* White belly/shirt area */}
          <ellipse cx="50" cy="85" rx="14" ry="9" fill="white" opacity="0.85" />
          {/* Tiny scarf/bandana accent */}
          <path
            d="M36,78 Q50,82 64,78"
            fill="none"
            stroke="#FF6B6B"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Head - round fox face */}
          <circle cx="50" cy="52" r="22" fill="#F5A623" />

          {/* White face mask (fox pattern) */}
          <path
            d="M34,48 Q50,38 66,48 Q66,62 50,68 Q34,62 34,48 Z"
            fill="white"
            opacity="0.9"
          />

          {/* Ears */}
          <Ears mood={mood} />

          {/* Eyes */}
          <Eyes mood={mood} />

          {/* Blush */}
          <Blush mood={mood} />

          {/* Mouth & nose */}
          <Mouth mood={mood} />

          {/* Whiskers */}
          <g opacity="0.3" stroke="#3D2B1F" strokeWidth="0.8" strokeLinecap="round">
            <line x1="24" y1="57" x2="33" y2="59" />
            <line x1="23" y1="61" x2="33" y2="62" />
            <line x1="67" y1="59" x2="76" y2="57" />
            <line x1="67" y1="62" x2="77" y2="61" />
          </g>

          {/* Special gestures */}
          <TeachingGesture mood={mood} />
          <ThinkingGesture mood={mood} />
        </svg>
      </motion.div>
    </motion.div>
  );
}
