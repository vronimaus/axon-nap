import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useCachedAudio Hook
 * 
 * Looks for pre-cached audio in TTSCache based on text hash.
 * If found, plays directly without generation delay.
 * Falls back to ttsWithCache if no cache entry exists.
 * 
 * Usage:
 *   const { isPlaying, isLoading, playText, stop } = useCachedAudio();
 *   <button onClick={() => playText(someText)}>▶ Play</button>
 */

const VOICE_VERSION = 'kore-v1';

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim() + '|' + VOICE_VERSION);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useCachedAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const preloadCacheRef = useRef({});
  const playTokenRef = useRef(0);

  const stop = useCallback(() => {
    playTokenRef.current++;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      playTokenRef.current++;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playText = useCallback(async (text) => {
    if (!text?.trim()) return;

    // Always stop existing audio first (prevents echo from overlapping calls)
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
        if (playTokenRef.current !== token) return;
        setIsPlaying(false); audioRef.current = null;
      };
      audio.onerror = () => {
        if (playTokenRef.current !== token) return;
        setIsPlaying(false); audioRef.current = null;
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
      const hash = await hashText(text.trim());

      // First, check if audio is already cached in TTSCache
      const cachedEntries = await base44.entities.TTSCache.filter({ text_hash: hash });
      let signedUrl = null;

      if (cachedEntries.length > 0) {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: cachedEntries[0].file_uri,
          expires_in: 300
        });
        signedUrl = signed_url;
      } else {
        const { data } = await base44.functions.invoke('ttsWithCache', { text });
        if (!data?.signed_url) throw new Error('No audio URL received');
        signedUrl = data.signed_url;
      }

      if (playTokenRef.current !== token) return; // superseded

      preloadCacheRef.current[text] = signedUrl;

      const audio = new Audio(signedUrl);
      audioRef.current = audio;
      attachHandlers(audio);
      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('[useCachedAudio] Error:', error.message);
      if (playTokenRef.current === token) setIsPlaying(false);
    } finally {
      if (playTokenRef.current === token) setIsLoading(false);
    }
  }, [stop]);

  return { isPlaying, isLoading, playText, stop };
}