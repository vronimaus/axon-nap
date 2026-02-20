import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
const ExerciseCoachingPanel = React.lazy(() => import('./ExerciseCoachingPanel'));

export default function ExerciseCard({ exercise, idx, readinessStatus, rehabPlan, queryClient, onFeedbackSubmit }) {
  const [expanded, setExpanded] = useState(false);

  const isStrengthExercise = exercise.category && ['strength', 'functional'].includes(exercise.category.toLowerCase());
  const shouldShowWarning = readinessStatus === 'yellow' && isStrengthExercise;

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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
            shouldShowWarning ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-white text-base leading-tight">{exercise.name}</h4>
              {shouldShowWarning && (
                <span className="text-yellow-400 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Reduzieren
                </span>
              )}
            </div>
            {/* Specs row */}
            <div className="flex flex-wrap gap-2 mt-2">
              {exercise.sets_reps_tempo && (
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1">
                  {shouldShowWarning ? `${exercise.sets_reps_tempo} → −50%` : exercise.sets_reps_tempo}
                </span>
              )}
              {exercise.category && (
                <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg px-2 py-1 capitalize">
                  {exercise.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOCK 2: Anleitung (immer sichtbar, kompakt) ── */}
      <div className="px-4 pb-3">
        {/* AXON-Moment – immer sichtbar */}
        {exercise.axon_moment && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 mb-3">
            <p className="text-xs font-semibold text-cyan-400 mb-1">⚡ AXON-Moment</p>
            <p className="text-sm text-slate-300 leading-snug">{exercise.axon_moment}</p>
          </div>
        )}

        {/* Kurzanleitung: max 3 Stichpunkte aus der Beschreibung */}
        {(exercise.description || exercise.instruction) && (
          <div className="space-y-1">
            {(exercise.description || exercise.instruction)
              .split('\n')
              .filter(l => l.trim())
              .slice(0, 3)
              .map((line, i) => (
                <p key={i} className="text-sm text-slate-400 flex gap-2">
                  <span className="text-orange-400 font-semibold flex-shrink-0">{i + 1}.</span>
                  <span className="leading-snug">{line.replace(/^\d+\.\s*/, '').trim()}</span>
                </p>
              ))}
          </div>
        )}

        {/* "Mehr anzeigen" Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Weniger anzeigen' : 'Details & Coaching'}
        </button>
      </div>

      {/* ── BLOCK 3 (expanded): Details & Coaching Panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/60 bg-slate-800/20"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Goal */}
              {(exercise.goal_explanation || exercise.purpose_explanation) && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs font-semibold text-orange-400 mb-1">🎯 Worum geht's?</p>
                  <p className="text-sm text-slate-300 leading-snug">{exercise.goal_explanation || exercise.purpose_explanation}</p>
                </div>
              )}

              {/* Full instructions (rest of lines) */}
              {(exercise.description || exercise.instruction) && (() => {
                const lines = (exercise.description || exercise.instruction).split('\n').filter(l => l.trim());
                const rest = lines.slice(3);
                return rest.length > 0 ? (
                  <div className="space-y-1">
                    {rest.map((line, i) => (
                      <p key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="text-orange-400 font-semibold flex-shrink-0">{i + 4}.</span>
                        <span className="leading-snug">{line.replace(/^\d+\.\s*/, '').trim()}</span>
                      </p>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Cues */}
              {exercise.cues?.length > 0 && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-400 mb-2">💡 Ausführungs-Tipps</p>
                  <ul className="space-y-1">
                    {exercise.cues.map((cue, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-purple-400">•</span>
                        <span className="leading-snug">{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {exercise.benefits && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-xs font-semibold text-green-400 mb-1">✨ Das bringt's dir</p>
                  <p className="text-sm text-slate-300 leading-snug">{exercise.benefits}</p>
                </div>
              )}

              {/* Breathing */}
              {exercise.breathing_instruction && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-400 mb-1">🫁 Atmung</p>
                  <p className="text-sm text-slate-300 leading-snug">{exercise.breathing_instruction}</p>
                </div>
              )}

              {/* Yellow Warning */}
              {shouldShowWarning && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Moderate Belastung empfohlen
                  </p>
                  <p className="text-sm text-slate-300 leading-snug">
                    Reduziere Intensität & Wiederholungen um 30–50%. Höre auf deinen Körper.
                  </p>
                </div>
              )}

              {/* AI Coaching Panel */}
              <React.Suspense fallback={<div className="text-slate-400 text-sm">Lädt Coaching-Panel...</div>}>
                <ExerciseCoachingPanel
                  exercise={exercise}
                  rehabPlan={rehabPlan}
                  feedbackHistory={(rehabPlan?.feedback_history || []).filter(f => f.exercise_id === exercise.exercise_id)}
                  onExerciseFeedback={onFeedbackSubmit}
                />
              </React.Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}