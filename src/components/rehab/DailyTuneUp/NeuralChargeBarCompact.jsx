import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function NeuralChargeBarCompact({ charge }) {
  const isFull = charge >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-[9998] px-4 py-2 rounded-full bg-slate-950/95 border border-cyan-500/30 backdrop-blur-sm flex items-center gap-2 shadow-lg shadow-cyan-500/10"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <Zap className={`w-4 h-4 ${isFull ? 'text-emerald-400' : 'text-cyan-400'}`} />
      </motion.div>

      {/* Compact progress bar */}
      <div className="h-1.5 w-20 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${charge}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${
            isFull
              ? 'from-emerald-500 to-cyan-400'
              : 'from-cyan-500 to-blue-500'
          }`}
        />
      </div>

      {/* Percentage */}
      <span className={`text-xs font-black w-7 text-right ${isFull ? 'text-emerald-400' : 'text-cyan-400'}`}>
        {charge}%
      </span>
    </motion.div>
  );
}