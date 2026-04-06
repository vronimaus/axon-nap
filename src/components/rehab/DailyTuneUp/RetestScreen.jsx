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

export default function RetestScreen({ onComplete, threatBefore }) {
  const [threatAfter, setThreatAfter] = useState(threatBefore - 1);

  const improvement = threatBefore - threatAfter;
  const impactLabel = improvement <= 0 ? 'Kein Unterschied' : improvement <= 1 ? 'Kleine Verbesserung' : improvement <= 2 ? 'Deutliche Verbesserung' : 'Massive Verbesserung';
  const afterLabel = THREAT_LABELS[Math.round(threatAfter)] || THREAT_LABELS[3];

  const handleSubmit = () => {
    onComplete(3, { threatLevel: Math.round(threatAfter) });
  };

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
          Wie fühlt sich dein Körper <span className="text-emerald-400 font-semibold">jetzt</span> an, nach dem Reset und den Neuro-Drills?
        </p>
      </div>

      {/* Comparison - Large Impact */}
      <div className="grid grid-cols-2 gap-4">
        {/* Before - Red Zone */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-600/20 to-red-500/5 p-6 text-center shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <p className="text-[11px] font-black text-red-400 uppercase tracking-[0.15em] mb-3">
            🔴 Vorher
          </p>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl font-black text-red-500 mb-2"
          >
            {threatBefore}
          </motion.div>
          <p className="text-xs text-slate-400">Angespannt & Blockiert</p>
        </motion.div>

        {/* After - Blue Zone */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-6 text-center shadow-[0_0_30px_rgba(34,211,238,0.3)]"
        >
          <p className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.15em] mb-3">
            🟦 Nachher
          </p>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-5xl font-black text-cyan-400 mb-2"
          >
            {Math.round(threatAfter)}
          </motion.div>
          <p className="text-xs text-slate-400">Gelöst & Flüssig</p>
        </motion.div>
      </div>

      {/* Improvement Indicator - Strong Visual */}
      {improvement > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-3xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-blue-500/10 border-2 border-emerald-400/60 p-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-4xl"
            >
              ⚡
            </motion.span>
            <div className="text-left">
              <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                -{improvement} Punkte!
              </p>
              <p className="text-sm font-bold text-emerald-300">
                {impactLabel}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 text-center leading-relaxed">
            Dein Nervensystem hat sich <span className="text-cyan-400 font-bold">bemerkenswert schnell</span> reorganisiert. Das ist der AXON-Effekt.
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
      <Button
        onClick={handleSubmit}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Ergebnis speichern →
      </Button>
    </motion.div>
  );
}