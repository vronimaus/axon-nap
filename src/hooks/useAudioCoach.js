import { useState, useCallback, useRef, useEffect } from 'react';
import { useTTS } from './useTTS';

const MUTE_KEY = 'axon_audio_muted';

// Module-level flag — persists across component mounts/unmounts.
// Captures ANY user interaction on the page, even before a useAudioCoach instance mounts.
let _hasUserInteracted = false;

function _markInteracted() {
  _hasUserInteracted = true;
  _removeInteractionListeners();
}

function _removeInteractionListeners() {
  window.removeEventListener('click', _markInteracted);
  window.removeEventListener('touchstart', _markInteracted);
  window.removeEventListener('keydown', _markInteracted);
}

// Set up listeners once at module load — catches interactions before any component mounts
if (typeof window !== 'undefined' && !_hasUserInteracted) {
  const opts = { once: true, passive: true };
  window.addEventListener('click', _markInteracted, opts);
  window.addEventListener('touchstart', _markInteracted, opts);
  window.addEventListener('keydown', _markInteracted, opts);
}

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

  const toggleMute = useCallback(() => {
    _hasUserInteracted = true;
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
    playText(text, { onEnded });
  }, [isMuted, playText, preload]);

  const preloadNext = useCallback((text) => {
    if (!text?.trim()) return;
    preload(text);
  }, [preload]);

  return { isMuted, toggleMute, coach, preloadNext, isPlaying, isLoading, stop };
}