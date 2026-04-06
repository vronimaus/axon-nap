import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2, CheckCircle2 } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import Confetti from 'canvas-confetti';

export default function IntegrationScreen({
  onComplete,
  isSubmitting,
  improvement
}) {
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const { isPlaying, isLoading: isTTSLoading, playText, stop } = useTTS();

  const integration = {
    name: 'Bird-Dog Hold',
    instruction: 'Gehe in Vierfüßlerstand. Strecke gleichzeitig den rechten Arm und das linke Bein. Halte 3 Sekunden. Nutze die Mobilität, die du gerade freigegeben hast. 5 Wiederholungen pro Seite, langsam und konzentriert.',
    why: 'Das ist die neuronale Verankerung. Dein Gehirn myelinisiert die neuen Bewegungsmuster, wenn du sie sofort nach dem MFR und Neuro-Training nutzt. Das führt zu dauerhaften Verbesserungen.'
  };

  const handlePlayAudio = () => {
    if (isPlaying) {
      stop();
      return;
    }
    const text = `${integration.name}. ${integration.instruction}. ${integration.why}`;
    playText(text);
  };

  const handleCompleteExercise = () => {
    setExerciseCompleted(true);
    playText('Fantastisch! Dein Nervensystem hat die neue Freiheit verankert. Die Verbesserung ist stabil.');
    // Trigger confetti
    Confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleFinalSubmit = () => {
    onComplete(4, { integrationCompleted: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5 max-w-sm mx-auto w-full"
    >
      {/* Highlight: Improvement */}
      {improvement > 0 && (
        <motion.div
          animate={{
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
          }}
          className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-2 border-emerald-500/60 p-5 text-center shadow-lg shadow-emerald-500/25"
        >
          <p className="text-xs text-emerald-300 mb-2 uppercase tracking-widest font-bold">
            Erfolg
          </p>
          <h2 className="text-3xl font-black text-emerald-400">
            -{improvement} Punkte
          </h2>
        </motion.div>
      )}

      {/* Integration Exercise */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-xl border border-purple-500/40 bg-gradient-to-br from-purple-500/15 to-purple-500/5 p-5"
      >
        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">
          Finale Integration
        </p>
        <h3 className="text-lg font-black text-white mb-2">
          {integration.name}
        </h3>
        <p className="text-slate-300 text-xs leading-relaxed mb-3">
          {integration.instruction}
        </p>
      </motion.div>

      {/* Audio Button */}
      <button
        onClick={handlePlayAudio}
        disabled={isTTSLoading}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.96] ${
          isPlaying
            ? 'bg-purple-500/20 border-2 border-purple-400 text-purple-300'
            : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/30'
        }`}
      >
        {isTTSLoading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Laden…</>
          : isPlaying
          ? <><VolumeX className="w-5 h-5" /> Stop</>
          : <><Volume2 className="w-5 h-5" /> Audio</>
        }
      </button>

      {/* Completion Button */}
      {!exerciseCompleted ? (
        <Button
          onClick={handleCompleteExercise}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-purple-500/30"
        >
          Fertig ✓
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/50 p-4 text-center">
            <motion.div
              animate={{ scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            </motion.div>
            <p className="text-sm font-black text-emerald-400 mb-1">
              Permission Granted! ✓
            </p>
          </div>

          <Button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/30"
          >
            {isSubmitting ? 'Speichert...' : 'Session abschließen 🎉'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}