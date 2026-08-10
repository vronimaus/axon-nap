import { useState, useCallback, useRef, useEffect } from 'react';
import { useTTS } from './useTTS';

const MUTE_KEY = 'axon_audio_muted';

/**
 * useAudioCoach — Auto-playing TTS coach ("Jarvis mode")
 *
 * Wraps useTTS with:
 * - Mute preference persisted in localStorage
 * - coach(text): auto-plays text unless muted
 * - preloadNext(text): silently pre-fetches the next step's audio
 * - Track first user interaction (browsers block autoplay without it)
 *
 * Usage:
 *   const { isMuted, toggleMute, coach, preloadNext, isPlaying, isLoading } = useAudioCoach();
 *   useEffect(() => { coach(narrationText); }, [stepKey]);
 */
export function useAudioCoach() {
  const { isPlaying, isLoading, playText, stop, preload } = useTTS();
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
  });
  const hasInteractedRef = useRef(false);

  // Track first user interaction to satisfy browser autoplay policies
  useEffect(() => {
    const onFirstInteract = () => { hasInteractedRef.current = true; };
    const opts = { once: true, passive: true };
    window.addEventListener('click', onFirstInteract, opts);
    window.addEventListener('touchstart', onFirstInteract, opts);
    window.addEventListener('keydown', onFirstInteract, opts);
    return () => {
      window.removeEventListener('click', onFirstInteract, opts);
      window.removeEventListener('touchstart', onFirstInteract, opts);
      window.removeEventListener('keydown', onFirstInteract, opts);
    };
  }, []);

  const toggleMute = useCallback(() => {
    hasInteractedRef.current = true;
    setIsMuted(prev => {
      const next = !prev;
      try { localStorage.setItem(MUTE_KEY, String(next)); } catch {}
      if (next) stop();
      return next;
    });
  }, [stop]);

  const coach = useCallback((text, { onEnded } = {}) => {
    if (!text?.trim()) return;
    // If muted, just preload silently so it's ready when unmuted — no auto-callback
    if (isMuted) { preload(text); return; }
    // If browser hasn't seen a user interaction yet, autoplay will be blocked.
    // Preload instead so audio is ready when the user taps play.
    if (!hasInteractedRef.current) { preload(text); return; }
    playText(text, { onEnded });
  }, [isMuted, playText, preload]);

  const preloadNext = useCallback((text) => {
    if (!text?.trim()) return;
    preload(text);
  }, [preload]);

  return { isMuted, toggleMute, coach, preloadNext, isPlaying, isLoading, stop };
}