import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2, Anchor } from 'lucide-react';
import { useAudioCoach } from '@/hooks/useAudioCoach';
import AudioCoachToggle from '@/components/AudioCoachToggle';

const BRIDGE_TEXT =
  'Okay, gut gemacht. Dein Körper ist jetzt offen — die Faszie ist frei, das Nervensystem ist kalibriert. ' +
  'Aber jetzt kommt’s: dein Körper ist vergesslich. In zwei Stunden wäre alles wieder beim Alten, wenn wir jetzt nichts tun. ' +
  'Die nächste Übung ist der wichtigste Teil. Sie setzt einen Anker für dein Nervensystem — damit dein Körper sich an diesen Zustand erinnert und drin bleibt. ' +
  'Ohne die Übung vergeudet sich der Effekt. Mit ihr prägt sich das ein. Also: konzentriert, langsam, jede Wiederholung zählt.';

export default function CoachingBridgeScreen({ onComplete, screenId = 3 }) {
  const { isMuted, toggleMute, coach, isPlaying, isLoading: isTTSLoading, stop } = useAudioCoach();

  useEffect(() => {
    const timer = setTimeout(() => coach(BRIDGE_TEXT), 300);
    return () => { clearTimeout(timer); stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayAudio = () => {
    if (isPlaying) { stop(); return; }
    coach(BRIDGE_TEXT);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm mx-auto px-4 space-y-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center pt-4"
      >
        <div className="w-16 h-16 rounded-2xl border border-purple-500/40 bg-purple-500/10 flex items-center justify-center mb-4">
          <Anchor className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">Anker setzen</p>
        <h3 className="text-xl font-black text-white mt-1">Jetzt kommt’s</h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl border border-purple-500/30 p-5"
      >
        <p className="text-slate-200 text-sm leading-relaxed">{BRIDGE_TEXT}</p>
      </motion.div>

      <AudioCoachToggle isMuted={isMuted} onToggle={toggleMute} isLoading={isTTSLoading} isPlaying={isPlaying} />
      <button
        onClick={handlePlayAudio}
        disabled={isTTSLoading}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-medium border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all active:scale-95"
      >
        {isTTSLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Lädt…</>
          : <><Volume2 className="w-4 h-4" /> {isPlaying ? 'Stoppen' : 'Wiederholen'}</>}
      </button>

      <Button
        onClick={() => onComplete(screenId)}
        className="w-full h-14 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-500/40 active:scale-95 transition-transform"
      >
        Zur Übung →
      </Button>
    </motion.div>
  );
}