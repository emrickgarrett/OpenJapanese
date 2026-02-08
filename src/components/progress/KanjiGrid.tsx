'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SRS_STAGE_COLORS, SRS_STAGE_NAMES } from '@/lib/srs/constants';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { JLPTLevel } from '@/types/curriculum';

interface KanjiProgressItem {
  character: string;
  meanings: string[];
  readings?: string[];
  stage: number;
  jlptLevel?: JLPTLevel;
}

interface KanjiGridProps {
  progress: KanjiProgressItem[];
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export default function KanjiGrid({ progress }: KanjiGridProps) {
  const [selectedLevel, setSelectedLevel] = useState<'all' | JLPTLevel>('all');
  const [selectedKanji, setSelectedKanji] = useState<KanjiProgressItem | null>(null);
  const [hoveredKanji, setHoveredKanji] = useState<KanjiProgressItem | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const filtered =
    selectedLevel === 'all'
      ? progress
      : progress.filter((k) => k.jlptLevel === selectedLevel);

  return (
    <div>
      {/* JLPT filter tabs */}
      <Tabs
        value={selectedLevel}
        onValueChange={(v) => setSelectedLevel(v as 'all' | JLPTLevel)}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {JLPT_LEVELS.map((level) => (
            <TabsTrigger key={level} value={level}>
              {level}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Kanji grid */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No kanji learned yet at this level.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {filtered.map((kanji) => (
            <motion.button
              key={kanji.character}
              whileHover={{ scale: 1.15, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              className="font-japanese relative flex h-8 w-8 items-center justify-center rounded text-sm font-medium text-white transition-shadow hover:shadow-lg"
              style={{ backgroundColor: SRS_STAGE_COLORS[kanji.stage] ?? '#A0A0A0' }}
              onClick={() => setSelectedKanji(kanji)}
              onMouseEnter={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setHoveredKanji(kanji);
                setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setHoveredKanji(null)}
            >
              {kanji.character}
            </motion.button>
          ))}
        </div>
      )}

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredKanji && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-50 rounded-lg border border-border bg-card px-3 py-2 shadow-lg"
            style={{
              left: hoverPos.x,
              top: hoverPos.y - 60,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-japanese text-center text-lg font-bold">
              {hoveredKanji.character}
            </p>
            <p className="text-xs text-muted-foreground">
              {hoveredKanji.meanings.join(', ')}
            </p>
            <p className="text-xs" style={{ color: SRS_STAGE_COLORS[hoveredKanji.stage] }}>
              {SRS_STAGE_NAMES[hoveredKanji.stage]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail dialog */}
      <Dialog open={!!selectedKanji} onOpenChange={() => setSelectedKanji(null)}>
        <DialogContent className="max-w-sm">
          {selectedKanji && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span
                    className="font-japanese flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-bold text-white"
                    style={{
                      backgroundColor: SRS_STAGE_COLORS[selectedKanji.stage] ?? '#A0A0A0',
                    }}
                  >
                    {selectedKanji.character}
                  </span>
                  <div>
                    <p className="text-lg font-semibold">
                      {selectedKanji.meanings.join(', ')}
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: SRS_STAGE_COLORS[selectedKanji.stage] }}
                    >
                      {SRS_STAGE_NAMES[selectedKanji.stage]}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Meanings
                  </p>
                  <p className="text-sm">{selectedKanji.meanings.join(', ')}</p>
                </div>
                {selectedKanji.readings && selectedKanji.readings.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Readings
                    </p>
                    <p className="font-japanese text-sm">
                      {selectedKanji.readings.join(', ')}
                    </p>
                  </div>
                )}
                {selectedKanji.jlptLevel && (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      JLPT Level
                    </p>
                    <p className="text-sm">{selectedKanji.jlptLevel}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
