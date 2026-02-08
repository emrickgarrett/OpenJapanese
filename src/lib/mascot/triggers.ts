import type { MascotReaction } from './types';

/**
 * MASCOT_TRIGGERS
 *
 * Each key maps to a MascotReaction containing the mascot's mood and an array
 * of dialogue variations. Template variables are written as {variableName} and
 * resolved at runtime by the personality helper `getRandomDialogue`.
 */
export const MASCOT_TRIGGERS: Record<string, MascotReaction> = {
  // ── Welcome ──────────────────────────────────────────────────────────────
  'app.open': {
    mood: 'happy',
    dialogues: [
      'Ohayo! Ready to learn some Japanese today?',
      'Welcome back! Yuki missed you~',
      'Konnichiwa! Let\'s make today sugoi!',
      'Hey hey! Let\'s study together!',
      'Yatta! You\'re here! Let\'s get started!',
      'Okaeri! Welcome back to OpenJapanese!',
      'Yuki\'s been waiting for you! Let\'s learn!',
    ],
    duration: 5000,
  },

  // ── Review: Correct ──────────────────────────────────────────────────────
  'review.correct': {
    mood: 'happy',
    dialogues: [
      'Sugoi! That\'s right!',
      'Kanpeki! Perfect answer!',
      'Nice one! You nailed it!',
      'Sou desu! Exactly right!',
      'Yatta! Keep it up!',
      'Ii ne! Looking good!',
      'Correct! Your memory is subarashii!',
      'That\'s the one! Sugoi na~',
    ],
    duration: 2500,
  },

  // ── Review: Incorrect ────────────────────────────────────────────────────
  'review.incorrect': {
    mood: 'encouraging',
    dialogues: [
      'Daijoubu! Everyone makes mistakes. Try again!',
      'Don\'t worry! That one is tricky~',
      'Ganbare! You\'ll get it next time!',
      'Hmm, not quite. But you\'re learning!',
      'It\'s okay! Mistakes help you remember!',
      'Gambatte ne! Practice makes perfect!',
      'Oops! But hey, now you\'ll remember it forever~',
    ],
    duration: 3000,
  },

  // ── Review: 5 Streak ─────────────────────────────────────────────────────
  'review.streak_5': {
    mood: 'excited',
    dialogues: [
      '5 in a row! You\'re on fire! Sugoi!',
      'Combo x5! Keep that streak going!',
      'Go go go! 5 correct! Ikuzo!',
      'Five-hit combo! Yuki is impressed!',
      'Sugoi sugoi! 5 streak! Don\'t stop now!',
    ],
    duration: 3000,
  },

  // ── Review: 10 Streak ────────────────────────────────────────────────────
  'review.streak_10': {
    mood: 'celebrating',
    dialogues: [
      '10 IN A ROW! You\'re UNSTOPPABLE!',
      'Juu-combo! That\'s legendary! Sugoi sugoi sugoi!',
      'TEN STREAK! Yuki is doing a happy dance!',
      'AMAZING! 10 correct! You\'re a tensai!',
      'Masaka! 10 in a row! You\'re incredible!',
    ],
    duration: 4000,
  },

  // ── Lesson: Start ────────────────────────────────────────────────────────
  'lesson.start': {
    mood: 'teaching',
    dialogues: [
      'Lesson time! Let\'s learn something new!',
      'Yosh! Sensei Yuki is ready to teach!',
      'New things to learn! How exciting!',
      'Pay attention~ Yuki will explain everything!',
      'Benkyou no jikan! Study time!',
    ],
    duration: 3500,
  },

  // ── Lesson: Complete ─────────────────────────────────────────────────────
  'lesson.complete': {
    mood: 'celebrating',
    dialogues: [
      'Yatta! You learned {count} new items! Sugoi!',
      'Lesson complete! {count} new things in your brain!',
      'Omedeto! {count} items learned! You\'re growing!',
      '{count} items done! Your Japanese is getting stronger!',
      'Subarashii! {count} new items mastered!',
    ],
    duration: 4000,
  },

  // ── Level Up ─────────────────────────────────────────────────────────────
  'level.up': {
    mood: 'celebrating',
    dialogues: [
      'LEVEL {level}! Omedetou gozaimasu! You did it!',
      'Level up to {level}! Yuki is SO proud of you!',
      'Sugoi! You reached level {level}! Party time!',
      'LEVEL {level}! That deserves a celebration!',
      'You leveled up to {level}! Sasuga!',
      'Level {level}! Your power is growing!',
    ],
    duration: 5000,
  },

  // ── Streak: New ──────────────────────────────────────────────────────────
  'streak.new': {
    mood: 'happy',
    dialogues: [
      'A new streak begins! Ganbare!',
      'Day 1! Every journey starts with a single step!',
      'Fresh start! Let\'s build a great streak!',
      'Ichi nichi me! Day one of your new streak!',
    ],
    duration: 3500,
  },

  // ── Streak: Milestone ────────────────────────────────────────────────────
  'streak.milestone': {
    mood: 'celebrating',
    dialogues: [
      '{count}-day streak! You\'re amazing!',
      'Sugoi! {count} days in a row! Yuki is so proud!',
      '{count} days! Your dedication is subarashii!',
      'Wow, {count} days! That\'s some serious commitment!',
      '{count}-day streak! You\'re a Japanese learning machine!',
    ],
    duration: 4500,
  },

  // ── Streak: Broken ───────────────────────────────────────────────────────
  'streak.broken': {
    mood: 'sad',
    dialogues: [
      'Your streak ended... but don\'t give up! Ganbare!',
      'Aww, the streak broke. But Yuki believes in you!',
      'It\'s okay... let\'s start a new streak together!',
      'Streaks come and go, but knowledge stays forever!',
      'Don\'t be sad! A fresh start can be exciting too!',
    ],
    duration: 4000,
  },

  // ── Item: Burned ─────────────────────────────────────────────────────────
  'item.burned': {
    mood: 'celebrating',
    dialogues: [
      '{item} is BURNED! It\'s yours forever now!',
      'Kansei! {item} has been mastered for life!',
      'You burned {item}! Eien ni! Forever!',
      '{item} is officially in your long-term memory! Sugoi!',
      'Burned! {item} will never escape your brain now!',
    ],
    duration: 4000,
  },

  // ── Achievement: Unlocked ────────────────────────────────────────────────
  'achievement.unlocked': {
    mood: 'celebrating',
    dialogues: [
      'Achievement unlocked: {name}! Omedetou!',
      'You earned "{name}"! Sugoi achievement!',
      'New badge: {name}! Yuki is so proud!',
      '"{name}" unlocked! You\'re collecting them all!',
      'Jajan! Achievement get: {name}!',
    ],
    duration: 4500,
  },

  // ── Game: Start ──────────────────────────────────────────────────────────
  'game.start': {
    mood: 'excited',
    dialogues: [
      'Game time! Let\'s have fun while learning!',
      'Yosh! Let\'s play! Ganbatte!',
      'A game! This is going to be tanoshii!',
      'Ready, set... GAME ON!',
      'Let\'s play! Show Yuki what you\'ve got!',
    ],
    duration: 3000,
  },

  // ── Game: Perfect Score ──────────────────────────────────────────────────
  'game.perfect': {
    mood: 'celebrating',
    dialogues: [
      'PERFECT SCORE! You\'re a tensai!',
      'Kanpeki! A flawless game! Subarashii!',
      'Not a single mistake! Sugoi sugoi sugoi!',
      'PERFECT! Yuki has never seen anything like it!',
      'Full marks! You\'re absolutely incredible!',
    ],
    duration: 4500,
  },

  // ── Game: Complete ───────────────────────────────────────────────────────
  'game.complete': {
    mood: 'happy',
    dialogues: [
      'Game complete! Otsukaresama!',
      'Good game! That was tanoshikatta!',
      'Nice play! Want to go again?',
      'Well done! Games make learning fun, ne?',
    ],
    duration: 3000,
  },

  // ── Idle: Long ───────────────────────────────────────────────────────────
  'idle.long': {
    mood: 'sleeping',
    dialogues: [
      'Zzz... *yawn* ...Oh! You\'re still here?',
      '*snore* ...mumbles about kanji...',
      'Zzz... neko... zzz... sakana...',
      'Fuwaaaa~ Yuki was napping...',
      'Zzz... *ear twitches* ...more kanji please...',
    ],
    duration: 4000,
  },

  // ── Dashboard: Empty ─────────────────────────────────────────────────────
  'dashboard.empty': {
    mood: 'happy',
    dialogues: [
      'You\'re all caught up! Sugoi! No reviews waiting!',
      'Zero reviews! You\'re on top of everything!',
      'All clear! Maybe play a game while you wait?',
      'No reviews right now! Yuki is impressed!',
      'Kanpeki! All done! Take a rest or do some lessons!',
    ],
    duration: 4000,
  },

  // ── Dashboard: Reviews Waiting ───────────────────────────────────────────
  'dashboard.reviews_waiting': {
    mood: 'teaching',
    dialogues: [
      'You have {count} reviews waiting! Let\'s go!',
      '{count} reviews are ready! Ganbatte!',
      'Psst! {count} items want to be reviewed~',
      '{count} reviews! Your items miss you!',
      'Time to review! {count} items are waiting!',
    ],
    duration: 3500,
  },

  // ── Night Greeting ───────────────────────────────────────────────────────
  'night.greeting': {
    mood: 'thinking',
    dialogues: [
      'Studying late? Yuki admires your dedication!',
      'Konbanwa~ Night study session, huh?',
      'It\'s late! Don\'t forget to sleep... after a few more reviews!',
      'Yoru no benkyou! Late night learning!',
      'A night owl like Yuki! Let\'s study quietly~',
    ],
    duration: 4000,
  },

  // ── Morning Greeting ─────────────────────────────────────────────────────
  'morning.greeting': {
    mood: 'happy',
    dialogues: [
      'Ohayo gozaimasu! Early bird gets the kanji!',
      'Good morning! Starting the day with Japanese? Sugoi!',
      'Ohayo! Fresh morning, fresh mind! Let\'s learn!',
      'Rise and shine! Yuki made you... well, reviews!',
      'Asa da! Morning study is the best study!',
    ],
    duration: 4000,
  },
};
