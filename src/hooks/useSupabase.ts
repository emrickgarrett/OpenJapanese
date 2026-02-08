'use client';

import { supabase } from '@/lib/supabase/client';

/**
 * Convenience hook that returns the Supabase browser client singleton.
 *
 * This is intentionally thin -- it simply re-exports the client so that
 * components don't need to know the import path, and so that swapping to a
 * context-based client in the future requires changing only this file.
 */
export function useSupabase() {
  return supabase;
}
