'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MatchingGame from '@/components/games/MatchingGame';
import { loadVocabulary, loadKanji } from '@/lib/curriculum/loader';
import { VocabItem, KanjiItem } from '@/types/curriculum';

// Fallback data for when curriculum data is unavailable
const FALLBACK_ITEMS = [
  { id: 'f1', japanese: '食べる', meaning: 'to eat' },
  { id: 'f2', japanese: '飲む', meaning: 'to drink' },
  { id: 'f3', japanese: '見る', meaning: 'to see' },
  { id: 'f4', japanese: '聞く', meaning: 'to listen' },
  { id: 'f5', japanese: '話す', meaning: 'to speak' },
  { id: 'f6', japanese: '読む', meaning: 'to read' },
  { id: 'f7', japanese: '書く', meaning: 'to write' },
  { id: 'f8', japanese: '行く', meaning: 'to go' },
  { id: 'f9', japanese: '来る', meaning: 'to come' },
  { id: 'f10', japanese: '帰る', meaning: 'to return' },
  { id: 'f11', japanese: '学ぶ', meaning: 'to learn' },
  { id: 'f12', japanese: '教える', meaning: 'to teach' },
  { id: 'f13', japanese: '大きい', meaning: 'big' },
  { id: 'f14', japanese: '小さい', meaning: 'small' },
  { id: 'f15', japanese: '新しい', meaning: 'new' },
  { id: 'f16', japanese: '古い', meaning: 'old' },
  { id: 'f17', japanese: '猫', meaning: 'cat' },
  { id: 'f18', japanese: '犬', meaning: 'dog' },
  { id: 'f19', japanese: '山', meaning: 'mountain' },
  { id: 'f20', japanese: '川', meaning: 'river' },
];

export default function MatchingPage() {
  const searchParams = useSearchParams();
  const diffParam = searchParams.get('difficulty');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    (diffParam as 'easy' | 'medium' | 'hard') || 'medium'
  );
  const [items, setItems] = useState<
    { id: string; japanese: string; meaning: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const vocab = await loadVocabulary('N5');
      if (vocab && vocab.length >= 6) {
        const mapped = vocab.map((v: VocabItem) => ({
          id: v.id,
          japanese: v.word,
          meaning: v.meanings[0],
        }));
        setItems(mapped);
      } else {
        throw new Error('Not enough vocab');
      }
    } catch {
      // Try kanji as fallback
      try {
        const kanji = await loadKanji('N5');
        if (kanji && kanji.length >= 6) {
          const mapped = kanji.map((k: KanjiItem) => ({
            id: k.id,
            japanese: k.character,
            meaning: k.meanings[0],
          }));
          setItems(mapped);
        } else {
          throw new Error('Not enough kanji');
        }
      } catch {
        setItems(FALLBACK_ITEMS);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDifficultyChange = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setGameKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          className="h-8 w-8 rounded-full border-4 border-purple-400 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/games">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20">
            <Grid3X3 className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Matching</h1>
            <p className="text-xs text-muted-foreground">
              Match kanji with their meanings
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button key={diff} onClick={() => handleDifficultyChange(diff)}>
              <Badge
                variant={difficulty === diff ? 'default' : 'outline'}
                className={`cursor-pointer capitalize ${
                  difficulty === diff ? '' : 'opacity-60'
                }`}
              >
                {diff}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Game */}
      <MatchingGame
        key={gameKey}
        items={items}
        difficulty={difficulty}
      />
    </div>
  );
}
