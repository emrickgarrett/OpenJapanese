'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AudioButton from '@/components/shared/AudioButton';
import JapaneseText from '@/components/shared/JapaneseText';
import type { VocabItem } from '@/types/curriculum';

interface VocabDisplayProps {
  vocab: VocabItem;
}

export default function VocabDisplay({ vocab }: VocabDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      {/* Main word card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5" />
        <CardContent className="relative flex flex-col items-center gap-4 pt-8 pb-6">
          {/* Word display */}
          <div className="flex items-center gap-3">
            <span className="font-japanese text-6xl font-bold leading-none text-foreground">
              {vocab.word}
            </span>
            <AudioButton text={vocab.word} className="self-start mt-2" />
          </div>

          {/* Reading */}
          <p className="font-japanese text-2xl text-muted-foreground">
            {vocab.reading}
          </p>

          {/* Meanings */}
          <p className="text-xl font-semibold text-foreground">
            {vocab.meanings.join(', ')}
          </p>

          {/* Part of speech */}
          <Badge variant="outline" className="text-xs">
            {vocab.partOfSpeech}
          </Badge>
        </CardContent>
      </Card>

      {/* Mnemonic */}
      {vocab.mnemonic && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="py-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Mnemonic
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {vocab.mnemonic}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Example sentences */}
      {vocab.exampleSentences.length > 0 && (
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
              {vocab.exampleSentences.map((sentence, i) => (
                <div
                  key={i}
                  className="space-y-1 rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <JapaneseText
                      text={sentence.japanese}
                      reading={sentence.reading}
                      showReading={true}
                      className="text-lg font-medium"
                    />
                    <AudioButton
                      text={sentence.japanese}
                      className="mt-0.5 shrink-0"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sentence.english}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
