'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Copy,
  Check,
  AlertTriangle,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useProfile } from '@/providers/ProfileProvider';
import { supabase } from '@/lib/supabase/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function SettingsPage() {
  const { profile, updateProfile, isLoading: profileLoading } = useProfile();

  // Local settings state
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [lessonBatchSize, setLessonBatchSize] = useState(5);
  const [reviewOrder, setReviewOrder] = useState<'meaning_first' | 'reading_first' | 'random'>(
    'meaning_first'
  );
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileIdCopied, setProfileIdCopied] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Debounce timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize from profile
  useEffect(() => {
    if (profile) {
      setTheme((profile.theme as 'light' | 'dark' | 'auto') ?? 'auto');
      setSoundEnabled(profile.sound_enabled ?? true);
      setDailyGoal(profile.daily_goal ?? 50);
      setLessonBatchSize(profile.lesson_batch_size ?? 5);
      setReviewOrder(
        (profile.review_order as 'meaning_first' | 'reading_first' | 'random') ?? 'meaning_first'
      );
      setDisplayName(profile.display_name ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
    }
  }, [profile]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    (updates: Record<string, unknown>) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(async () => {
        try {
          await updateProfile(updates);
          toast.success('Settings saved');
        } catch (err) {
          toast.error('Failed to save settings');
          console.error('Settings save error:', err);
        }
      }, 800);
    },
    [updateProfile]
  );

  // Setting handlers
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto: check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
    debouncedSave({ theme: newTheme });
  };

  const handleSoundToggle = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    debouncedSave({ sound_enabled: newVal });
  };

  const handleDailyGoalChange = (value: number[]) => {
    const goal = value[0];
    setDailyGoal(goal);
    debouncedSave({ daily_goal: goal });
  };

  const handleBatchSizeChange = (value: string) => {
    const size = parseInt(value, 10);
    setLessonBatchSize(size);
    debouncedSave({ lesson_batch_size: size });
  };

  const handleReviewOrderChange = (value: string) => {
    const order = value as 'meaning_first' | 'reading_first' | 'random';
    setReviewOrder(order);
    debouncedSave({ review_order: order });
  };

  const handleDisplayNameSave = () => {
    debouncedSave({ display_name: displayName || null });
  };

  const handleAvatarUrlSave = () => {
    debouncedSave({ avatar_url: avatarUrl || null });
  };

  const copyProfileId = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.id);
      setProfileIdCopied(true);
      setTimeout(() => setProfileIdCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = profile.id;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setProfileIdCopied(true);
      setTimeout(() => setProfileIdCopied(false), 2000);
    }
  };

  const handleResetProgress = async () => {
    if (!profile) return;

    try {
      // Delete user_progress, review_history, daily_activity, unlocked_achievements
      await Promise.all([
        supabase.from('user_progress').delete().eq('profile_id', profile.id),
        supabase.from('review_history').delete().eq('profile_id', profile.id),
        supabase.from('daily_activity').delete().eq('profile_id', profile.id),
        supabase.from('unlocked_achievements').delete().eq('profile_id', profile.id),
        supabase.from('streaks').delete().eq('profile_id', profile.id),
      ]);

      // Reset profile XP and level
      await updateProfile({
        total_xp: 0,
        current_level: 0,
      });

      toast.success('Progress has been reset');
      setShowResetDialog(false);
    } catch (err) {
      toast.error('Failed to reset progress');
      console.error('Reset error:', err);
    }
  };

  const handleExportData = async () => {
    if (!profile) return;

    try {
      const [progressRes, reviewsRes, activityRes, achievementsRes, streakRes] =
        await Promise.all([
          supabase.from('user_progress').select('*').eq('profile_id', profile.id),
          supabase.from('review_history').select('*').eq('profile_id', profile.id),
          supabase.from('daily_activity').select('*').eq('profile_id', profile.id),
          supabase.from('unlocked_achievements').select('*').eq('profile_id', profile.id),
          supabase.from('streaks').select('*').eq('profile_id', profile.id),
        ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile,
        progress: progressRes.data ?? [],
        reviews: reviewsRes.data ?? [],
        dailyActivity: activityRes.data ?? [],
        achievements: achievementsRes.data ?? [],
        streak: streakRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bwk-export-${profile.username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (err) {
      toast.error('Failed to export data');
      console.error('Export error:', err);
    }
  };

  if (profileLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize your learning experience.
        </p>
      </motion.div>

      {/* ─── Display Settings ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div>
              <label className="mb-2 block text-sm font-medium">Theme</label>
              <div className="flex gap-2">
                {[
                  { value: 'light' as const, icon: Sun, label: 'Light' },
                  { value: 'dark' as const, icon: Moon, label: 'Dark' },
                  { value: 'auto' as const, icon: Monitor, label: 'Auto' },
                ].map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    variant={theme === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange(value)}
                    className="flex-1 gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Sound Effects</label>
                <p className="text-xs text-muted-foreground">
                  Play sounds during reviews and games
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSoundToggle}
                className="gap-2"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    On
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    Off
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Study Settings ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily review goal */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Daily Review Goal</label>
                <Badge variant="secondary">{dailyGoal} reviews</Badge>
              </div>
              <Slider
                value={[dailyGoal]}
                onValueChange={handleDailyGoalChange}
                min={10}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>100</span>
              </div>
            </div>

            {/* Lesson batch size */}
            <div>
              <label className="mb-2 block text-sm font-medium">Lesson Batch Size</label>
              <Select
                value={String(lessonBatchSize)}
                onValueChange={handleBatchSizeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 items</SelectItem>
                  <SelectItem value="5">5 items</SelectItem>
                  <SelectItem value="10">10 items</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Number of new items per lesson session.
              </p>
            </div>

            {/* Review order */}
            <div>
              <label className="mb-2 block text-sm font-medium">Review Order</label>
              <Select value={reviewOrder} onValueChange={handleReviewOrderChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meaning_first">Meaning First</SelectItem>
                  <SelectItem value="reading_first">Reading First</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Which part of the review to show first.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Profile ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display name */}
            <div>
              <label className="mb-2 block text-sm font-medium">Display Name</label>
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={profile.username}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleDisplayNameSave}>
                  Save
                </Button>
              </div>
            </div>

            {/* Avatar URL */}
            <div>
              <label className="mb-2 block text-sm font-medium">Avatar URL</label>
              <div className="flex gap-2">
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleAvatarUrlSave}>
                  Save
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a URL to an image for your avatar.
              </p>
            </div>

            {/* Profile ID */}
            <div>
              <label className="mb-2 block text-sm font-medium">Profile ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono">
                  {profile.id}
                </code>
                <Button variant="outline" size="sm" onClick={copyProfileId} className="gap-1">
                  {profileIdCopied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Share this ID to let others find your profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Danger Zone ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Reset Progress</p>
                <p className="text-xs text-muted-foreground">
                  Delete all your learning progress, reviews, and achievements. This cannot be undone.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowResetDialog(true)}
              >
                Reset Progress
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Export Data</p>
                <p className="text-xs text-muted-foreground">
                  Download all your data as a JSON file.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reset confirmation dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset All Progress
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your learning progress, review history, daily
              activity, achievements, and streak data. Your profile and settings will be
              preserved. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetProgress}>
              Yes, Reset Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
