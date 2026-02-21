import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

export default function DiscoveryTest({ test, value, onChange }) {
  const isLevel = test.unit === 'level';
  const currentValue = value !== undefined ? value : (isLevel ? test.min : Math.round((test.min + test.max) / 2));

  const getThresholdLabel = (val) => {
    const t = test.thresholds;
    if (val >= t.elite) return { label: 'Elite', color: 'text-purple-400' };
    if (val >= t.advanced) return { label: 'Advanced', color: 'text-amber-400' };
    if (val >= t.intermediate) return { label: 'Intermediate', color: 'text-cyan-400' };
    return { label: 'Beginner', color: 'text-slate-400' };
  };

  const levelInfo = getThresholdLabel(currentValue);
  const displayValue = isLevel && test.labels ? test.labels[currentValue] : `${currentValue} ${test.metric_label}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl border border-amber-500/30 p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-4xl">{test.icon}</span>
        <div>
          <p className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-1">{test.name}</p>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">{test.question}</h2>
        </div>
      </div>

      {/* Hint */}
      {test.hint && (
        <div className="bg-slate-800/60 rounded-xl px-4 py-3 text-xs text-slate-400 border border-slate-700">
          💡 {test.hint}
        </div>
      )}

      {/* Value Display */}
      <div className="text-center py-4">
        <div className="text-5xl sm:text-6xl font-black text-white mb-2">
          {isLevel && test.labels ? currentValue : currentValue}
        </div>
        <div className="text-base text-slate-400 mb-1">{displayValue}</div>
        <div className={`text-sm font-bold ${levelInfo.color}`}>{levelInfo.label}</div>
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <Slider
          min={test.min}
          max={test.max}
          step={test.step || 1}
          value={[currentValue]}
          onValueChange={([val]) => onChange(val)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-600">
          <span>{test.min} {test.unit === 'level' ? '' : test.metric_label}</span>
          <span>{test.max} {test.unit === 'level' ? '' : test.metric_label}</span>
        </div>
      </div>

      {/* Level Scale */}
      <div className="grid grid-cols-4 gap-1 text-xs text-center">
        {['Beginner', 'Inter.', 'Advanced', 'Elite'].map((lvl, i) => {
          const thresholds = [0, test.thresholds.intermediate, test.thresholds.advanced, test.thresholds.elite];
          const isActive = currentValue >= thresholds[i] && (i === 3 || currentValue < thresholds[i + 1]);
          const colors = ['text-slate-500 border-slate-700', 'text-cyan-500 border-cyan-700', 'text-amber-500 border-amber-700', 'text-purple-500 border-purple-700'];
          return (
            <div key={lvl} className={`rounded-lg border py-1 px-1 transition-all ${colors[i]} ${isActive ? 'bg-slate-700/60' : 'opacity-40'}`}>
              {lvl}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}