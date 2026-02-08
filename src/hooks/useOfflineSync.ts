'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface QueuedAction {
  /** Supabase table or RPC name to target. */
  action: string;
  /** Payload to send (row data, RPC params, etc.). */
  data: Record<string, unknown>;
  /** Unix epoch ms when the action was queued. */
  timestamp: number;
}

export interface UseOfflineSyncReturn {
  /** Whether the browser currently has network connectivity. */
  isOnline: boolean;
  /**
   * Enqueue an action to be synced to Supabase. If the browser is online the
   * action is flushed immediately; otherwise it is persisted to localStorage
   * and flushed the next time connectivity is restored.
   */
  queueAction: (action: string, data: Record<string, unknown>) => void;
  /** Number of actions waiting to be synced. */
  pendingCount: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'oj_offline_queue';

// ── Helpers ────────────────────────────────────────────────────────────────

function readQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAction[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (queue.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.warn('[useOfflineSync] Failed to write queue to localStorage:', error);
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Offline-aware sync hook.
 *
 * Queues Supabase write operations in localStorage when the browser is
 * offline. Once connectivity returns (via the `online` event, or if the
 * browser is already online at mount time), the queue is flushed
 * sequentially.
 *
 * Each queued action is treated as an upsert to the table identified by
 * `action`. If the flush fails for a particular item it remains in the
 * queue for a subsequent retry.
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Guard against concurrent flushes
  const flushingRef = useRef(false);

  // ── Flush queue ──────────────────────────────────────────────────────

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;

    try {
      const queue = readQueue();
      if (queue.length === 0) {
        setPendingCount(0);
        return;
      }

      const remaining: QueuedAction[] = [];

      for (const item of queue) {
        try {
          const { error } = await supabase.from(item.action).upsert(item.data);

          if (error) {
            console.warn(
              `[useOfflineSync] Failed to flush action "${item.action}":`,
              error,
            );
            remaining.push(item);
          }
        } catch (err) {
          console.warn(
            `[useOfflineSync] Unexpected error flushing "${item.action}":`,
            err,
          );
          remaining.push(item);
        }
      }

      writeQueue(remaining);
      setPendingCount(remaining.length);
    } finally {
      flushingRef.current = false;
    }
  }, []);

  // ── Online/offline listeners ─────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      flush();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync initial state and flush any stale items on mount
    setIsOnline(navigator.onLine);
    setPendingCount(readQueue().length);

    if (navigator.onLine) {
      flush();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flush]);

  // ── queueAction ──────────────────────────────────────────────────────

  const queueAction = useCallback(
    (action: string, data: Record<string, unknown>) => {
      const entry: QueuedAction = {
        action,
        data,
        timestamp: Date.now(),
      };

      // If we are online, try to flush immediately
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        // Attempt an immediate upsert; if it fails, fall through to queue
        supabase
          .from(action)
          .upsert(data)
          .then(({ error }) => {
            if (error) {
              console.warn(
                `[useOfflineSync] Immediate sync failed, queuing:`,
                error,
              );
              const queue = readQueue();
              queue.push(entry);
              writeQueue(queue);
              setPendingCount(queue.length);
            }
          });
        return;
      }

      // Offline: persist to queue
      const queue = readQueue();
      queue.push(entry);
      writeQueue(queue);
      setPendingCount(queue.length);
    },
    [],
  );

  return {
    isOnline,
    queueAction,
    pendingCount,
  };
}
