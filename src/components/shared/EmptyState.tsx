'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 dark:bg-pink-950/40">
        <Icon className="size-7 text-pink-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button
          asChild
          variant="outline"
          className="mt-4 rounded-full border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950/40"
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
