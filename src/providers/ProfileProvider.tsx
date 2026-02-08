'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  current_jlpt_level: string;
  total_xp: number;
  current_level: number;
  sound_enabled: boolean;
  theme: string;
  daily_goal: number;
  lesson_batch_size: number;
  review_order: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface CreateProfileInput {
  username: string;
  avatarUrl?: string;
  displayName?: string;
}

export interface UpdateProfileInput {
  username?: string;
  avatar_url?: string;
  display_name?: string;
  current_jlpt_level?: string;
  total_xp?: number;
  current_level?: number;
  sound_enabled?: boolean;
  theme?: string;
  daily_goal?: number;
  lesson_batch_size?: number;
  review_order?: string;
}

interface ProfileContextValue {
  profile: Profile | null;
  isLoading: boolean;
  isNewUser: boolean;
  createProfile: (input: CreateProfileInput) => Promise<Profile>;
  updateProfile: (updates: UpdateProfileInput) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────────────────

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const PROFILE_ID_KEY = 'oj_profile_id';

// ─── Provider ───────────────────────────────────────────────────────────────

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Fetch a profile by its ID from Supabase
  const fetchProfile = useCallback(async (profileId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !data) {
      // If the stored ID doesn't match a real profile, treat as new user
      localStorage.removeItem(PROFILE_ID_KEY);
      setIsNewUser(true);
      setProfile(null);
      return;
    }

    setProfile(data as Profile);
    setIsNewUser(false);

    // Update last_active_at in the background
    supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', profileId)
      .then(); // fire-and-forget
  }, []);

  // On mount, check localStorage for an existing profile ID
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const storedId = localStorage.getItem(PROFILE_ID_KEY);
        if (storedId) {
          await fetchProfile(storedId);
        } else {
          setIsNewUser(true);
        }
      } catch (err) {
        console.error('Failed to initialise profile:', err);
        setIsNewUser(true);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [fetchProfile]);

  // Create a brand-new profile
  const createProfile = useCallback(
    async (input: CreateProfileInput): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          username: input.username,
          avatar_url: input.avatarUrl ?? null,
          display_name: input.displayName ?? null,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const created = data as Profile;
      localStorage.setItem(PROFILE_ID_KEY, created.id);
      setProfile(created);
      setIsNewUser(false);

      return created;
    },
    []
  );

  // Partially update the current profile
  const updateProfile = useCallback(
    async (updates: UpdateProfileInput): Promise<Profile> => {
      if (!profile) {
        throw new Error('No profile loaded. Cannot update.');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const updated = data as Profile;
      setProfile(updated);
      return updated;
    },
    [profile]
  );

  // Force-refresh the profile from the database
  const refreshProfile = useCallback(async () => {
    if (!profile) return;
    await fetchProfile(profile.id);
  }, [profile, fetchProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        isNewUser,
        createProfile,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a <ProfileProvider>');
  }
  return context;
}
