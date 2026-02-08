import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, Wrench, Brain, Dumbbell } from 'lucide-react';

export default function ExerciseActionCard({ 
  phases,
  onComplete,
  infoText
}) {
  const [expandedPhase, setExpandedPhase] = useState(null);

  const phaseIcons = {
    hardware: Wrench,
    software: Brain,
    integration: Dumbbell
  };

  const phaseColors = {
    hardware: { bg: 'from-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    software: { bg: 'from-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
    integration: { bg: 'from-green-500/20', border: 'border-green-500/30', text: 'text-green-400' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      <h2 className="text-xl font-bold text-amber-400 mb-4">Deine Performance-Übungen</h2>
      
      {phases.map((phase, idx) => {
        const Icon = phaseIcons[phase.type] || Dumbbell;
        const colors = phaseColors[phase.type] || phaseColors.integration;
        const isExpanded = expandedPhase === idx;

        return (
          <div
            key={idx}
            className={`glass rounded-xl border ${colors.border} bg-gradient-to-r ${colors.bg} to-transparent overflow-hidden`}
          >
            <button
              onClick={() => setExpandedPhase(isExpanded ? null : idx)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold ${colors.text}`}>{phase.title}</h3>
                  <p className="text-xs text-slate-400">{phase.duration || '10-15 Min'}</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-400"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-700/50"
                >
                  <div className="p-4 space-y-3">
                    {phase.exercises?.map((ex, exIdx) => (
                      <div key={exIdx} className="bg-white/5 rounded-lg p-3">
                        <p className="font-medium text-slate-200">{ex.name}</p>
                        {ex.sets_reps && (
                          <p className="text-xs text-slate-400 mt-1">{ex.sets_reps}</p>
                        )}
                        <p className="text-sm text-slate-400 mt-2">{ex.instruction}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {infoText && (
        <div className="glass rounded-xl p-4 border border-amber-500/30 mt-6">
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
            {infoText}
          </p>
        </div>
      )}

      {onComplete && (
        <Button
          onClick={onComplete}
          className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold mt-6"
        >
          Übungen geprüft - Trainingsplan erstellen?
        </Button>
      )}
    </motion.div>
  );
}