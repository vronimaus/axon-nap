import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useTTS Hook
 * 
 * Provides play/stop TTS functionality with caching.
 * Uses ttsWithCache backend function which:
 *   - Returns a cached WAV file if the text was already generated
 *   - Otherwise generates, stores, and returns the audio
 * 
 * Reuses a single Audio element across plays so that once the browser
 * "unlocks" it (first play within a user gesture), subsequent programmatic
 * plays work even without a recent gesture (e.g. after a 90s timer).
 * 
 * Usage:
 *   const { isPlaying, isLoading, playText, stop } = useTTS();
 *   <button onClick={() => playText(someText)}>▶ Vorlesen</button>
 */
export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Single persistent Audio element — reused across plays so the browser's
  // autoplay unlock persists (Safari/iOS require play() within a user gesture
  // to "unlock" an element; once unlocked, it can be played programmatically).
  const audioRef = useRef(null);
  // Preload cache: text → signed_url
  const preloadCacheRef = useRef({});
  // Synchronous playback token — prevents overlapping playback (echo fix)
  const playTokenRef = useRef(0);

  // Lazily create the shared Audio element (once per hook instance)
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  }, []);

  const stop = useCallback(() => {
    playTokenRef.current++; // invalidate any in-flight playback
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Keep the element — don't nullify (preserves the autoplay unlock)
    }
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playTokenRef.current++;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Silently pre-fetches the TTS audio in the background without playing it.
  const preload = useCallback(async (text) => {
    if (!text?.trim()) return;
    if (preloadCacheRef.current[text]) return; // already preloading or cached — skip
    preloadCacheRef.current[text] = 'loading'; // mark immediately to block concurrent calls
    try {
      const { data } = await base44.functions.invoke('ttsWithCache', { text });
      if (data?.signed_url) {
        preloadCacheRef.current[text] = data.signed_url;
      } else {
        delete preloadCacheRef.current[text];
      }
    } catch {
      delete preloadCacheRef.current[text];
    }
  }, []);

  const playText = useCallback(async (text, { onEnded } = {}) => {
    if (!text?.trim()) return;

    // Stop any existing playback (prevents echo from overlapping calls)
    const audio = getAudio();
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.currentTime = 0;

    const token = ++playTokenRef.current;

    const attachHandlers = (au) => {
      au.onended = () => {
        if (playTokenRef.current !== token) return; // stale — superseded
        setIsPlaying(false);
        onEnded?.();
      };
      au.onerror = () => {
        if (playTokenRef.current !== token) return; // stale
        setIsPlaying(false);
      };
    };

    // Use preloaded URL if available
    const cached = preloadCacheRef.current[text];
    if (cached && cached !== 'loading') {
      audio.src = cached;
      attachHandlers(audio);
      setIsPlaying(true);
      try {
        await audio.play();
      } catch (err) {
        // Browser blocked autoplay (NotAllowedError) — user hasn't interacted yet.
        // The "Wiederholen" button will appear for manual replay.
        if (playTokenRef.current === token) {
          setIsPlaying(false);
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('ttsWithCache', { text });
      if (playTokenRef.current !== token) return; // superseded while fetching
      if (!data?.signed_url) throw new Error('No audio URL received');

      preloadCacheRef.current[text] = data.signed_url;

      audio.src = data.signed_url;
      attachHandlers(audio);
      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('[useTTS] Error:', error.message);
      if (playTokenRef.current === token) setIsPlaying(false);
    } finally {
      if (playTokenRef.current === token) setIsLoading(false);
    }
  }, [getAudio]);

  return { isPlaying, isLoading, playText, stop, preload };
}