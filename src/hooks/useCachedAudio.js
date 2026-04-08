import { useState, useRef, useCallback } from 'react';
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

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useCachedAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const preloadCacheRef = useRef({});

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
      const hash = await hashText(text.trim());
      
      // First, check if audio is already cached in TTSCache
      const cached = await base44.entities.TTSCache.filter({ text_hash: hash });
      let signedUrl = null;

      if (cached.length > 0) {
        // Use cached audio file
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ 
          file_uri: cached[0].file_uri, 
          expires_in: 300 
        });
        signedUrl = signed_url;
      } else {
        // Fall back to ttsWithCache to generate and cache it
        const { data } = await base44.functions.invoke('ttsWithCache', { text });
        if (!data?.signed_url) throw new Error('No audio URL received');
        signedUrl = data.signed_url;
      }

      preloadCacheRef.current[text] = signedUrl;

      const audio = new Audio(signedUrl);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('[useCachedAudio] Error:', error.message);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, stop]);

  return { isPlaying, isLoading, playText, stop };
}