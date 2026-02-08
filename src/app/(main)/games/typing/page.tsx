'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Keyboard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TypingGame from '@/components/games/TypingGame';
import { loadVocabulary } from '@/lib/curriculum/loader';
import { VocabItem } from '@/types/curriculum';

const FALLBACK_ITEMS = [
  { id: 't1', japanese: '食べる', reading: 'たべる', meaning: 'to eat' },
  { id: 't2', japanese: '飲む', reading: 'のむ', meaning: 'to drink' },
  { id: 't3', japanese: '見る', reading: 'みる', meaning: 'to see' },
  { id: 't4', japanese: '聞く', reading: 'きく', meaning: 'to listen' },
  { id: 't5', japanese: '話す', reading: 'はなす', meaning: 'to speak' },
  { id: 't6', japanese: '読む', reading: 'よむ', meaning: 'to read' },
  { id: 't7', japanese: '書く', reading: 'かく', meaning: 'to write' },
  { id: 't8', japanese: '行く', reading: 'いく', meaning: 'to go' },
  { id: 't9', japanese: '来る', reading: 'くる', meaning: 'to come' },
  { id: 't10', japanese: '帰る', reading: 'かえる', meaning: 'to return' },
  { id: 't11', japanese: '走る', reading: 'はしる', meaning: 'to run' },
  { id: 't12', japanese: '歩く', reading: 'あるく', meaning: 'to walk' },
  { id: 't13', japanese: '泳ぐ', reading: 'およぐ', meaning: 'to swim' },
  { id: 't14', japanese: '待つ', reading: 'まつ', meaning: 'to wait' },
  { id: 't15', japanese: '買う', reading: 'かう', meaning: 'to buy' },
  { id: 't16', japanese: '売る', reading: 'うる', meaning: 'to sell' },
  { id: 't17', japanese: '使う', reading: 'つかう', meaning: 'to use' },
  { id: 't18', japanese: '作る', reading: 'つくる', meaning: 'to make' },
  { id: 't19', japanese: '思う', reading: 'おもう', meaning: 'to think' },
  { id: 't20', japanese: '知る', reading: 'しる', meaning: 'to know' },
  { id: 't21', japanese: '住む', reading: 'すむ', meaning: 'to live' },
  { id: 't22', japanese: '遊ぶ', reading: 'あそぶ', meaning: 'to play' },
  { id: 't23', japanese: '寝る', reading: 'ねる', meaning: 'to sleep' },
  { id: 't24', japanese: '起きる', reading: 'おきる', meaning: 'to wake up' },
  { id: 't25', japanese: '勉強する', reading: 'べんきょうする', meaning: 'to study' },
];

export default function TypingPage() {
  const searchParams = useSearchParams();
  const diffParam = searchParams.get('difficulty');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    (diffParam as 'easy' | 'medium' | 'hard') || 'medium'
  );
  const [items, setItems] = useState<
    { id: string; japanese: string; reading: string; meaning: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const vocab = await loadVocabulary('N5');
      if (vocab && vocab.length >= 20) {
        const mapped = vocab.map((v: VocabItem) => ({
          id: v.id,
          japanese: v.word,
          reading: v.reading,
          meaning: v.meanings[0],
        }));
        setItems(mapped);
      } else {
        throw new Error('Not enough vocab');
      }
    } catch {
      setItems(FALLBACK_ITEMS);
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
          className="h-8 w-8 rounded-full border-4 border-pink-400 border-t-transparent"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/20">
            <Keyboard className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Typing Practice
            </h1>
            <p className="text-xs text-muted-foreground">
              Type readings in kana
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
      <TypingGame key={gameKey} items={items} difficulty={difficulty} />
    </div>
  );
}
