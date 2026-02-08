export type MascotMood =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'celebrating'
  | 'thinking'
  | 'encouraging'
  | 'sad'
  | 'sleeping'
  | 'teaching';

export interface MascotReaction {
  mood: MascotMood;
  dialogues: string[];
  duration?: number; // ms to show before returning to idle
}

export interface MascotState {
  currentMood: MascotMood;
  currentDialogue: string | null;
  isVisible: boolean;
  isBubbleOpen: boolean;
}
