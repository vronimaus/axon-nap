import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Confetti from 'canvas-confetti';
import { useAudioCoach } from '@/hooks/useAudioCoach';
import AudioCoachToggle from '@/components/AudioCoachToggle';

const CHECKLIST = [
  'Faszie freigemacht',
  'Nervensystem kalibriert',
  'Bewegung verankert',
];

const COMPLETION_AUDIO = 'Perfekt gemacht. Faszie freigemacht, Nervensystem kalibriert, Bewegung verankert. Wiederhole das drei Mal pro Woche. Wenn es stabil und flüssig läuft, steiger die Frequenz.';

export default function CompletionScreen({ onComplete, screenId = 5, isSubmitting = false }) {
  const { coach, isPlaying, stop } = useAudioCoach();

  useEffect(() => {
    Confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    const timer = setTimeout(() => coach(COMPLETION_AUDIO), 400);
    return () => { clearTimeout(timer); stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm mx-auto px-4 space-y-6"
    >
      <AudioCoachToggle isMuted={false} isLoading={false} isPlaying={isPlaying} onToggle={() => isPlaying ? stop() : coach(COMPLETION_AUDIO)} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center pt-4"
      >
        <div className="w-16 h-16 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Erledigt</p>
        <h3 className="text-xl font-black text-white mt-1">Session abgeschlossen</h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl border border-emerald-500/30 p-5 space-y-3"
      >
        {CHECKLIST.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-slate-200 text-sm">{item}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"
      >
        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Als Nächstes</p>
        <p className="text-slate-300 text-sm leading-relaxed">
          3x pro Woche wiederholen. Wenn es stabil und flüssig läuft, Frequenz anpassen.
        </p>
      </motion.div>

      <Button
        onClick={() => onComplete(screenId)}
        disabled={isSubmitting}
        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
      >
        {isSubmitting ? 'Speichert...' : 'Session abschließen'}
      </Button>
    </motion.div>
  );
}