import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2, Check } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';

export default function NeuroDrillScreen({ onComplete, screenId = 1, nodeId = 'N6' }) {
  const [drillStep, setDrillStep] = useState(0);
  const [drillCompleted, setDrillCompleted] = useState(false);
  const { isPlaying, isLoading: isTTSLoading, playText, stop } = useTTS();

  const drillSequence = [
    {
      name: 'Horizontale Sakkaden',
      instruction: 'Fixiere einen Punkt 2 Meter vor dir auf Augenhöhe. Bewege deine Augen langsam nach links und rechts, ohne den Kopf zu bewegen. 10 Wiederholungen.',
      duration: '~2 Min'
    },
    {
      name: 'Vertikale Sakkaden',
      instruction: 'Gleiche Position. Bewege deine Augen jetzt nach oben und unten. Langsam und kontrolliert. 10 Wiederholungen.',
      duration: '~2 Min'
    },
    {
      name: 'Diagonale Sakkaden',
      instruction: 'Kombiniere horizontale und vertikale Bewegungen in diagonalen Mustern. 8 Wiederholungen pro Richtung.',
      duration: '~2 Min'
    }
  ];

  const handlePlayAudio = () => {
    if (isPlaying) {
      stop();
      return;
    }
    const drill = drillSequence[drillStep];
    const text = `${drill.name}. ${drill.instruction}. Lass dich Zeit und spüre, wie dein Nervensystem sich neu ausrichtet.`;
    playText(text);
  };

  const handleStepComplete = () => {
    if (drillStep < drillSequence.length - 1) {
      setDrillStep(drillStep + 1);
      playText(`Ausgezeichnet. ${drillSequence[drillStep + 1].name}. Bereit?`);
    } else {
      setDrillCompleted(true);
      playText('Alle Neuro-Drills abgeschlossen. Sehr gut gemacht!');
    }
  };

  const handleComplete = () => {
    onComplete(screenId, { nodeId, neuroDrillsCompleted: true });
  };

  const currentDrill = drillSequence[drillStep];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm mx-auto px-4 space-y-6"
    >
      {/* Description */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 to-transparent p-5"
      >
        <p className="text-slate-200 text-sm leading-relaxed font-medium">
          <span className="text-cyan-400 font-bold">Neuro-Drills</span> für dein ZNS
        </p>
      </motion.div>

      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {drillSequence.map((_, idx) => (
          <motion.div
            key={idx}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className={`h-1 flex-1 rounded-full transition-colors ${
              idx <= drillStep ? 'bg-cyan-500 shadow-lg shadow-cyan-500/40' : 'bg-slate-800'
            }`}
            style={{ transformOrigin: 'left' }}
          />
        ))}
      </div>

      {/* Current Drill */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 p-5"
      >
        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">
          Drill {drillStep + 1} / {drillSequence.length}
        </p>
        <h3 className="text-lg font-black text-white mb-2">
          {currentDrill.name}
        </h3>
        <p className="text-slate-300 text-xs leading-relaxed">
          {currentDrill.instruction}
        </p>
      </motion.div>

      {/* Audio Button */}
      <button
        onClick={handlePlayAudio}
        disabled={isTTSLoading}
        className={`w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${
          isPlaying
            ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300'
            : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/40'
        }`}
      >
        {isTTSLoading
          ? <><Loader2 className="w-6 h-6 animate-spin" /> Wird geladen…</>
          : isPlaying
          ? <><VolumeX className="w-6 h-6" /> Stoppen</>
          : <><Volume2 className="w-6 h-6" /> Audio-Anleitung</>
        }
      </button>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <motion.div
              key={i}
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
              className="w-1 h-6 bg-cyan-400 rounded-full"
            />
          ))}
          <span className="text-xs text-cyan-400 ml-2 font-medium">Coach führt dich…</span>
        </div>
      )}

      {/* Completion Button */}
      {!drillCompleted ? (
        <Button
          onClick={handleStepComplete}
          className="w-full h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-500/40 active:scale-95 transition-transform"
        >
          {drillStep < drillSequence.length - 1 ? 'Nächster →' : 'Fertig'}
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleComplete}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
          >
            <Check className="w-4 h-4" />
            Weiter →
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}