import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';

export default function TrainingExerciseCard({ exercise, idx, onDetailClick }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="glass rounded-2xl border border-slate-700 overflow-hidden"
    >
      {/* ── BLOCK 1: Titel + Specs ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-base leading-tight">{exercise.name}</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {exercise.sets_reps_tempo && (
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1">
                  {exercise.sets_reps_tempo}
                </span>
              )}
              {exercise.category && (
                <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg px-2 py-1 capitalize">
                  {exercise.category}
                </span>
              )}
            </div>
          </div>
          {onDetailClick && (
            <button
              onClick={() => onDetailClick(exercise)}
              className="p-2 text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
              title="Details"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── BLOCK 2: Kurzanleitung ── */}
      <div className="px-4 pb-3">
        {/* AXON-Moment */}
        {exercise.axon_moment && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 mb-3">
            <p className="text-xs font-semibold text-cyan-400 mb-1">⚡ AXON-Moment</p>
            <p className="text-sm text-slate-300 leading-snug">{exercise.axon_moment}</p>
          </div>
        )}

        {/* Erste 3 Schritte */}
        {(exercise.instruction || exercise.description) && (
          <div className="space-y-1">
            {(exercise.instruction || exercise.description)
              .split('\n')
              .filter(l => l.trim())
              .slice(0, 3)
              .map((line, i) => (
                <p key={i} className="text-sm text-slate-400 flex gap-2">
                  <span className="text-amber-400 font-semibold flex-shrink-0">{i + 1}.</span>
                  <span className="leading-snug">{line.replace(/^\d+\.\s*/, '').trim()}</span>
                </p>
              ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Weniger' : 'Mehr Details'}
        </button>
      </div>

      {/* ── BLOCK 3 (expanded): Rest der Details ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/60 bg-slate-800/20"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Restliche Schritte */}
              {(exercise.instruction || exercise.description) && (() => {
                const lines = (exercise.instruction || exercise.description).split('\n').filter(l => l.trim());
                const rest = lines.slice(3);
                return rest.length > 0 ? (
                  <div className="space-y-1">
                    {rest.map((line, i) => (
                      <p key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="text-amber-400 font-semibold flex-shrink-0">{i + 4}.</span>
                        <span className="leading-snug">{line.replace(/^\d+\.\s*/, '').trim()}</span>
                      </p>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Notes */}
              {exercise.notes && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-400 mb-1">📝 Hinweise</p>
                  <p className="text-sm text-slate-300 leading-snug">{exercise.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}