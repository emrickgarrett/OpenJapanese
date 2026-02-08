'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameTimer from '@/components/games/GameTimer';
import GameResults from '@/components/games/GameResults';
import { useGameStore } from '@/stores/game-store';
import { XP_REWARDS } from '@/lib/progression/xp';

interface SentenceChallenge {
  english: string;
  japanese: string[];
  distractors: string[];
}

const SENTENCES: SentenceChallenge[] = [
  {
    english: 'I am a student.',
    japanese: ['私', 'は', '学生', 'です'],
    distractors: ['が', '先生'],
  },
  {
    english: 'This is a book.',
    japanese: ['これ', 'は', '本', 'です'],
    distractors: ['それ', 'ペン'],
  },
  {
    english: 'I eat rice.',
    japanese: ['私', 'は', 'ご飯', 'を', '食べます'],
    distractors: ['が', '飲みます'],
  },
  {
    english: 'Where is the station?',
    japanese: ['駅', 'は', 'どこ', 'ですか'],
    distractors: ['なに', 'いつ'],
  },
  {
    english: 'I like cats.',
    japanese: ['私', 'は', '猫', 'が', '好き', 'です'],
    distractors: ['を', '犬'],
  },
  {
    english: 'Today is Monday.',
    japanese: ['今日', 'は', '月曜日', 'です'],
    distractors: ['昨日', '明日'],
  },
  {
    english: 'I go to school.',
    japanese: ['私', 'は', '学校', 'に', '行きます'],
    distractors: ['を', '来ます'],
  },
  {
    english: 'There is a cat.',
    japanese: ['猫', 'が', 'います'],
    distractors: ['は', 'あります'],
  },
  {
    english: 'The weather is good.',
    japanese: ['天気', 'が', 'いい', 'です'],
    distractors: ['は', '悪い'],
  },
  {
    english: 'I drink water.',
    japanese: ['私', 'は', '水', 'を', '飲みます'],
    distractors: ['が', '食べます'],
  },
  {
    english: 'This is delicious.',
    japanese: ['これ', 'は', 'おいしい', 'です'],
    distractors: ['それ', 'まずい'],
  },
  {
    english: 'I speak Japanese.',
    japanese: ['私', 'は', '日本語', 'を', '話します'],
    distractors: ['が', '英語'],
  },
  {
    english: 'The movie is interesting.',
    japanese: ['映画', 'は', 'おもしろい', 'です'],
    distractors: ['が', 'つまらない'],
  },
  {
    english: 'I read a newspaper.',
    japanese: ['私', 'は', '新聞', 'を', '読みます'],
    distractors: ['が', '書きます'],
  },
  {
    english: 'My name is Tanaka.',
    japanese: ['私', 'の', '名前', 'は', '田中', 'です'],
    distractors: ['が', '山田'],
  },
  {
    english: 'I want to eat sushi.',
    japanese: ['寿司', 'が', '食べたい', 'です'],
    distractors: ['を', 'ラーメン'],
  },
  {
    english: 'It is three o\'clock.',
    japanese: ['今', 'は', '三時', 'です'],
    distractors: ['が', '四時'],
  },
  {
    english: 'I came from America.',
    japanese: ['私', 'は', 'アメリカ', 'から', '来ました'],
    distractors: ['に', '行きました'],
  },
  {
    english: 'Please give me this.',
    japanese: ['これ', 'を', 'ください'],
    distractors: ['は', 'それ'],
  },
  {
    english: 'I study every day.',
    japanese: ['毎日', '勉強', 'します'],
    distractors: ['を', '仕事'],
  },
  {
    english: 'Where is the toilet?',
    japanese: ['トイレ', 'は', 'どこ', 'ですか'],
    distractors: ['なに', 'いくら'],
  },
  {
    english: 'I am a teacher.',
    japanese: ['私', 'は', '先生', 'です'],
    distractors: ['が', '学生'],
  },
];

const ITEMS_PER_GAME = 10;

interface SortableTileProps {
  id: string;
  word: string;
  isInDropZone: boolean;
  status?: 'correct' | 'incorrect' | null;
}

function SortableTile({ id, word, isInDropZone, status }: SortableTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let bgClass = 'border-border/50 bg-card hover:border-emerald-400/30';
  if (status === 'correct') {
    bgClass = 'border-emerald-400/50 bg-emerald-500/15';
  } else if (status === 'incorrect') {
    bgClass = 'border-red-400/50 bg-red-500/15';
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors select-none active:cursor-grabbing ${bgClass} ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      {word}
    </div>
  );
}

interface DroppableZoneProps {
  children: React.ReactNode;
}

function DroppableZone({ children }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'dropzone' });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[56px] flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3 transition-colors ${
        isOver
          ? 'border-emerald-400/50 bg-emerald-500/5'
          : 'border-border/50 bg-muted/10'
      }`}
    >
      {children}
    </div>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface SentenceBuilderProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function SentenceBuilder({ difficulty }: SentenceBuilderProps) {
  const { startGame, endGame, resetGame } = useGameStore();

  const [challenges, setChallenges] = useState<SentenceChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dropZoneItems, setDropZoneItems] = useState<string[]>([]);
  const [bankItems, setBankItems] = useState<string[]>([]);
  const [allTiles, setAllTiles] = useState<
    { id: string; word: string }[]
  >([]);
  const [tileStatuses, setTileStatuses] = useState<
    Record<string, 'correct' | 'incorrect' | null>
  >({});
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const setupChallenge = useCallback(
    (challenge: SentenceChallenge) => {
      const distractorCount =
        difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
      const distractors = shuffleArray(challenge.distractors).slice(
        0,
        Math.min(distractorCount, challenge.distractors.length)
      );

      const allWords = shuffleArray([
        ...challenge.japanese,
        ...distractors,
      ]);

      const tiles = allWords.map((word, idx) => ({
        id: `tile-${idx}-${word}`,
        word,
      }));

      setAllTiles(tiles);
      setDropZoneItems([]);
      setBankItems(tiles.map((t) => t.id));
      setTileStatuses({});
      setIsChecked(false);
      setIsCorrectAnswer(false);
    },
    [difficulty]
  );

  const initGame = useCallback(() => {
    const shuffled = shuffleArray(SENTENCES);
    const selected = shuffled.slice(0, ITEMS_PER_GAME);
    setChallenges(selected);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowResults(false);
    setIsRunning(true);
    setElapsedSeconds(0);
    startGame('sentence-builder');
    setupChallenge(selected[0]);
  }, [startGame, setupChallenge]);

  useEffect(() => {
    initGame();
    return () => resetGame();
  }, []);

  // Track elapsed time
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const getTileWord = (id: string) => {
    return allTiles.find((t) => t.id === id)?.word || '';
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Moving within drop zone
    if (dropZoneItems.includes(activeId) && dropZoneItems.includes(overId)) {
      const oldIndex = dropZoneItems.indexOf(activeId);
      const newIndex = dropZoneItems.indexOf(overId);
      setDropZoneItems(arrayMove(dropZoneItems, oldIndex, newIndex));
      return;
    }

    // Moving from bank to drop zone
    if (bankItems.includes(activeId)) {
      if (overId === 'dropzone' || dropZoneItems.includes(overId)) {
        setBankItems((prev) => prev.filter((id) => id !== activeId));
        if (dropZoneItems.includes(overId)) {
          const overIndex = dropZoneItems.indexOf(overId);
          setDropZoneItems((prev) => {
            const newArr = [...prev];
            newArr.splice(overIndex, 0, activeId);
            return newArr;
          });
        } else {
          setDropZoneItems((prev) => [...prev, activeId]);
        }
      }
      return;
    }

    // Moving from drop zone to bank
    if (
      dropZoneItems.includes(activeId) &&
      (bankItems.includes(overId) || overId === 'wordbank')
    ) {
      setDropZoneItems((prev) => prev.filter((id) => id !== activeId));
      setBankItems((prev) => [...prev, activeId]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Move from bank to dropzone when hovering over it
    if (bankItems.includes(activeId) && overId === 'dropzone') {
      setBankItems((prev) => prev.filter((id) => id !== activeId));
      setDropZoneItems((prev) => [...prev, activeId]);
    }

    // Move from dropzone back to bank
    if (dropZoneItems.includes(activeId) && overId === 'wordbank') {
      setDropZoneItems((prev) => prev.filter((id) => id !== activeId));
      setBankItems((prev) => [...prev, activeId]);
    }
  };

  const handleCheck = () => {
    if (isChecked) return;
    const challenge = challenges[currentIndex];
    const userAnswer = dropZoneItems.map((id) => getTileWord(id));
    const isCorrect =
      JSON.stringify(userAnswer) === JSON.stringify(challenge.japanese);

    // Mark individual tiles
    const statuses: Record<string, 'correct' | 'incorrect' | null> = {};
    dropZoneItems.forEach((id, idx) => {
      const word = getTileWord(id);
      if (idx < challenge.japanese.length && word === challenge.japanese[idx]) {
        statuses[id] = 'correct';
      } else {
        statuses[id] = 'incorrect';
      }
    });
    setTileStatuses(statuses);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
    }

    setIsChecked(true);
    setIsCorrectAnswer(isCorrect);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= challenges.length) {
      setIsRunning(false);
      endGame();
      setTimeout(() => setShowResults(true), 300);
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setupChallenge(challenges[nextIndex]);
    }
  };

  // Clicking a tile in the bank moves it to drop zone
  const handleBankTileClick = (id: string) => {
    if (isChecked) return;
    setBankItems((prev) => prev.filter((i) => i !== id));
    setDropZoneItems((prev) => [...prev, id]);
  };

  // Clicking a tile in the drop zone moves it back
  const handleDropzoneTileClick = (id: string) => {
    if (isChecked) return;
    setDropZoneItems((prev) => prev.filter((i) => i !== id));
    setBankItems((prev) => [...prev, id]);
  };

  const total = correctCount + incorrectCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const score = correctCount * 100;
  const maxScore = ITEMS_PER_GAME * 100;
  const xpEarned =
    XP_REWARDS.GAME_BASE +
    Math.round((accuracy / 100) * XP_REWARDS.GAME_PERFECT);

  if (showResults) {
    return (
      <GameResults
        gameType="sentence-builder"
        score={score}
        maxScore={maxScore}
        accuracy={accuracy}
        timeSeconds={elapsedSeconds}
        xpEarned={xpEarned}
        onPlayAgain={initGame}
      />
    );
  }

  if (challenges.length === 0) return null;

  const currentChallenge = challenges[currentIndex];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <GameTimer mode="up" isRunning={isRunning} />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {currentIndex + 1}
          </span>{' '}
          / {challenges.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-400"
          animate={{
            width: `${((currentIndex) / challenges.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* English Prompt */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center"
        >
          <p className="text-sm text-muted-foreground mb-2">
            Translate into Japanese:
          </p>
          <p className="text-xl font-semibold text-foreground">
            {currentChallenge.english}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        {/* Drop Zone */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Your answer (drag or click to arrange):
          </p>
          <SortableContext
            items={dropZoneItems}
            strategy={horizontalListSortingStrategy}
          >
            <DroppableZone>
              {dropZoneItems.length === 0 ? (
                <span className="text-sm text-muted-foreground/50">
                  Drag words here...
                </span>
              ) : (
                dropZoneItems.map((id) => (
                  <div
                    key={id}
                    onClick={() => handleDropzoneTileClick(id)}
                  >
                    <SortableTile
                      id={id}
                      word={getTileWord(id)}
                      isInDropZone
                      status={tileStatuses[id] || null}
                    />
                  </div>
                ))
              )}
            </DroppableZone>
          </SortableContext>
        </div>

        {/* Word Bank */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Word bank:</p>
          <div
            className="flex flex-wrap gap-2 rounded-xl border border-border/30 bg-muted/5 p-3 min-h-[56px]"
          >
            <SortableContext
              items={bankItems}
              strategy={horizontalListSortingStrategy}
            >
              {bankItems.map((id) => (
                <div
                  key={id}
                  onClick={() => handleBankTileClick(id)}
                >
                  <SortableTile
                    id={id}
                    word={getTileWord(id)}
                    isInDropZone={false}
                  />
                </div>
              ))}
            </SortableContext>
            {bankItems.length === 0 && (
              <span className="text-sm text-muted-foreground/50">
                All words placed
              </span>
            )}
          </div>
        </div>
      </DndContext>

      {/* Feedback */}
      <AnimatePresence>
        {isChecked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl p-4 text-center ${
              isCorrectAnswer
                ? 'border border-emerald-400/30 bg-emerald-500/10'
                : 'border border-red-400/30 bg-red-500/10'
            }`}
          >
            {isCorrectAnswer ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Check className="h-5 w-5" />
                <span className="font-semibold">Correct!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <X className="h-5 w-5" />
                  <span className="font-semibold">Not quite</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Correct answer:{' '}
                  <span className="font-medium text-foreground">
                    {currentChallenge.japanese.join('')}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {!isChecked ? (
          <Button
            onClick={handleCheck}
            disabled={dropZoneItems.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600"
          >
            <Check className="mr-2 h-4 w-4" />
            Check
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600"
          >
            {currentIndex + 1 >= challenges.length ? 'Finish' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
