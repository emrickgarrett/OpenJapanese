'use client';

import { motion } from 'framer-motion';
import { Layers, PenLine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AudioButton from '@/components/shared/AudioButton';
import type { KanjiItem, VocabItem } from '@/types/curriculum';

interface KanjiDisplayProps {
  kanji: KanjiItem;
  allVocab?: VocabItem[];
}

export default function KanjiDisplay({ kanji, allVocab = [] }: KanjiDisplayProps) {
  // Build a lookup map from vocab IDs to vocab items
  const vocabMap = new Map(allVocab.map((v) => [v.id, v]));
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      {/* Main character card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardContent className="relative flex flex-col items-center gap-4 pt-8 pb-6">
          {/* Large kanji character */}
          <div className="flex items-center gap-3">
            <span className="font-japanese text-8xl font-bold leading-none text-foreground">
              {kanji.character}
            </span>
            <AudioButton text={kanji.character} className="self-start mt-2" />
          </div>

          {/* Meanings */}
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">
              {kanji.meanings.join(', ')}
            </p>
          </div>

          {/* Readings */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {kanji.onyomi.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  On&apos;yomi
                </span>
                {kanji.onyomi.map((reading) => (
                  <Badge
                    key={reading}
                    className="bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800"
                  >
                    <span className="font-japanese">{reading}</span>
                  </Badge>
                ))}
              </div>
            )}
            {kanji.kunyomi.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Kun&apos;yomi
                </span>
                {kanji.kunyomi.map((reading) => (
                  <Badge
                    key={reading}
                    className="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  >
                    <span className="font-japanese">{reading}</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Stroke count and radical */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <PenLine className="size-4" />
              <span>{kanji.strokeCount} strokes</span>
            </div>
            {kanji.radical && (
              <div className="flex items-center gap-1.5">
                <Layers className="size-4" />
                <span>
                  Radical: <span className="font-japanese">{kanji.radical}</span>
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mnemonic */}
      {kanji.mnemonic && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Mnemonic
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {kanji.mnemonic}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Example words */}
      {kanji.exampleWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Example Words
              </p>
              <div className="flex flex-wrap gap-2">
                {kanji.exampleWords.map((wordId, i) => {
                  const vocab = vocabMap.get(wordId);
                  if (vocab) {
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="font-japanese text-sm gap-1">
                          {vocab.word}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({vocab.reading})
                          </span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {vocab.meanings[0]}
                        </span>
                      </div>
                    );
                  }
                  // Fallback: if not found in lookup, don't render the raw ID
                  return null;
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
