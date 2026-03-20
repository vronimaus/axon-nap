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

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playText = useCallback(async (text) => {
    if (!text?.trim()) return;

    // If already playing, stop first
    if (isPlaying) {
      stop();
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('ttsWithCache', { text });

      if (!data?.signed_url) throw new Error('No audio URL received');

      const audio = new Audio(data.signed_url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('[useTTS] Error:', error.message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, stop]);

  return { isPlaying, isLoading, playText, stop };
}