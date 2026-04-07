import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlertCircle } from 'lucide-react';

const THREAT_LABELS = {
  1: { label: 'Flüssig', color: 'text-slate-300', bg: 'bg-slate-800/40', border: 'border-cyan-500/30' },
  2: { label: 'Gelöst', color: 'text-slate-300', bg: 'bg-slate-800/40', border: 'border-cyan-500/30' },
  3: { label: 'Neutral', color: 'text-slate-300', bg: 'bg-slate-800/40', border: 'border-cyan-500/30' },
  4: { label: 'Angespannt', color: 'text-slate-300', bg: 'bg-slate-800/40', border: 'border-cyan-500/30' },
  5: { label: 'Blockiert', color: 'text-slate-300', bg: 'bg-slate-800/40', border: 'border-cyan-500/30' }
};

export default function ThreatLevelScreen({ onComplete, isFirst, threat }) {
  const [threatLevel, setThreatLevel] = useState(threat || 3);

  const handleSubmit = () => {
    onComplete(isFirst ? 0 : 3, { threatLevel: Math.round(threatLevel) });
  };

  const label = THREAT_LABELS[Math.round(threatLevel)] || THREAT_LABELS[3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5 max-w-sm mx-auto w-full"
    >
      {/* Clear instruction */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/40 border border-cyan-500/30 rounded-xl p-4 space-y-2"
      >
        <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Vor dem Reset</p>
        <p className="text-slate-200 text-sm leading-relaxed">
          Stufe deinen aktuellen nervösen System-Status ein. Das ist deine Ausgangslage — danach machen wir den Reset und sehen gleich, wie sehr sich dein Körper verbessert.
        </p>
      </motion.div>

      {/* Visual Display */}
      <div className="flex flex-col items-center justify-center py-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
          className={`relative w-40 h-40 rounded-full border-4 flex items-center justify-center ${label.bg} ${label.border}`}
        >
          <motion.div
            className="text-center relative z-10"
          >
            <span className="text-7xl font-black text-white">
              {Math.round(threatLevel)}
            </span>
            <p className="text-sm font-black tracking-[0.15em] uppercase mt-3 text-slate-300">
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
           <span className="text-center">
             <div className="text-lg mb-1">1</div>
             <div>Flüssig</div>
           </span>
           <span className="text-center">
             <div className="text-lg mb-1">2</div>
             <div>Gelöst</div>
           </span>
           <span className="text-center">
             <div className="text-lg mb-1">3</div>
             <div>Neutral</div>
           </span>
           <span className="text-center">
             <div className="text-lg mb-1">4</div>
             <div>Angespannt</div>
           </span>
           <span className="text-center">
             <div className="text-lg mb-1">5</div>
             <div>Blockiert</div>
           </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-800/40 border border-cyan-500/30 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          Das ist deine <span className="text-cyan-400 font-semibold">Baseline</span> — danach Reset + Retest, um deine Verbesserung zu messen.
        </p>
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleSubmit}
          className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 font-bold py-3 rounded-xl text-sm active:scale-[0.96]"
        >
          Reset starten →
        </Button>
      </motion.div>
    </motion.div>
  );
}