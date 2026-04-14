import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, CheckCircle2, Brain, Activity, Dumbbell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canPlayExercise } from './ExerciseAccessControl';
import ExerciseLockedPaywall from './ExerciseLockedPaywall';
import AxonJourneyCard from './AxonJourneyCard';
import ExerciseDetailModal from './ExerciseDetailModal';

export default function RehabPhaseCard({ phase, index, totalPhases, isCompleted, onComplete, onNext, onPrev, rehabPlanId, queryClient, onFeedbackSubmit, phases = [], hasAccess = true }) {
  const [lockedExerciseName, setLockedExerciseName] = useState(null);
  const [modalExercise, setModalExercise] = useState(null);

  // Track completed exercises locally for optimistic UI updates
  const [completedExercises, setCompletedExercises] = useState(() => {
    if (!phase.exercises) return {};
    const initial = {};
    phase.exercises.forEach((ex, idx) => {
      if (ex.completed) initial[`${phase.key || 'rehab'}-${idx}`] = true;
    });
    return initial;
  });

  // Build phase context object for causal explanations in modal
  const phaseContext = {
    nms_shift_explanation: phase.nms_shift_explanation,
    synergy_highlight: phase.synergy_highlight,
    hardware_scientific_mechanism: phase.hardware_scientific_mechanism,
    software_scientific_mechanism: phase.software_scientific_mechanism,
    strength_scientific_mechanism: phase.strength_scientific_mechanism,
  };

  // Group exercises by category (or just flatten if no useful categories)
  const sections = useMemo(() => {
    if (!phase.exercises) return [];

    // Rehab phases might not have the distinct sections like Performance plans.
    // We'll group by category if available, or just put everything in one "Therapie" section.
    
    const groups = {
        mfr: { label: 'Myofaszialer Release', icon: Activity, exercises: [] },
        neuro: { label: 'Neuro-Drills', icon: Brain, exercises: [] },
        breath: { label: 'Atemarbeit', icon: Zap, exercises: [] },
        mobility: { label: 'Mobilität', icon: Target, exercises: [] },
        strength: { label: 'Integration & Kraft', icon: Dumbbell, exercises: [] },
        other: { label: 'Übungen', icon: Sparkles, exercises: [] }
    };

    phase.exercises.forEach((ex, globalIndex) => {
        let cat = 'other';
        // Priority: nms_category > category > section
        if (ex.nms_category) {
            if (ex.nms_category === 'neural_calm' || ex.nms_category === 'neural_activate' || ex.nms_category === 'vagus' || ex.nms_category === 'visual') cat = 'neuro';
            else if (ex.nms_category === 'breath') cat = 'breath';
            else if (ex.nms_category === 'mobility') cat = 'mobility';
            else if (ex.nms_category === 'strength') cat = 'strength';
        } else if (ex.category) {
            if (ex.category === 'mfr') cat = 'mfr';
            else if (ex.category === 'neuro') cat = 'neuro';
            else if (ex.category === 'breath') cat = 'breath';
            else if (ex.category === 'mobility') cat = 'mobility';
            else if (ex.category === 'strength' || ex.category === 'functional') cat = 'strength';
            else if (['pull', 'push', 'squat', 'hinge', 'carry', 'core', 'plank', 'row', 'dip'].includes(ex.category)) cat = 'strength';
        } else if (ex.section) {
             if (ex.section === 'neuro_primer') cat = 'neuro';
             else if (ex.section === 'sling_activation') cat = 'mfr';
             else if (ex.section === 'performance') cat = 'strength';
             else if (ex.section === 'resilience') cat = 'mobility';
        }
        
        groups[cat].exercises.push({ ...ex, globalIndex });
    });

    return Object.entries(groups)
      .filter(([_, group]) => group.exercises.length > 0)
      .map(([key, group]) => ({ key, ...group }));
  }, [phase.exercises]);

  return (
    <>
      <AnimatePresence>
        {lockedExerciseName && (
          <ExerciseLockedPaywall
            exerciseName={lockedExerciseName}
            onClose={() => setLockedExerciseName(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        key={index}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
      {/* Phase Info Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/80 p-5">
         <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                   Phase {index + 1}
                </span>
                {isCompleted && (
                  <span className="text-[10px] text-zinc-400 font-bold tracking-wider border border-white/[0.06] px-1.5 py-0.5 rounded">
                    Abgeschlossen
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{phase.title}</h3>
              {(phase.estimated_minutes || phase.duration_days) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-white/[0.06] px-2 py-0.5 rounded">
                    {phase.estimated_minutes
                      ? phase.estimated_minutes >= 60
                        ? `${Math.floor(phase.estimated_minutes / 60)}h ${phase.estimated_minutes % 60 > 0 ? phase.estimated_minutes % 60 + ' Min' : ''}`.trim()
                        : `${phase.estimated_minutes} Min`
                      : `~${phase.duration_days * 10} Min`} · pro Session
                  </span>
                </div>
              )}
              {phase.phase_rationale && (
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">{phase.phase_rationale}</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl border border-white/[0.06] bg-zinc-800 flex items-center justify-center ml-4 flex-shrink-0">
               <span className="text-xs font-bold text-zinc-400">{index + 1}/{totalPhases}</span>
            </div>
         </div>
      </div>

      {/* AXON Kausalitätskette */}
      <AxonJourneyCard phase={phase} />

      {/* Sections & Exercises */}
      <div className="space-y-8">
        {sections.map((section, secIdx) => (
          <div key={section.key} className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-3">
               <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                  <section.icon className="w-3 h-3" />
                  {section.label}
               </h4>
               <div className="h-px flex-1 bg-white/[0.04]" />
            </div>

            {/* Exercise Cards */}
            <div className="space-y-2">
              {section.exercises.map((exercise, exIdx) => {
                const uniqueKey = `${section.key}-${exIdx}`;
                const isExCompleted = completedExercises[uniqueKey] || exercise.completed;
                const canPlay = canPlayExercise(exercise.exercise_id, phases, hasAccess);
                const isLocked = !canPlay && !isExCompleted;
                const exerciseName = exercise.name || exercise.exercise_name || `Übung ${exIdx + 1}`;

                const handleClick = () => {
                  if (isLocked) {
                    setLockedExerciseName(exerciseName);
                    return;
                  }
                  setModalExercise({ ...exercise, uniqueKey });
                };

                return (
                  <button
                    key={uniqueKey}
                    onClick={handleClick}
                    disabled={isLocked}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                      ${isExCompleted
                        ? 'bg-zinc-700/50 text-zinc-300 border-white/[0.1]'
                        : isLocked
                          ? 'bg-zinc-900/50 text-zinc-600 border-white/[0.04] opacity-50 cursor-not-allowed'
                          : 'bg-zinc-800/60 text-zinc-400 border-white/[0.06] hover:bg-zinc-800 hover:border-white/[0.12] hover:text-zinc-200 active:scale-95'}
                    `}
                  >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-zinc-700/50">
                      {isExCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <span className="text-xs font-bold text-zinc-500">{exIdx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{exerciseName}</p>
                    </div>
                    {isLocked && (
                      <span className="text-[9px] font-bold text-zinc-600">Blockiert</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={modalExercise}
        isOpen={!!modalExercise}
        onClose={() => setModalExercise(null)}
        rehabPlanId={rehabPlanId}
        queryClient={queryClient}
        phaseContext={phaseContext}
        onComplete={(data) => {
          const uniqueKey = modalExercise?.uniqueKey;
          if (uniqueKey) setCompletedExercises(prev => ({ ...prev, [uniqueKey]: true }));
          if (onFeedbackSubmit) onFeedbackSubmit({ exerciseId: data.exercise_id, metricValue: data.pain_level, notes: 'Completed via modal' });
          setModalExercise(null);
        }}
      />

      {/* Footer Navigation */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-8 items-center sm:justify-between border-t border-white/[0.04]">
        {index > 0 ? (
          <Button variant="ghost" onClick={onPrev} className="w-full sm:w-auto text-zinc-500 hover:text-zinc-300">
            Zurück
          </Button>
        ) : <div className="hidden sm:block" />}

        {!isCompleted ? (
          <div className="w-full sm:w-auto flex flex-col items-center gap-1">
            <Button
              onClick={onComplete}
              className="w-full sm:w-auto bg-zinc-200 hover:bg-white text-zinc-900 font-bold px-8 py-5 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Bereit für die nächste Phase
            </Button>
            <p className="text-[10px] text-zinc-600 text-center">Nur weiter, wenn du dich wirklich besser fühlst</p>
          </div>
        ) : index < totalPhases - 1 ? (
          <Button onClick={onNext} className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] text-white font-bold px-8">
            Nächste Phase
          </Button>
        ) : null}
      </div>
    </motion.div>
    </>
  );
}