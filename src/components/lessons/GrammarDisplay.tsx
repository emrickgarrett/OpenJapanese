'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AudioButton from '@/components/shared/AudioButton';
import type { GrammarItem } from '@/types/curriculum';

interface GrammarDisplayProps {
  grammar: GrammarItem;
  allGrammar?: GrammarItem[];
}

export default function GrammarDisplay({ grammar, allGrammar = [] }: GrammarDisplayProps) {
  // Build a lookup map from grammar IDs to grammar items
  const grammarMap = new Map(allGrammar.map((g) => [g.id, g]));
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      {/* Main grammar card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
        <CardContent className="relative flex flex-col items-center gap-4 pt-8 pb-6">
          {/* Title */}
          <h2 className="font-japanese text-4xl font-bold text-foreground">
            {grammar.title}
          </h2>

          {/* Structure */}
          <div className="rounded-lg bg-muted px-4 py-2">
            <p className="font-mono text-lg text-foreground">
              {grammar.structure}
            </p>
          </div>

          {/* Meaning */}
          <p className="text-xl font-semibold text-foreground">
            {grammar.meaning}
          </p>
        </CardContent>
      </Card>

      {/* Explanation */}
      {grammar.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="py-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Explanation
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {grammar.explanation}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Example sentences with breakdowns */}
      {grammar.exampleSentences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="space-y-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Example Sentences
              </p>
              {grammar.exampleSentences.map((sentence, i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-lg bg-muted/50 p-4"
                >
                  {/* Japanese sentence */}
                  <div className="flex items-start gap-2">
                    <p className="font-japanese text-lg font-medium text-foreground">
                      {sentence.japanese}
                    </p>
                    <AudioButton
                      text={sentence.japanese}
                      className="mt-0.5 shrink-0"
                    />
                  </div>

                  {/* Reading */}
                  <p className="font-japanese text-sm text-muted-foreground">
                    {sentence.reading}
                  </p>

                  {/* English */}
                  <p className="text-sm font-medium text-foreground">
                    {sentence.english}
                  </p>

                  {/* Word breakdown */}
                  {sentence.breakdown && sentence.breakdown.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                      {sentence.breakdown.map((part, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-1 rounded-md bg-background px-2 py-1"
                        >
                          <span className="font-japanese text-sm font-medium text-primary">
                            {part.word}
                          </span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {part.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Related grammar */}
      {grammar.relatedGrammar.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Related Grammar
              </p>
              <div className="flex flex-wrap gap-2">
                {grammar.relatedGrammar.map((relatedId, i) => {
                  const relatedItem = grammarMap.get(relatedId);
                  if (relatedItem) {
                    return (
                      <Badge key={i} variant="secondary" className="font-japanese">
                        {relatedItem.title}
                      </Badge>
                    );
                  }
                  // Fallback: don't render raw ID
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
