import React from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

/**
 * AudioCoachToggle — Small floating mute/unmute button.
 * Shows loading state while TTS is being generated.
 *
 * Props: isMuted, onToggle, isLoading, isPlaying, className
 */
export default function AudioCoachToggle({ isMuted, onToggle, isLoading = false, isPlaying = false, className = '' }) {
  return (
    <button
      onClick={onToggle}
      className={`fixed top-20 right-4 z-40 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md border transition-all active:scale-90 ${
        isMuted
          ? 'bg-zinc-800/80 border-white/[0.08] text-zinc-500 hover:text-zinc-300'
          : isPlaying
          ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-400 shadow-lg shadow-cyan-500/20'
          : 'bg-zinc-800/80 border-white/[0.08] text-zinc-300 hover:text-white'
      } ${className}`}
      title={isMuted ? 'Audio Coach stummgeschaltet — tippen zum aktivieren' : 'Audio Coach aktiv — tippen zum stummstellen'}
      aria-label={isMuted ? 'Audio einschalten' : 'Audio ausschalten'}
    >
      {isLoading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : isMuted
        ? <VolumeX className="w-4 h-4" />
        : <Volume2 className="w-4 h-4" />
      }
      {!isMuted && isPlaying && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-[#111111] animate-pulse" />
      )}
    </button>
  );
}