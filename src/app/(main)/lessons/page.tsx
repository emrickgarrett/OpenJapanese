'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, GraduationCap } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import SkillTree from '@/components/lessons/SkillTree';
import { useLessons } from '@/hooks/useLessons';
import { useProfile } from '@/providers/ProfileProvider';
import type { JLPTLevel, LessonGroup } from '@/types/curriculum';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Determine which levels are unlocked based on user's current level
function getUnlockedLevels(currentLevel: string): JLPTLevel[] {
  const idx = JLPT_LEVELS.indexOf(currentLevel as JLPTLevel);
  if (idx === -1) return ['N5'];
  return JLPT_LEVELS.slice(0, idx + 1);
}

export default function LessonsPage() {
  const { profile } = useProfile();
  const router = useRouter();

  const currentJlptLevel = (profile?.current_jlpt_level ?? 'N5') as JLPTLevel;
  const unlockedLevels = useMemo(
    () => getUnlockedLevels(currentJlptLevel),
    [currentJlptLevel]
  );

  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>(currentJlptLevel);

  const { lessons, isLoading } = useLessons(profile?.id, selectedLevel);

  // Calculate overall progress for the level
  const overallProgress = useMemo(() => {
    if (lessons.length === 0) return 0;
    const completed = lessons.filter((l) => l.status === 'completed').length;
    return Math.round((completed / lessons.length) * 100);
  }, [lessons]);

  const handleSelectLesson = (lesson: LessonGroup) => {
    router.push(`/lessons/${lesson.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Your Learning Path
            </h1>
            <p className="text-sm text-muted-foreground">
              Master Japanese step by step
            </p>
          </div>
        </div>
      </motion.div>

      {/* JLPT Level tabs */}
      <Tabs
        value={selectedLevel}
        onValueChange={(val) => setSelectedLevel(val as JLPTLevel)}
      >
        <TabsList className="w-full justify-start">
          {JLPT_LEVELS.map((level) => {
            const isUnlocked = unlockedLevels.includes(level);
            return (
              <TabsTrigger
                key={level}
                value={level}
                disabled={!isUnlocked}
                className="gap-1.5"
              >
                {level}
                {!isUnlocked && (
                  <span className="text-[10px] text-muted-foreground">
                    🔒
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {JLPT_LEVELS.map((level) => (
          <TabsContent key={level} value={level}>
            {/* Level progress overview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {level} Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="size-4 text-amber-500" />
                    <span className="text-muted-foreground">
                      {lessons.filter((l) => l.status === 'completed').length} /{' '}
                      {lessons.length} lessons
                    </span>
                  </div>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {overallProgress}% complete
                </p>
              </div>

              {/* Skill tree */}
              {isLoading ? (
                <div className="flex flex-col items-center gap-10 py-8">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <Skeleton className="size-16 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : lessons.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex size-20 items-center justify-center rounded-full bg-muted text-4xl">
                    🦊
                  </div>
                  <p className="text-lg font-medium text-foreground">
                    No lessons available yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Lesson content for {level} is coming soon!
                  </p>
                </div>
              ) : (
                <SkillTree
                  lessons={lessons}
                  onSelectLesson={handleSelectLesson}
                />
              )}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
