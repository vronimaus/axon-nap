import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2, Check } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';

export default function NeuroDrillScreen({ onComplete }) {
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
    onComplete(2, { neuroDrillsCompleted: true });
  };

  const currentDrill = drillSequence[drillStep];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Description */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-300 text-sm leading-relaxed">
          Audio-geführte Neuro-Drills für dein Zentrales Nervensystem. <span className="text-cyan-400 font-semibold">Höre zu und spüre</span> – führe die Bewegungen in deiner Umgebung aus.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {drillSequence.map((_, idx) => (
          <motion.div
            key={idx}
            className={`h-1 flex-1 rounded-full transition-colors ${
              idx <= drillStep ? 'bg-cyan-500' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Current Drill */}
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
        <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">
          Drill {drillStep + 1} von {drillSequence.length}
        </p>
        <h3 className="text-2xl font-black text-white mb-3">
          {currentDrill.name}
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          {currentDrill.instruction}
        </p>
        <p className="text-xs text-slate-500 font-mono">
          Dauer: {currentDrill.duration}
        </p>
      </div>

      {/* Audio Button */}
      <button
        onClick={handlePlayAudio}
        disabled={isTTSLoading}
        className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-base transition-all active:scale-[0.98] ${
          isPlaying
            ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300'
            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/30'
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
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-4 rounded-2xl"
        >
          {drillStep < drillSequence.length - 1 ? 'Nächster Drill →' : 'Alle Drills abgeschlossen'}
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleComplete}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Software aktualisiert →
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}