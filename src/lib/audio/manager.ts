import { Howl } from 'howler';
import { SOUNDS, type SoundName } from './sounds';

/**
 * Centralised audio manager built on top of Howler.js.
 *
 * Sounds are lazy-loaded on first play to avoid unnecessary network requests.
 * Every public method is safe to call during SSR (all browser-specific code is
 * guarded behind `typeof window` checks).
 */
class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Returns true when running in a browser context (not SSR / Node).
   */
  private get isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Returns a cached Howl instance for `name`, creating one lazily if needed.
   * Returns `null` when running on the server or if the sound path is unknown.
   */
  private getOrCreate(name: SoundName): Howl | null {
    if (!this.isBrowser) return null;

    const existing = this.sounds.get(name);
    if (existing) return existing;

    const src = SOUNDS[name];
    if (!src) return null;

    try {
      const howl = new Howl({
        src: [src],
        volume: this.volume,
        preload: false, // will be loaded on first play or explicit preload
        html5: false, // use Web Audio API for lower latency
        onloaderror: (_id: number, error: unknown) => {
          console.warn(
            `[AudioManager] Failed to load sound "${name}":`,
            error,
          );
        },
        onplayerror: (_id: number, error: unknown) => {
          console.warn(
            `[AudioManager] Failed to play sound "${name}":`,
            error,
          );
        },
      });

      this.sounds.set(name, howl);
      return howl;
    } catch (error) {
      console.warn(
        `[AudioManager] Error creating Howl for "${name}":`,
        error,
      );
      return null;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Play a sound by name. The sound is lazy-loaded on first play.
   * Does nothing when audio is disabled, during SSR, or if the file cannot be
   * loaded.
   */
  play(name: SoundName): void {
    if (!this.enabled || !this.isBrowser) return;

    const howl = this.getOrCreate(name);
    if (!howl) return;

    try {
      // Howler will load the file automatically on play if it hasn't been
      // loaded yet (preload was set to false).
      howl.volume(this.volume);
      howl.play();
    } catch (error) {
      console.warn(`[AudioManager] Unexpected error playing "${name}":`, error);
    }
  }

  /**
   * Pre-load one or more sounds so they are ready to play instantly.
   * Useful for sounds that need low-latency playback (e.g. correct/incorrect
   * during reviews).
   */
  preload(...names: SoundName[]): void {
    if (!this.isBrowser) return;

    for (const name of names) {
      const howl = this.getOrCreate(name);
      if (howl && howl.state() === 'unloaded') {
        howl.load();
      }
    }
  }

  /**
   * Enable or disable all audio playback globally.
   * When disabled, `play()` becomes a no-op. Already-playing sounds are
   * stopped.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Returns whether audio is currently enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set the master volume for all sounds (0 = silent, 1 = full volume).
   * The value is clamped to [0, 1].
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    // Update volume on all existing Howl instances
    this.sounds.forEach((howl) => {
      howl.volume(this.volume);
    });
  }

  /**
   * Returns the current master volume (0-1).
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Stop all currently-playing sounds.
   */
  stopAll(): void {
    this.sounds.forEach((howl) => {
      howl.stop();
    });
  }

  /**
   * Unload all cached Howl instances and free resources.
   * Mainly useful for testing or complete teardown.
   */
  dispose(): void {
    this.sounds.forEach((howl) => {
      howl.unload();
    });
    this.sounds.clear();
  }
}

/**
 * Singleton audio manager instance shared across the entire application.
 */
export const audioManager = new AudioManager();
