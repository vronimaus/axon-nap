import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function NeuralChargeBar({ charge }) {
  const isFull = charge >= 100;

  return (
    <motion.div
      className={`px-5 py-4 bg-gradient-to-r ${
        isFull
          ? 'from-emerald-900/40 to-cyan-900/40'
          : 'from-slate-900/80 to-slate-900/60'
      } border-b border-emerald-500/20`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Zap className={`w-5 h-5 ${isFull ? 'text-emerald-400' : 'text-yellow-500'}`} />
          </motion.div>
          <span className="text-xs font-black uppercase tracking-[0.15em] text-emerald-400">
            Neural Charge
          </span>
        </div>
        <span className={`text-lg font-black ${isFull ? 'text-emerald-400' : 'text-slate-300'}`}>
          {charge}%
        </span>
      </div>

      {/* Progress Bar - Enhanced */}
      <div className={`h-3 w-full bg-slate-800 rounded-full overflow-hidden relative border border-slate-700 ${isFull ? 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' : ''}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${charge}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${
            isFull
              ? 'from-emerald-500 via-cyan-400 to-blue-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]'
              : 'from-yellow-500 via-emerald-500 to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
          } relative`}
        >
          {isFull && (
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          )}
        </motion.div>
      </div>

      {/* Milestones */}
      {isFull && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
        >
          <p className="text-sm font-black text-emerald-300 uppercase tracking-[0.1em]">
            ⚡ NEURAL PERMISSION GRANTED ⚡
          </p>
          <p className="text-[10px] text-emerald-400 mt-1">
            Volle neuronale Aktivierung erreicht!
          </p>
        </motion.div>
      )}

      {/* Progress Indicator Dots */}
      <div className="flex justify-between items-center mt-3">
        {[20, 40, 60, 80, 100].map((milestone) => (
          <motion.div
            key={milestone}
            initial={false}
            animate={{
              scale: charge >= milestone ? [1, 1.3, 1] : 1,
              opacity: charge >= milestone ? 1 : 0.3,
            }}
            transition={{ duration: 0.5 }}
            className={`w-2 h-2 rounded-full ${charge >= milestone ? 'bg-emerald-400' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    </motion.div>
  );
}