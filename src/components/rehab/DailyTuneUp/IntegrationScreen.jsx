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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Highlight: Improvement */}
      {improvement > 0 && (
        <motion.div
          animate={{
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="rounded-2xl bg-gradient-to-r from-emerald-500/20 to-transparent border-2 border-emerald-500 p-6 text-center"
        >
          <p className="text-sm text-emerald-300 mb-2 uppercase tracking-widest font-bold">
            Dein Erfolg heute
          </p>
          <h2 className="text-4xl font-black text-emerald-400 mb-2">
            -{improvement} Punkte
          </h2>
          <p className="text-xs text-slate-400">
            Von {5} auf {5 - improvement} in 15 Minuten – das ist echte Veränderung!
          </p>
        </motion.div>
      )}

      {/* Integration Exercise */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6">
        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">
          Finale Integration
        </p>
        <h3 className="text-2xl font-black text-white mb-3">
          {integration.name}
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          {integration.instruction}
        </p>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-purple-400 font-semibold">Warum?</span> {integration.why}
          </p>
        </div>
      </div>

      {/* Audio Button */}
      <button
        onClick={handlePlayAudio}
        disabled={isTTSLoading}
        className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-base transition-all active:scale-[0.98] ${
          isPlaying
            ? 'bg-purple-500/20 border-2 border-purple-400 text-purple-300'
            : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/30'
        }`}
      >
        {isTTSLoading
          ? <><Loader2 className="w-6 h-6 animate-spin" /> Wird geladen…</>
          : isPlaying
          ? <><VolumeX className="w-6 h-6" /> Stoppen</>
          : <><Volume2 className="w-6 h-6" /> Audio-Anleitung</>
        }
      </button>

      {/* Completion Button */}
      {!exerciseCompleted ? (
        <Button
          onClick={handleCompleteExercise}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-4 rounded-2xl"
        >
          Übung abgeschlossen
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-500 p-5 text-center">
            <motion.div
              animate={{ scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            </motion.div>
            <p className="text-base font-black text-emerald-400 mb-1">
              Neural Permission Granted! ✓
            </p>
            <p className="text-xs text-slate-400">
              Dein Nervensystem hat die neue Freiheit akzeptiert.
            </p>
          </div>

          <Button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-4 rounded-2xl"
          >
            {isSubmitting ? 'Speichern...' : 'Session abschließen 🎉'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}