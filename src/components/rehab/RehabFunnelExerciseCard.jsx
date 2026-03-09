import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RehabFunnelExerciseCard({ exercise, isFirstInCategory, onPlayClick }) {
  const [expanded, setExpanded] = useState(false);

  const isLocked = !isFirstInCategory;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border transition-all ${
        isLocked
          ? 'bg-slate-800/30 border-slate-700/50 opacity-60 cursor-not-allowed'
          : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/30 cursor-pointer'
      }`}
    >
      <button
        disabled={isLocked}
        onClick={() => !isLocked && setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className={`w-1.5 h-1.5 rounded-full ${isFirstInCategory ? 'bg-cyan-500/70' : 'bg-slate-600/30'}`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${isLocked ? 'text-slate-500' : 'text-slate-300'}`}>
              {exercise.name}
            </p>
            <p className={`text-xs ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
              {exercise.sets_reps_tempo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLocked && <Lock className="w-4 h-4 text-slate-500" />}
          {!isLocked && (
            <>
              {expanded && <ChevronDown className="w-4 h-4 text-slate-400" />}
              {!expanded && <ChevronDown className="w-4 h-4 text-slate-400 rotate-180" />}
            </>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && !isLocked && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-slate-700/50 px-4 py-3 space-y-3 bg-slate-900/30"
        >
          {exercise.instruction && (
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1">Ausführung:</p>
              <p className="text-xs text-slate-400 leading-relaxed">{exercise.instruction}</p>
            </div>
          )}
          {exercise.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1">Hinweise:</p>
              <p className="text-xs text-slate-400 leading-relaxed">{exercise.notes}</p>
            </div>
          )}
          <Button
            onClick={() => onPlayClick(exercise)}
            className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-xs font-semibold py-2 rounded-lg"
          >
            <Play className="w-3 h-3 mr-1" />
            Anleitung starten
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}