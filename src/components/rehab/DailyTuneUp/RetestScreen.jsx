import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, ChevronRight } from 'lucide-react';

const METRICS = [
  {
    key: 'movement',
    label: 'Bewegungsqualität',
    beforeScale: 4,
    options: [
      { val: 1, label: 'Sehr limitiert' },
      { val: 2, label: 'Limitiert' },
      { val: 3, label: 'Geht so' },
      { val: 4, label: 'Frei' },
    ],
  },
  {
    key: 'pain_rest',
    label: 'Schmerz in Ruhe',
    beforeScale: 8,
    options: [
      { val: 0, label: 'Kein Schmerz' },
      { val: 2, label: 'Leicht' },
      { val: 4, label: 'Deutlich' },
      { val: 6, label: 'Stark' },
      { val: 8, label: 'Sehr stark' },
    ],
  },
  {
    key: 'pain_move',
    label: 'Schmerz bei Belastung',
    beforeScale: 8,
    options: [
      { val: 0, label: 'Kein Schmerz' },
      { val: 2, label: 'Leicht' },
      { val: 4, label: 'Deutlich' },
      { val: 6, label: 'Stark' },
      { val: 8, label: 'Sehr stark' },
    ],
  },
];

function getBeforeValue(sfmaValues, key) {
  if (!sfmaValues) return null;
  if (key === 'movement') return sfmaValues.movement_level ?? null;
  if (key === 'pain_rest') return sfmaValues.pain_rest ?? null;
  if (key === 'pain_move') return sfmaValues.pain_move ?? null;
  return null;
}

function improvementText(before, after, key) {
  if (before === null || after === null) return null;
  // For pain: lower is better; for movement: higher is better
  const isPain = key === 'pain_rest' || key === 'pain_move';
  const delta = isPain ? before - after : after - before;
  if (delta > 0) return { label: `+${delta} besser`, color: 'text-emerald-400' };
  if (delta < 0) return { label: `${delta} schlechter`, color: 'text-red-400' };
  return { label: 'Unverändert', color: 'text-slate-400' };
}

export default function RetestScreen({ onComplete, screenId = 2, nodeId = 'N6', sfmaValues = null }) {
  const [step, setStep] = useState(0); // 0,1,2 = welche Metrik gerade abgefragt wird
  const [afterValues, setAfterValues] = useState({});

  const currentMetric = METRICS[step];
  const allDone = step >= METRICS.length;

  const handleSelect = (val) => {
    const updated = { ...afterValues, [currentMetric.key]: val };
    setAfterValues(updated);
    if (step < METRICS.length - 1) {
      setStep(step + 1);
    } else {
      setStep(METRICS.length); // alle done
    }
  };

  const handleComplete = () => {
    onComplete(screenId, { nodeId, sfmaValues, afterValues });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="w-full max-w-sm mx-auto px-4 space-y-5 max-h-[80vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-5 text-center">
        <h3 className="text-lg font-bold text-white">Wie fühlst du dich jetzt?</h3>
        {!allDone && (
          <p className="text-xs text-slate-400 mt-1">{step + 1} / {METRICS.length} — {currentMetric.label}</p>
        )}
      </div>

      {/* 3 Metriken Übersicht */}
      <div className="space-y-3">
        {METRICS.map((metric, idx) => {
          const beforeVal = getBeforeValue(sfmaValues, metric.key);
          const afterVal = afterValues[metric.key] ?? null;
          const imp = improvementText(beforeVal, afterVal, metric.key);
          const isActive = idx === step && !allDone;
          const isDone = afterVal !== null;

          return (
            <div
              key={metric.key}
              className={`rounded-xl border p-4 transition-all ${
                isActive
                  ? 'border-cyan-500/60 bg-cyan-500/10'
                  : isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-slate-700/40 bg-slate-900/40 opacity-50'
              }`}
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{metric.label}</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Vorher */}
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Vorher</p>
                  {beforeVal !== null ? (
                    <p className="text-3xl font-black text-red-400">{beforeVal}</p>
                  ) : (
                    <p className="text-xs text-red-400/50 italic">—</p>
                  )}
                </div>

                {/* Nachher */}
                <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-center">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Nachher</p>
                  {afterVal !== null ? (
                    <p className="text-3xl font-black text-cyan-400">{afterVal}</p>
                  ) : (
                    <p className="text-xs text-cyan-400/50 italic">—</p>
                  )}
                </div>
              </div>

              {/* Delta */}
              {imp && (
                <p className={`text-xs font-bold text-center mt-2 ${imp.color}`}>{imp.label}</p>
              )}

              {/* Buttons für aktive Metrik */}
              {isActive && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-2 mt-3"
                  >
                    {metric.options.map(opt => (
                      <motion.button
                        key={opt.val}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect(opt.val)}
                        className="py-2 px-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 hover:border-cyan-500/60 hover:bg-cyan-500/15 transition-all text-sm font-bold"
                      >
                        <div>{opt.val}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.label}</div>
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </div>

      {/* Gesamt-Delta + Weiter */}
      {allDone && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Button
            onClick={handleComplete}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
          >
            <span>Weiter</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}