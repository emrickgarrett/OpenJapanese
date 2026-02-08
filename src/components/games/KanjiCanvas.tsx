'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MouseEvent,
  TouchEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameTimer from '@/components/games/GameTimer';
import GameResults from '@/components/games/GameResults';
import { useGameStore } from '@/stores/game-store';
import { XP_REWARDS } from '@/lib/progression/xp';

interface KanjiCanvasProps {
  items: { id: string; character: string; meaning: string }[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Stroke {
  points: { x: number; y: number }[];
}

const ITEMS_PER_ROUND = 10;

export default function KanjiCanvas({ items, difficulty }: KanjiCanvasProps) {
  const previewDuration = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 2;

  const { startGame, endGame, resetGame } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameItems, setGameItems] = useState<
    { id: string; character: string; meaning: string }[]
  >([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [phase, setPhase] = useState<'preview' | 'draw' | 'grade'>('preview');
  const [previewTimeLeft, setPreviewTimeLeft] = useState(previewDuration);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const shuffleAndSelect = useCallback(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(ITEMS_PER_ROUND, shuffled.length));
  }, [items]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
  }, []);

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Diagonal lines
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  const initGame = useCallback(() => {
    const selected = shuffleAndSelect();
    setGameItems(selected);
    setCurrentIndex(0);
    setStrokes([]);
    setCurrentStroke(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowResults(false);
    setPhase('preview');
    setPreviewTimeLeft(previewDuration);
    setIsRunning(true);
    setElapsedSeconds(0);
    setShowHint(false);
    startGame('kanji-draw');
  }, [shuffleAndSelect, previewDuration, startGame]);

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

  // Preview countdown
  useEffect(() => {
    if (phase !== 'preview') return;

    setPreviewTimeLeft(previewDuration);

    const interval = setInterval(() => {
      setPreviewTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('draw');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, previewDuration, currentIndex]);

  // Clear canvas on new question
  useEffect(() => {
    if (phase === 'draw') {
      setStrokes([]);
      setShowHint(false);
      setTimeout(() => clearCanvas(), 50);
    }
  }, [phase, clearCanvas, currentIndex]);

  // Redraw on strokes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  const getCanvasPoint = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (phase !== 'draw') return;
    const point = getCanvasPoint(e);
    if (!point) return;
    setIsDrawing(true);
    setCurrentStroke({ points: [point] });
  };

  const handlePointerMove = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || phase !== 'draw' || !currentStroke) return;
    const point = getCanvasPoint(e);
    if (!point) return;

    const newStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point],
    };
    setCurrentStroke(newStroke);

    // Draw live
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = newStroke.points;
    if (pts.length < 2) return;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    if (currentStroke.points.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    clearCanvas();
  };

  const handleSubmit = () => {
    setPhase('grade');
  };

  const handleGrade = (correct: boolean) => {
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
    }

    if (currentIndex + 1 >= gameItems.length) {
      setIsRunning(false);
      endGame();
      setTimeout(() => setShowResults(true), 500);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setPhase('preview');
      setStrokes([]);
      setShowHint(false);
    }
  };

  const total = correctCount + incorrectCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const score = correctCount * 100;
  const maxScore = gameItems.length * 100;
  const xpEarned =
    XP_REWARDS.GAME_BASE +
    Math.round((accuracy / 100) * XP_REWARDS.GAME_PERFECT);

  if (showResults) {
    return (
      <GameResults
        gameType="kanji-draw"
        score={score}
        maxScore={maxScore}
        accuracy={accuracy}
        timeSeconds={elapsedSeconds}
        xpEarned={xpEarned}
        onPlayAgain={initGame}
      />
    );
  }

  if (gameItems.length === 0) return null;

  const currentItem = gameItems[currentIndex];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <GameTimer mode="up" isRunning={isRunning} />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {currentIndex + 1}
          </span>{' '}
          / {gameItems.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
          animate={{
            width: `${((currentIndex) / gameItems.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Meaning display */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Draw the kanji for:</p>
        <p className="text-xl font-semibold text-foreground">
          {currentItem.meaning}
        </p>
      </div>

      {/* Preview Phase */}
      <AnimatePresence mode="wait">
        {phase === 'preview' && (
          <motion.div
            key="preview"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-8"
          >
            <p className="text-sm text-blue-300">
              Memorize this kanji ({previewTimeLeft}s)
            </p>
            <span className="text-8xl font-bold text-foreground">
              {currentItem.character}
            </span>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted/30">
              <motion.div
                className="h-full rounded-full bg-blue-400"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{
                  duration: previewDuration,
                  ease: 'linear',
                }}
                key={currentIndex}
              />
            </div>
          </motion.div>
        )}

        {/* Draw Phase */}
        {phase === 'draw' && (
          <motion.div
            key="draw"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-border/50 bg-background">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />

              {/* Hint overlay */}
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-[200px] font-bold text-foreground">
                      {currentItem.character}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Drawing Controls */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={strokes.length === 0}
                >
                  <Undo2 className="mr-1 h-4 w-4" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={strokes.length === 0}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? (
                    <EyeOff className="mr-1 h-4 w-4" />
                  ) : (
                    <Eye className="mr-1 h-4 w-4" />
                  )}
                  Hint
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
              >
                Submit
              </Button>
            </div>
          </motion.div>
        )}

        {/* Grade Phase */}
        {phase === 'grade' && (
          <motion.div
            key="grade"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* User's drawing */}
              <div className="space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Your Drawing
                </p>
                <div className="overflow-hidden rounded-xl border border-border/50 bg-background">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Correct kanji */}
              <div className="space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Correct Kanji
                </p>
                <div className="flex items-center justify-center rounded-xl border border-border/50 bg-background aspect-square">
                  <span className="text-8xl font-bold text-foreground">
                    {currentItem.character}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="mb-4 text-lg font-medium text-foreground">
                Did you draw it correctly?
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleGrade(false)}
                  className="border-red-400/50 text-red-400 hover:bg-red-500/10"
                >
                  <X className="mr-2 h-5 w-5" />
                  Not quite
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleGrade(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Got it!
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
