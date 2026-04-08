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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 to-transparent p-5 text-center"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-1">Vergleich</p>
        <h3 className="text-xl font-black text-white">Wie fühlst du dich jetzt?</h3>
        {!allDone && (
          <p className="text-xs text-slate-400 mt-1">{step + 1} / {METRICS.length} — {currentMetric.label}</p>
        )}
      </motion.div>

      {/* 3 Metriken */}
      <div className="space-y-3">
        {METRICS.map((metric, idx) => {
          const beforeVal = getBeforeValue(sfmaValues, metric.key);
          const afterVal = afterValues[metric.key] ?? null;
          const imp = improvementText(beforeVal, afterVal, metric.key);
          const isActive = idx === step && !allDone;
          const isDone = afterVal !== null;

          return (
            <motion.div
              key={metric.key}
              layout
              className={`glass rounded-2xl border p-4 transition-all ${
                isActive
                  ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : isDone
                  ? 'border-emerald-500/30'
                  : 'border-slate-700/30 opacity-40'
              }`}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{metric.label}</p>

              {/* Vorher / Nachher */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Vorher</p>
                  {beforeVal !== null ? (
                    <p className="text-3xl font-black text-red-400">{beforeVal}</p>
                  ) : (
                    <p className="text-lg text-red-400/40">—</p>
                  )}
                </div>
                <div className={`rounded-xl border p-3 text-center transition-all ${
                  isDone
                    ? 'border-emerald-500/50 bg-emerald-500/15 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                    : 'border-cyan-500/30 bg-cyan-500/10'
                }`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDone ? 'text-emerald-400' : 'text-cyan-400'}`}>Nachher</p>
                  {afterVal !== null ? (
                    <p className={`text-3xl font-black ${isDone ? 'text-emerald-400' : 'text-cyan-400'}`}>{afterVal}</p>
                  ) : (
                    <p className="text-lg text-cyan-400/40">—</p>
                  )}
                </div>
              </div>

              {/* Delta Badge */}
              {imp && (
                <div className={`mt-2 text-center text-xs font-black px-3 py-1 rounded-full inline-block w-full ${
                  imp.color === 'text-emerald-400' ? 'bg-emerald-500/10 text-emerald-400' :
                  imp.color === 'text-red-400' ? 'bg-red-500/10 text-red-400' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {imp.label}
                </div>
              )}

              {/* Auswahl-Buttons für aktive Metrik */}
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
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleSelect(opt.val)}
                        className="py-2.5 px-3 rounded-xl glass border border-slate-600/60 text-slate-200 hover:border-cyan-500/60 hover:bg-cyan-500/15 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all text-sm font-bold"
                      >
                        <div className="text-lg font-black">{opt.val}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.label}</div>
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Weiter Button */}
      {allDone && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={handleComplete}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
          >
            <span>Weiter</span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}