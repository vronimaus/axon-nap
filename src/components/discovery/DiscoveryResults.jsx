import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

const LEVEL_CONFIG = {
  beginner: { label: 'Beginner', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/40' },
  intermediate: { label: 'Intermediate', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40' },
  advanced: { label: 'Advanced', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  elite: { label: 'Elite', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
};

const getLevel = (value, thresholds) => {
  if (value >= thresholds.elite) return 'elite';
  if (value >= thresholds.advanced) return 'advanced';
  if (value >= thresholds.intermediate) return 'intermediate';
  return 'beginner';
};

export default function DiscoveryResults({ tests, answers, onContinue }) {
  const results = tests.map(test => {
    const val = answers[test.id];
    const level = getLevel(val, test.thresholds);
    return { ...test, value: val, level };
  });

  const weakLinks = results.filter(r => r.level === 'beginner');
  const strengths = results.filter(r => r.level === 'advanced' || r.level === 'elite');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg w-full space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Baseline kalibriert</h1>
        <p className="text-slate-400 text-sm">AXON kennt jetzt dein Fundament. Jeder Trainingsplan wird darauf aufgebaut.</p>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((r, i) => {
          const cfg = LEVEL_CONFIG[r.level];
          const displayVal = r.unit === 'level' && r.labels ? r.labels[r.value] : `${r.value} ${r.metric_label}`;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-4 rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}
            >
              <span className="text-2xl w-8 text-center">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{r.name}</p>
                <p className="text-xs text-slate-400">{displayVal}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${cfg.border} ${cfg.bg} ${cfg.color} whitespace-nowrap`}>
                {cfg.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Insights */}
      {weakLinks.length > 0 && (
        <div className="glass rounded-xl border border-red-500/30 p-4 bg-gradient-to-r from-red-500/10 to-transparent">
          <p className="text-sm font-bold text-red-400 mb-2">⚠ Schwachstellen erkannt</p>
          <p className="text-xs text-slate-300">
            AXON wird <strong>{weakLinks.map(w => w.name).join(', ')}</strong> in deine Pläne integrieren, um diese Lücken zu schließen bevor sie zur Bremse werden.
          </p>
        </div>
      )}

      {strengths.length > 0 && (
        <div className="glass rounded-xl border border-green-500/30 p-4 bg-gradient-to-r from-green-500/10 to-transparent">
          <p className="text-sm font-bold text-green-400 mb-2">✓ Stärken erkannt</p>
          <p className="text-xs text-slate-300">
            <strong>{strengths.map(s => s.name).join(', ')}</strong> — solides Fundament. AXON wird hier direkt mit höherem Volumen ansetzen.
          </p>
        </div>
      )}

      <Button
        onClick={onContinue}
        className="w-full h-14 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-base"
      >
        Zum Dashboard <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  );
}