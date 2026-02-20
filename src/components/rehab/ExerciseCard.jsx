import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, Zap, Timer, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OuchInterventionModal from './OuchInterventionModal';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
const ExerciseCoachingPanel = React.lazy(() => import('./ExerciseCoachingPanel'));

export default function ExerciseCard({ exercise, idx, readinessStatus, rehabPlan, queryClient, onFeedbackSubmit }) {
  const [expanded, setExpanded] = useState(false);
  const [isOuchModalOpen, setIsOuchModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handlePerformanceBoost = async () => {
    setIsUpgrading(true);
    try {
      const { data } = await base44.functions.invoke('performanceBoost', {
        rehabPlanId: rehabPlan.id,
        exerciseId: exercise.exercise_id,
        currentPhaseIndex: (rehabPlan.current_phase || 1) - 1
      });
      if (data.blocked) {
        toast.error(data.reason || 'Upgrade nicht möglich');
      } else if (data.success) {
        toast.success(data.message || '🚀 Übung upgraded!', { duration: 5000 });
        if (queryClient) queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
      }
    } catch (error) {
      toast.error('Fehler beim Upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  const isStrengthExercise = exercise.category && ['strength', 'functional'].includes(exercise.category.toLowerCase());
  const shouldShowWarning = readinessStatus === 'yellow' && isStrengthExercise;

  // Parse instruction lines into bullet points
  const instructionLines = (exercise.description || exercise.instruction || '')
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l.length > 0);

  // Parse sets/reps/tempo from string like "3x10 @ 3s" into parts
  const specsRaw = exercise.sets_reps_tempo || '';
  const specsDisplay = shouldShowWarning ? `${specsRaw} → −50%` : specsRaw;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="glass rounded-2xl border border-slate-700 overflow-hidden flex flex-col"
    >
      {/* ── BLOCK 1: Nummer + Titel + Specs ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 ${
            shouldShowWarning ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h4 className="font-bold text-white text-base leading-tight">{exercise.name}</h4>
              {shouldShowWarning && (
                <span className="text-yellow-400 text-xs flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Reduzieren
                </span>
              )}
              {exercise.category && (
                <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 capitalize">
                  {exercise.category}
                </span>
              )}
            </div>

            {/* Specs Pills – Hard Facts */}
            {specsDisplay && (
              <div className="flex flex-wrap gap-2">
                {/* Try to split "3 Sätze × 10 Wdh. @ 3s" */}
                {specsDisplay.split(/[×x@·|]/).map((part, i) => {
                  const icons = [
                    <RotateCcw key={0} className="w-3 h-3" />,
                    <Zap key={1} className="w-3 h-3" />,
                    <Timer key={2} className="w-3 h-3" />
                  ];
                  return (
                    <span key={i} className="flex items-center gap-1 text-xs font-semibold bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-2.5 py-1">
                      {icons[i] || null}
                      {part.trim()}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BLOCK 2: Anleitung (Bullets) + AXON-Moment ── */}
      <div className="px-4 pb-4 space-y-3">
        {/* Instruction Bullets – immer sichtbar (max 3) */}
        {instructionLines.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">So geht's:</p>
            <ul className="space-y-1.5">
              {instructionLines.slice(0, 3).map((line, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2 leading-snug">
                  <span className="text-orange-400 font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AXON-Moment – immer sichtbar */}
        {exercise.axon_moment && (
          <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-xl p-3">
            <p className="text-xs font-semibold text-cyan-400 mb-1">⚡ AXON-Moment</p>
            <p className="text-sm text-slate-300 leading-snug italic">{exercise.axon_moment}</p>
          </div>
        )}

        {/* "Details & Coaching" Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Weniger anzeigen' : 'Details & Coaching'}
        </button>
      </div>

      {/* ── BLOCK 3 (expanded): Vollständige Details ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/60 bg-slate-800/20"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Remaining instruction steps */}
              {instructionLines.length > 3 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Weiter:</p>
                  <ul className="space-y-1.5">
                    {instructionLines.slice(3).map((line, i) => (
                      <li key={i} className="text-sm text-slate-400 flex gap-2 leading-snug">
                        <span className="text-orange-400 font-bold flex-shrink-0">{i + 4}.</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Goal */}
              {(exercise.goal_explanation || exercise.purpose_explanation) && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs font-semibold text-orange-400 mb-1">🎯 Worum geht's?</p>
                  <p className="text-sm text-slate-300 leading-snug">{exercise.goal_explanation || exercise.purpose_explanation}</p>
                </div>
              )}

              {/* Cues */}
              {exercise.cues?.length > 0 && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-400 mb-2">💡 Ausführungs-Tipps</p>
                  <ul className="space-y-1">
                    {exercise.cues.map((cue, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2 leading-snug">
                        <span className="text-purple-400 flex-shrink-0">•</span>
                        <span>{cue}</span>
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