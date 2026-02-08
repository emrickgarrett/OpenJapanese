'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KanjiCanvas from '@/components/games/KanjiCanvas';
import { loadKanji } from '@/lib/curriculum/loader';
import { KanjiItem } from '@/types/curriculum';

const FALLBACK_KANJI = [
  { id: 'k1', character: '日', meaning: 'day / sun' },
  { id: 'k2', character: '月', meaning: 'month / moon' },
  { id: 'k3', character: '火', meaning: 'fire' },
  { id: 'k4', character: '水', meaning: 'water' },
  { id: 'k5', character: '木', meaning: 'tree' },
  { id: 'k6', character: '金', meaning: 'gold / money' },
  { id: 'k7', character: '土', meaning: 'earth / soil' },
  { id: 'k8', character: '山', meaning: 'mountain' },
  { id: 'k9', character: '川', meaning: 'river' },
  { id: 'k10', character: '人', meaning: 'person' },
  { id: 'k11', character: '大', meaning: 'big' },
  { id: 'k12', character: '小', meaning: 'small' },
  { id: 'k13', character: '上', meaning: 'above' },
  { id: 'k14', character: '下', meaning: 'below' },
  { id: 'k15', character: '中', meaning: 'middle' },
  { id: 'k16', character: '口', meaning: 'mouth' },
  { id: 'k17', character: '目', meaning: 'eye' },
  { id: 'k18', character: '手', meaning: 'hand' },
  { id: 'k19', character: '足', meaning: 'foot / leg' },
  { id: 'k20', character: '耳', meaning: 'ear' },
];

export default function KanjiDrawPage() {
  const searchParams = useSearchParams();
  const diffParam = searchParams.get('difficulty');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    (diffParam as 'easy' | 'medium' | 'hard') || 'medium'
  );
  const [items, setItems] = useState<
    { id: string; character: string; meaning: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const kanji = await loadKanji('N5');
      if (kanji && kanji.length >= 10) {
        const mapped = kanji.map((k: KanjiItem) => ({
          id: k.id,
          character: k.character,
          meaning: k.meanings[0],
        }));
        setItems(mapped);
      } else {
        throw new Error('Not enough kanji');
      }
    } catch {
      setItems(FALLBACK_KANJI);
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
          className="h-8 w-8 rounded-full border-4 border-blue-400 border-t-transparent"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
            <Pencil className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Kanji Drawing
            </h1>
            <p className="text-xs text-muted-foreground">
              Draw kanji from memory
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
      <KanjiCanvas key={gameKey} items={items} difficulty={difficulty} />
    </div>
  );
}
