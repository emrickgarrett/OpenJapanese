'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import SRSIndicator from '@/components/reviews/SRSIndicator';
import type { CurriculumItem, ItemType, KanjiItem, VocabItem, GrammarItem } from '@/types/curriculum';

interface ReviewCardProps {
  item: CurriculumItem;
  itemType: ItemType;
  srsStage?: number;
}

function isKanjiItem(item: CurriculumItem): item is KanjiItem {
  return 'character' in item && 'onyomi' in item;
}

function isVocabItem(item: CurriculumItem): item is VocabItem {
  return 'word' in item && 'reading' in item && 'partOfSpeech' in item;
}

function isGrammarItem(item: CurriculumItem): item is GrammarItem {
  return 'structure' in item && 'explanation' in item;
}

const typeLabels: Record<ItemType, { label: string; color: string }> = {
  kanji: {
    label: 'Kanji',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  },
  vocabulary: {
    label: 'Vocabulary',
    color:
      'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  },
  grammar: {
    label: 'Grammar',
    color:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
};

export default function ReviewCard({ item, itemType, srsStage }: ReviewCardProps) {
  const typeConfig = typeLabels[itemType];

  let displayText = '';
  if (isKanjiItem(item)) {
    displayText = item.character;
  } else if (isVocabItem(item)) {
    displayText = item.word;
  } else if (isGrammarItem(item)) {
    displayText = item.title;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardContent className="relative flex flex-col items-center gap-4 py-12">
          {/* Badges row */}
          <div className="flex items-center gap-2">
            <Badge className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
            {srsStage !== undefined && <SRSIndicator stage={srsStage} />}
          </div>

          {/* Main display */}
          <span
            className={`font-japanese text-center font-bold leading-none text-foreground ${
              isKanjiItem(item) ? 'text-8xl' : isVocabItem(item) ? 'text-6xl' : 'text-4xl'
            }`}
          >
            {displayText}
          </span>

          {/* Grammar structure hint */}
          {isGrammarItem(item) && (
            <p className="font-mono text-sm text-muted-foreground">
              {item.structure}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
