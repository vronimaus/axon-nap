import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function NeuralChargeBar({ charge }) {
  return (
    <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Neural Charge
          </span>
        </div>
        <span className="text-sm font-black text-emerald-400">
          {charge}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${charge}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-yellow-500 via-emerald-500 to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
        />
      </div>

      {/* Milestones */}
      {charge >= 100 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2 text-center"
        >
          ✓ Volle neuronale Aktivierung erreicht!
        </motion.p>
      )}
    </div>
  );
}