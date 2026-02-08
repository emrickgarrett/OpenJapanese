'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import SkillNode, { type SkillNodeStatus } from '@/components/lessons/SkillNode';
import type { LessonGroup } from '@/types/curriculum';

interface SkillTreeProps {
  lessons: (LessonGroup & { status: SkillNodeStatus })[];
  onSelectLesson: (lesson: LessonGroup) => void;
}

export default function SkillTree({ lessons, onSelectLesson }: SkillTreeProps) {
  // Sort lessons by order
  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.order - b.order),
    [lessons]
  );

  // Calculate horizontal position for each node (alternating left-center-right)
  const getNodePosition = (index: number): 'left' | 'center' | 'right' => {
    const pattern: ('left' | 'center' | 'right')[] = [
      'center',
      'right',
      'center',
      'left',
    ];
    return pattern[index % pattern.length];
  };

  const positionClasses = {
    left: 'mr-auto ml-8 md:ml-16',
    center: 'mx-auto',
    right: 'ml-auto mr-8 md:mr-16',
  };

  return (
    <div className="relative mx-auto w-full max-w-md py-8">
      {/* Background path line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border" />

      {/* Nodes */}
      <div className="relative flex flex-col gap-10">
        {sortedLessons.map((lesson, index) => {
          const position = getNodePosition(index);

          return (
            <div key={lesson.id} className="relative">
              {/* Connecting line from center to node */}
              {position !== 'center' && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.08 + 0.2, duration: 0.3 }}
                  className="absolute top-8 h-0.5 bg-border"
                  style={{
                    left: position === 'left' ? 'calc(50% - 2rem)' : '50%',
                    right: position === 'right' ? 'calc(50% - 2rem)' : '50%',
                    transformOrigin: position === 'left' ? 'right' : 'left',
                    width: position === 'left'
                      ? 'calc(50% - 3rem)'
                      : 'calc(50% - 3rem)',
                  }}
                />
              )}

              {/* Vertical connecting dot on center line */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.08 + 0.1 }}
                className="absolute left-1/2 top-[30px] size-2 -translate-x-1/2 rounded-full bg-border"
              />

              {/* Node */}
              <div className={positionClasses[position]}>
                <SkillNode
                  lesson={lesson}
                  status={lesson.status}
                  onClick={() => onSelectLesson(lesson)}
                  index={index}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
