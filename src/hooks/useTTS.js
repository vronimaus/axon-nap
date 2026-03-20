import { useState, useRef, useCallback } from 'react';
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

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
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

  const playText = useCallback(async (text) => {
    if (!text?.trim()) return;

    if (isPlaying) {
      stop();
      return;
    }

    // Use preloaded URL if available
    const cached = preloadCacheRef.current[text];
    if (cached && cached !== 'loading') {
      const audio = new Audio(cached);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
      await audio.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('ttsWithCache', { text });
      if (!data?.signed_url) throw new Error('No audio URL received');

      preloadCacheRef.current[text] = data.signed_url;

      const audio = new Audio(data.signed_url);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('[useTTS] Error:', error.message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, stop]);

  return { isPlaying, isLoading, playText, stop, preload };
}