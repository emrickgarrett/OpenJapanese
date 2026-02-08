import {
  JLPTLevel,
  KanjiItem,
  VocabItem,
  GrammarItem,
  LessonGroup,
  CurriculumItem,
} from '@/types/curriculum';

/**
 * In-memory cache to avoid re-fetching curriculum JSON files.
 */
const cache = new Map<string, unknown>();

/**
 * Fetches JSON data from the /data/ directory with caching.
 */
async function fetchWithCache<T>(path: string): Promise<T> {
  if (cache.has(path)) {
    return cache.get(path) as T;
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load curriculum data from ${path}: ${response.statusText}`);
  }

  const data = (await response.json()) as T;
  cache.set(path, data);
  return data;
}

/**
 * Loads all kanji items for a given JLPT level.
 */
export async function loadKanji(level: JLPTLevel): Promise<KanjiItem[]> {
  return fetchWithCache<KanjiItem[]>(`/data/kanji/${level.toLowerCase()}.json`);
}

/**
 * Loads all vocabulary items for a given JLPT level.
 */
export async function loadVocabulary(level: JLPTLevel): Promise<VocabItem[]> {
  return fetchWithCache<VocabItem[]>(`/data/vocabulary/${level.toLowerCase()}.json`);
}

/**
 * Loads all grammar items for a given JLPT level.
 */
export async function loadGrammar(level: JLPTLevel): Promise<GrammarItem[]> {
  return fetchWithCache<GrammarItem[]>(`/data/grammar/${level.toLowerCase()}.json`);
}

/**
 * Loads all lesson groups for a given JLPT level.
 */
export async function loadLessons(level: JLPTLevel): Promise<LessonGroup[]> {
  return fetchWithCache<LessonGroup[]>(`/data/lessons/${level.toLowerCase()}.json`);
}

/**
 * Resolves a LessonGroup to its actual curriculum items by matching IDs
 * against the provided kanji, vocabulary, and grammar data arrays.
 */
export function getLessonItems(
  lessonGroup: LessonGroup,
  kanjiData: KanjiItem[],
  vocabData: VocabItem[],
  grammarData: GrammarItem[]
): {
  kanji: KanjiItem[];
  vocabulary: VocabItem[];
  grammar: GrammarItem[];
  all: CurriculumItem[];
} {
  const kanji = lessonGroup.items.kanji
    .map((id) => kanjiData.find((k) => k.id === id))
    .filter((item): item is KanjiItem => item !== undefined);

  const vocabulary = lessonGroup.items.vocabulary
    .map((id) => vocabData.find((v) => v.id === id))
    .filter((item): item is VocabItem => item !== undefined);

  const grammar = lessonGroup.items.grammar
    .map((id) => grammarData.find((g) => g.id === id))
    .filter((item): item is GrammarItem => item !== undefined);

  const all: CurriculumItem[] = [...kanji, ...vocabulary, ...grammar];

  return { kanji, vocabulary, grammar, all };
}

/**
 * Clears the in-memory curriculum cache.
 * Useful for testing or when data needs to be refreshed.
 */
export function clearCurriculumCache(): void {
  cache.clear();
}
