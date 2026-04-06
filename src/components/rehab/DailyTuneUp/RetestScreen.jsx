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

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Before */}
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 text-center">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">
            Vorher
          </p>
          <div className="text-3xl font-black text-orange-400">
            {threatBefore}
          </div>
          <p className="text-xs text-slate-500 mt-1">Blockiert</p>
        </div>

        {/* After */}
        <motion.div
          animate={{
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center"
        >
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
            Nachher
          </p>
          <div className="text-3xl font-black text-emerald-400">
            {Math.round(threatAfter)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Aktuell</p>
        </motion.div>
      </div>

      {/* Improvement Indicator */}
      {improvement > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 p-5"
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingDown className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            </motion.div>
            <div>
              <p className="text-base font-black text-emerald-400 mb-1">
                -{improvement} Punkte! 🎉
              </p>
              <p className="text-xs text-slate-300">
                {impactLabel}. Dein Nervensystem hat sich bemerkenswert schnell reorganisiert.
              </p>
            </div>
          </div>
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