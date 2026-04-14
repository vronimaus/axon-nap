import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

export default function RehabPhaseSidebar({ phases = [], activePhaseIdx, currentPhaseNum, onSelectPhase }) {
  if (!phases.length) return null;

  return (
    <div className="hidden lg:flex flex-col gap-2 pb-6">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-2">Alle Phasen</h4>
      <div className="space-y-1">
        {phases.map((phase, idx) => {
          const isActive = idx === activePhaseIdx;
          const isCompleted = idx + 1 < currentPhaseNum;
          const isCurrent = idx + 1 === currentPhaseNum;

          return (
            <motion.button
              key={idx}
              onClick={() => onSelectPhase(idx)}
              whileHover={{ x: 4 }}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all
                ${isActive
                  ? 'bg-zinc-700 text-white border border-white/[0.1]'
                  : isCompleted
                  ? 'bg-zinc-800/50 text-zinc-500 border border-white/[0.04]'
                  : isCurrent
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'bg-zinc-800/30 text-zinc-600 border border-white/[0.04] hover:bg-zinc-800/50'}
              `}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-500" />
              ) : (
                <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${isCurrent ? 'border-cyan-500 bg-cyan-500/20' : 'border-zinc-600'}`} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-xs">{phase.title || `Phase ${idx + 1}`}</p>
              </div>
              {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}