import { create } from 'zustand';
import { GameType } from '@/types/game';

interface GameState {
  currentGame: GameType | null;
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  incorrectCount: number;
  startTime: number | null;
  isPlaying: boolean;

  startGame: (type: GameType) => void;
  endGame: () => void;
  addCorrect: (points?: number) => void;
  addIncorrect: () => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  score: 0,
  combo: 1,
  maxCombo: 1,
  correctCount: 0,
  incorrectCount: 0,
  startTime: null,
  isPlaying: false,

  startGame: (type: GameType) =>
    set({
      currentGame: type,
      score: 0,
      combo: 1,
      maxCombo: 1,
      correctCount: 0,
      incorrectCount: 0,
      startTime: Date.now(),
      isPlaying: true,
    }),

  endGame: () =>
    set({
      isPlaying: false,
    }),

  addCorrect: (points = 10) => {
    const { combo } = get();
    const earned = points * combo;
    set((state) => ({
      score: state.score + earned,
      correctCount: state.correctCount + 1,
    }));
  },

  addIncorrect: () =>
    set((state) => ({
      incorrectCount: state.incorrectCount + 1,
    })),

  incrementCombo: () =>
    set((state) => {
      const newCombo = Math.min(state.combo + 1, 5);
      return {
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
      };
    }),

  resetCombo: () =>
    set({
      combo: 1,
    }),

  resetGame: () =>
    set({
      currentGame: null,
      score: 0,
      combo: 1,
      maxCombo: 1,
      correctCount: 0,
      incorrectCount: 0,
      startTime: null,
      isPlaying: false,
    }),
}));
