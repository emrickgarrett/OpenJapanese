'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Puzzle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SentenceBuilder from '@/components/games/SentenceBuilder';

export default function SentenceBuilderPage() {
  const searchParams = useSearchParams();
  const diffParam = searchParams.get('difficulty');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    (diffParam as 'easy' | 'medium' | 'hard') || 'medium'
  );
  const [gameKey, setGameKey] = useState(0);

  const handleDifficultyChange = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setGameKey((prev) => prev + 1);
  };

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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
            <Puzzle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Sentence Builder
            </h1>
            <p className="text-xs text-muted-foreground">
              Build sentences word by word
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
      <SentenceBuilder key={gameKey} difficulty={difficulty} />
    </div>
  );
}
