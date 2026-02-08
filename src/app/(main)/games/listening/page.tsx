'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Headphones } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ListeningGame from '@/components/games/ListeningGame';
import { loadVocabulary } from '@/lib/curriculum/loader';
import { VocabItem } from '@/types/curriculum';

const FALLBACK_ITEMS = [
  { id: 'l1', japanese: '食べる', reading: 'たべる', meaning: 'to eat' },
  { id: 'l2', japanese: '飲む', reading: 'のむ', meaning: 'to drink' },
  { id: 'l3', japanese: '見る', reading: 'みる', meaning: 'to see' },
  { id: 'l4', japanese: '聞く', reading: 'きく', meaning: 'to listen' },
  { id: 'l5', japanese: '話す', reading: 'はなす', meaning: 'to speak' },
  { id: 'l6', japanese: '読む', reading: 'よむ', meaning: 'to read' },
  { id: 'l7', japanese: '書く', reading: 'かく', meaning: 'to write' },
  { id: 'l8', japanese: '行く', reading: 'いく', meaning: 'to go' },
  { id: 'l9', japanese: '来る', reading: 'くる', meaning: 'to come' },
  { id: 'l10', japanese: '帰る', reading: 'かえる', meaning: 'to return' },
  { id: 'l11', japanese: '猫', reading: 'ねこ', meaning: 'cat' },
  { id: 'l12', japanese: '犬', reading: 'いぬ', meaning: 'dog' },
  { id: 'l13', japanese: '山', reading: 'やま', meaning: 'mountain' },
  { id: 'l14', japanese: '川', reading: 'かわ', meaning: 'river' },
  { id: 'l15', japanese: '水', reading: 'みず', meaning: 'water' },
  { id: 'l16', japanese: '花', reading: 'はな', meaning: 'flower' },
  { id: 'l17', japanese: '空', reading: 'そら', meaning: 'sky' },
  { id: 'l18', japanese: '雨', reading: 'あめ', meaning: 'rain' },
  { id: 'l19', japanese: '風', reading: 'かぜ', meaning: 'wind' },
  { id: 'l20', japanese: '学校', reading: 'がっこう', meaning: 'school' },
  { id: 'l21', japanese: '先生', reading: 'せんせい', meaning: 'teacher' },
  { id: 'l22', japanese: '学生', reading: 'がくせい', meaning: 'student' },
  { id: 'l23', japanese: '友達', reading: 'ともだち', meaning: 'friend' },
  { id: 'l24', japanese: '家族', reading: 'かぞく', meaning: 'family' },
  { id: 'l25', japanese: '日本', reading: 'にほん', meaning: 'Japan' },
];

export default function ListeningPage() {
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
      if (vocab && vocab.length >= 15) {
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
          className="h-8 w-8 rounded-full border-4 border-teal-400 border-t-transparent"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20">
            <Headphones className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Listening</h1>
            <p className="text-xs text-muted-foreground">
              Test your listening skills
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
      <ListeningGame key={gameKey} items={items} difficulty={difficulty} />
    </div>
  );
}
