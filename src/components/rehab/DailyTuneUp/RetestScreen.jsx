import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, ChevronRight } from 'lucide-react';

const METRICS = [
  {
    key: 'pain_level',
    label: 'Schmerzlevel (0-10)',
    question: 'Wie hoch ist dein Schmerz bei dieser Bewegung aktuell?',
    type: 'slider',
    min: 0,
    max: 10,
  },
  {
    key: 'rom_improvement',
    label: 'ROM-Verbesserung',
    question: 'Kommt dein Körper jetzt weiter in die Bewegung (Mobilität)?',
    type: 'select',
    options: [
      { val: 3, label: 'Deutlich weiter / flüssiger' },
      { val: 2, label: 'Etwas weiter' },
      { val: 1, label: 'Gleich geblieben' },
      { val: 0, label: 'Schlechter / blockierter' },
    ],
  },
  {
    key: 'movement_quality',
    label: 'Bewegungsqualität',
    question: 'Wie stabil fühlte sich die Bewegung an?',
    type: 'select',
    options: [
      { val: 3, label: 'Perfekt & stabil (volle Kontrolle)' },
      { val: 2, label: 'Teilweise instabil (leichtes Ausweichen / Wackeln)' },
      { val: 1, label: 'Sehr instabil / Nicht möglich' },
    ],
  },
];

// FMS-based Neural Permission Evaluation
export function evaluateNeuralPermission(results) {
  const { pain_level, rom_improvement, movement_quality } = results;

  // FMS-Regel: Jeglicher Schmerz = sofortiger Abbruch (Score 0)
  const hasPain = pain_level > 0;

  // ROM muss sich verbessern (Score >= 2 ist akzeptabel)
  const noRomImprovement = rom_improvement <= 1;

  // FMS-Regel: Qualität Score 3 = voll funktional, Score 2 = Kompensation, Score 1 = blockiert
  const isUnstable = movement_quality <= 2;

  if (hasPain || noRomImprovement || isUnstable) {
    let reason = 'CLEAR';
    if (hasPain) reason = 'PAIN';
    else if (noRomImprovement) reason = 'NO_ROM';
    else if (isUnstable) reason = 'INSTABILITY';

    return {
      permissionGranted: false,
      reason,
      score: { pain_level, rom_improvement, movement_quality }
    };
  }

  return { permissionGranted: true, reason: 'CLEAR', score: { pain_level, rom_improvement, movement_quality } };
}

export default function RetestScreen({ onComplete, screenId = 2, nodeId = 'N6', sfmaValues = null }) {
  const [step, setStep] = useState(0);
  const [afterValues, setAfterValues] = useState({});

  const currentMetric = METRICS[step];
  const allDone = step >= METRICS.length;

  const handleSelect = (val) => {
    const updated = { ...afterValues, [currentMetric.key]: val };
    setAfterValues(updated);
    if (step < METRICS.length - 1) {
      setStep(step + 1);
    } else {
      setStep(METRICS.length);
    }
  };

  const handleComplete = () => {
    const evaluation = evaluateNeuralPermission(afterValues);
    onComplete(screenId, { 
      nodeId, 
      retestResults: afterValues, 
      neuralPermissionEvaluation: evaluation 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="w-full max-w-sm mx-auto px-4 space-y-5 max-h-[80vh] overflow-y-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 to-transparent p-5 text-center"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-1">Retest</p>
        <h3 className="text-xl font-black text-white">{currentMetric.question}</h3>
        {!allDone && (
          <p className="text-xs text-slate-400 mt-2">{step + 1} / {METRICS.length}</p>
        )}
      </motion.div>

      {/* Slider für Pain Level */}
      {!allDone && currentMetric.type === 'slider' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-cyan-500/30 p-6 space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">0 = Kein Schmerz</span>
            <span className="text-sm text-slate-400">10 = Stärkster Schmerz</span>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({ length: 11 }, (_, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSelect(i)}
                className={`w-10 h-10 rounded-lg font-bold transition-all ${
                  afterValues[currentMetric.key] === i
                    ? 'bg-cyan-500/40 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-cyan-500/50'
                }`}
              >
                {i}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Select für ROM / Quality */}
      {!allDone && currentMetric.type === 'select' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {currentMetric.options.map((opt) => (
            <motion.button
              key={opt.val}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelect(opt.val)}
              className={`w-full p-4 rounded-2xl glass border transition-all text-left ${
                afterValues[currentMetric.key] === opt.val
                  ? 'border-cyan-500/50 bg-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'border-slate-700/50 hover:border-cyan-500/30'
              }`}
            >
              <p className="font-bold text-white">{opt.label}</p>
              <p className="text-[10px] text-slate-400 mt-1">Score: {opt.val}</p>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Complete Button */}
      {allDone && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={handleComplete}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
          >
            <span>Auswertung</span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}