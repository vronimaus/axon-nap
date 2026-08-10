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
 * Usage:
 *   const { isPlaying, isLoading, playText, stop } = useTTS();
 *   <button onClick={() => playText(someText)}>▶ Vorlesen</button>
 */
export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  // Preload cache: text → signed_url
  const preloadCacheRef = useRef({});
  // Synchronous playback token — prevents overlapping Audio objects (echo fix)
  const playTokenRef = useRef(0);

  const stop = useCallback(() => {
    playTokenRef.current++; // invalidate any in-flight playback
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
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

    // Always stop any existing audio first (prevents echo from overlapping calls)
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const token = ++playTokenRef.current;

    const attachHandlers = (audio) => {
      audio.onended = () => {
        if (playTokenRef.current !== token) return; // stale — superseded
        setIsPlaying(false);
        audioRef.current = null;
        onEnded?.();
      };
      audio.onerror = () => {
        if (playTokenRef.current !== token) return; // stale
        setIsPlaying(false);
        audioRef.current = null;
      };
    };

    // Use preloaded URL if available
    const cached = preloadCacheRef.current[text];
    if (cached && cached !== 'loading') {
      const audio = new Audio(cached);
      audioRef.current = audio;
      attachHandlers(audio);
      setIsPlaying(true);
      await audio.play();
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('ttsWithCache', { text });
      if (playTokenRef.current !== token) return; // superseded while fetching
      if (!data?.signed_url) throw new Error('No audio URL received');

      preloadCacheRef.current[text] = data.signed_url;

      const audio = new Audio(data.signed_url);
      audioRef.current = audio;
      attachHandlers(audio);
      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('[useTTS] Error:', error.message);
      if (playTokenRef.current === token) setIsPlaying(false);
    } finally {
      if (playTokenRef.current === token) setIsLoading(false);
    }
  }, [stop]);

  return { isPlaying, isLoading, playText, stop, preload };
}