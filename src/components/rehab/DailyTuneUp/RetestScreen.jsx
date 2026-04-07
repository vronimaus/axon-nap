import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TrendingDown, Sparkles } from 'lucide-react';

const THREAT_LABELS = {
  1: { label: 'Entspannt', color: 'text-green-400' },
  2: { label: 'Locker', color: 'text-emerald-400' },
  3: { label: 'Normal', color: 'text-yellow-400' },
  4: { label: 'Angespannt', color: 'text-orange-400' },
  5: { label: 'Blockiert', color: 'text-red-500' }
};

export default function RetestScreen({ onComplete, screenId = 2, threatBefore = 3 }) {
  const [threatAfter, setThreatAfter] = useState(threatBefore - 1);

  const improvement = threatBefore - threatAfter;
  const impactLabel = improvement <= 0 ? 'Kein Unterschied' : improvement <= 1 ? 'Kleine Verbesserung' : improvement <= 2 ? 'Deutliche Verbesserung' : 'Massive Verbesserung';
  const afterLabel = THREAT_LABELS[Math.round(threatAfter)] || THREAT_LABELS[3];

  const handleSubmit = () => {
    onComplete(screenId, { threatLevel: Math.round(threatAfter) });
  };

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
        className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 to-transparent p-5"
      >
        <p className="text-slate-200 text-sm leading-relaxed font-medium">
          Wie fühlst du dich <span className="text-purple-400 font-bold">jetzt</span>?
        </p>
      </motion.div>

      {/* Comparison - Large Impact */}
      <div className="grid grid-cols-2 gap-4">
        {/* Before */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-500/15 to-red-500/5 p-5 text-center"
        >
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
            Vorher
          </p>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl font-black text-red-500"
          >
            {threatBefore}
          </motion.div>
        </motion.div>

        {/* After */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 p-5 text-center shadow-lg shadow-cyan-500/30"
        >
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">
            Nachher
          </p>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-4xl font-black text-cyan-400"
          >
            {Math.round(threatAfter)}
          </motion.div>
        </motion.div>
      </div>

      {/* Improvement Indicator */}
      {improvement > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-2 border-emerald-400/50 p-5 shadow-lg shadow-emerald-500/30 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-3xl"
            >
              ⚡
            </motion.span>
            <p className="text-lg font-black text-emerald-400">
              -{improvement}
            </p>
          </div>
          <p className="text-xs text-emerald-300 font-medium">
            {impactLabel}
          </p>
        </motion.div>
      )}

      {/* Slider for Fine-tuning */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Feinabstimmung
        </p>
        <Slider
          value={[threatAfter]}
          onValueChange={(v) => setThreatAfter(v[0])}
          min={1}
          max={5}
          step={0.5}
          className="py-4"
        />
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>Relaxed</span>
          <span className={afterLabel.color}>{afterLabel.label}</span>
        </div>
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleSubmit}
          className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
        >
          <Sparkles className="w-4 h-4" />
          Weiter →
        </Button>
      </motion.div>
    </motion.div>
  );
}