import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlertCircle } from 'lucide-react';

const THREAT_LABELS = {
  1: { label: 'Entspannt', color: 'text-green-400' },
  2: { label: 'Locker', color: 'text-emerald-400' },
  3: { label: 'Normal', color: 'text-yellow-400' },
  4: { label: 'Angespannt', color: 'text-orange-400' },
  5: { label: 'Blockiert', color: 'text-red-500' }
};

export default function ThreatLevelScreen({ onComplete, isFirst, threat }) {
  const [threatLevel, setThreatLevel] = useState(threat || 3);

  const handleSubmit = () => {
    onComplete(isFirst ? 0 : 3, { threatLevel: Math.round(threatLevel) });
  };

  const label = THREAT_LABELS[Math.round(threatLevel)] || THREAT_LABELS[3];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {isFirst && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-300 text-sm leading-relaxed">
            Bewerte dein aktuelles Threat-Level: Wie blockiert oder angespannt fühlt sich dein Körper an?
          </p>
        </div>
      )}

      {/* Visual Display */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-32 h-32 rounded-full border-4 border-slate-700 flex items-center justify-center bg-slate-900/50 mb-6">
          <motion.div
            animate={{
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="text-center"
          >
            <span className={`text-5xl font-black ${label.color} transition-colors duration-300`}>
              {Math.round(threatLevel)}
            </span>
            <p className={`text-xs font-bold tracking-widest uppercase mt-2 ${label.color}`}>
              {label.label}
            </p>
          </motion.div>
        </div>

        {/* Slider */}
        <div className="w-full space-y-3">
          <Slider
            value={[threatLevel]}
            onValueChange={(v) => setThreatLevel(v[0])}
            min={1}
            max={5}
            step={0.5}
            className="py-4"
          />
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>Relaxed</span>
            <span className={label.color}>Blocked</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Das ist dein <span className="text-emerald-400 font-semibold">Baseline-Threat-Level</span>. Danach machen wir den Reset und testen sofort, wie sehr sich dein Körper verbessert hat.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-4 rounded-2xl text-base"
      >
        Bereit für den Reset →
      </Button>
    </motion.div>
  );
}