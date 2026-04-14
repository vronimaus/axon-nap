import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SessionSummaryCard({ phase, readinessStatus, onStartSession }) {
  if (!phase?.exercises) return null;

  const exerciseCount = phase.exercises.length;
  const totalMinutes = phase.estimated_minutes || phase.exercises.length * 5;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Heute trainieren</p>
          <h3 className="text-lg font-bold text-white">{phase.title || 'Diese Phase'}</h3>
        </div>
        {readinessStatus === 'green' && (
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Zap className="w-4 h-4" />
          <span>{exerciseCount} Übung{exerciseCount > 1 ? 'en' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Clock className="w-4 h-4" />
          <span>~{totalMinutes} min</span>
        </div>
      </div>

      {phase.phase_rationale && (
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{phase.phase_rationale}</p>
      )}

      <Button
        onClick={onStartSession}
        className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
      >
        <Play className="w-4 h-4 mr-2" />
        Session starten
      </Button>
    </motion.div>
  );
}