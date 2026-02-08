export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type ItemType = 'kanji' | 'vocabulary' | 'grammar';

export interface KanjiItem {
  id: string;
  character: string;
  jlptLevel: JLPTLevel;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  strokeCount: number;
  radical: string;
  mnemonic: string;
  exampleWords: string[];
  lessonGroup: string;
  sortOrder: number;
}

export interface VocabItem {
  id: string;
  word: string;
  reading: string;
  jlptLevel: JLPTLevel;
  meanings: string[];
  partOfSpeech: string;
  kanjiUsed: string[];
  mnemonic: string;
  exampleSentences: { japanese: string; reading: string; english: string }[];
  audioFile?: string;
  lessonGroup: string;
  sortOrder: number;
}

export interface GrammarItem {
  id: string;
  title: string;
  jlptLevel: JLPTLevel;
  meaning: string;
  structure: string;
  explanation: string;
  exampleSentences: {
    japanese: string;
    reading: string;
    english: string;
    breakdown: { word: string; meaning: string }[];
  }[];
  relatedGrammar: string[];
  lessonGroup: string;
  sortOrder: number;
}

export interface LessonGroup {
  id: string;
  title: string;
  description: string;
  jlptLevel: JLPTLevel;
  appLevel: number;
  items: {
    kanji: string[];
    vocabulary: string[];
    grammar: string[];
  };
  prerequisites: string[];
  order: number;
  estimatedMinutes: number;
}

export type CurriculumItem = KanjiItem | VocabItem | GrammarItem;
