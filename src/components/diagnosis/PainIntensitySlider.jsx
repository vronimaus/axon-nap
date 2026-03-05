import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function PainIntensitySlider({ onSubmit, loading, initialValue = 5 }) {
  const [intensity, setIntensity] = useState(initialValue);

  const getIntensityLabel = (value) => {
    if (value <= 3) return { text: 'Leicht', color: 'text-cyan-400', status: 'LOW' };
    if (value <= 6) return { text: 'Moderat', color: 'text-amber-400', status: 'MEDIUM' };
    return { text: 'Stark', color: 'text-red-400', status: 'HIGH' };
  };

  const label = getIntensityLabel(intensity);

  return (
    <div className="w-full space-y-6">
      {/* HUD Display */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          <p className="text-[10px] font-bold tracking-widest uppercase text-white">NRS Schmerz-Score</p>
          <span className={`ml-auto text-[9px] font-mono tracking-widest uppercase font-bold ${label.color}`}>{label.status}</span>
        </div>
        <div className="p-6 text-center">
          <motion.div
            key={intensity}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-7xl font-bold font-mono ${label.color} mb-1`}
          >
            {intensity}
          </motion.div>
          <p className={`text-sm font-bold tracking-widest uppercase font-mono ${label.color}`}>
            {label.text}
          </p>
        </div>
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={[intensity]}
          onValueChange={(value) => {
            requestAnimationFrame(() => setIntensity(value[0]));
          }}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500 tracking-widest uppercase">
          <span>1 – Minimal</span>
          <span>10 – Maximal</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={() => onSubmit(intensity)}
        disabled={loading}
        className="w-full h-12 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold tracking-widest uppercase text-sm"
      >
        Weiter
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}