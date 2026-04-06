import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlertCircle } from 'lucide-react';

const THREAT_LABELS = {
  1: { label: 'Flüssig', color: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/40', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]' },
  2: { label: 'Gelöst', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/40', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.4)]' },
  3: { label: 'Neutral', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-orange-500/10', border: 'border-yellow-500/40', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]' },
  4: { label: 'Angespannt', color: 'text-orange-500', bg: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/40', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]' },
  5: { label: 'Blockiert', color: 'text-red-500', bg: 'from-red-600/20 to-red-500/10', border: 'border-red-500/40', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' }
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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`relative w-48 h-48 rounded-full border-4 flex items-center justify-center mb-8 bg-gradient-to-br ${label.bg} ${label.border} ${label.glow}`}
        >
          {/* Pulsing ring */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className={`absolute inset-0 rounded-full border-2 ${label.border}`}
          />
          
          <motion.div
            animate={{
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="text-center relative z-10"
          >
            <span className={`text-7xl font-black ${label.color} transition-colors duration-300`}>
              {Math.round(threatLevel)}
            </span>
            <p className={`text-sm font-black tracking-[0.15em] uppercase mt-3 ${label.color}`}>
              {label.label}
            </p>
          </motion.div>
        </motion.div>

        {/* Slider with visual feedback */}
        <div className="w-full space-y-4">
          <div className="px-2">
            <Slider
              value={[threatLevel]}
              onValueChange={(v) => setThreatLevel(v[0])}
              min={1}
              max={5}
              step={0.5}
              className="py-6"
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>🟦 Flüssig</span>
            <span>🟩 Gelöst</span>
            <span>🟨 Neutral</span>
            <span>🟧 Angespannt</span>
            <span>🟥 Blockiert</span>
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