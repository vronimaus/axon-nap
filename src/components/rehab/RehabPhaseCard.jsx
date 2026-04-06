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
        if (ex.category) {
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
        className="space-y-8"
      >
      {/* Phase Info Card (Modern/Dark) */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 overflow-hidden shadow-2xl">
         {/* Tech Background Elements - Green Theme */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
         
         <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">
                   Rehab Phase {index + 1}
                </span>
                {isCompleted && <span className="text-[10px] text-emerald-400 font-bold tracking-wider">✓ COMPLETED</span>}
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">{phase.title}</h3>
              {phase.duration_days && phase.duration_days !== 7 && phase.duration_days !== 14 && (
                <p className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-2 flex-wrap">
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-emerald-400 text-xs border border-emerald-500/20">
                    ~{phase.duration_days} Tage empfohlen
                  </span>
                </p>
              )}
            </div>
            
            {/* Minimal Circular Progress or Icon */}
            <div className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800/50 flex items-center justify-center shadow-inner">
               <span className="text-sm font-bold text-slate-300">{index + 1}/{totalPhases}</span>
            </div>
         </div>
      </div>

      {/* AXON Kausalitätskette */}
      <AxonJourneyCard phase={phase} />

      {/* Sections & Exercises */}
      <div className="space-y-12">
        {sections.map((section, secIdx) => (
          <div key={section.key} className="space-y-6">
            {/* Modern Section Header */}
            <div className="flex items-center gap-3 pl-1 mt-6">
               <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400 flex items-center gap-2">
                  <section.icon className="w-3.5 h-3.5" />
                  {section.label}
               </h4>
               <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
            </div>

            {/* Horizontal Button Selector */}
            <div className="flex flex-wrap gap-2 px-1">
              {section.exercises.map((exercise, exIdx) => {
                const uniqueKey = `${section.key}-${exIdx}`;
                const isExCompleted = completedExercises[uniqueKey] || exercise.completed;
                const canPlay = canPlayExercise(exercise.exercise_id, phases, hasAccess);
                const isLocked = !canPlay && !isExCompleted;

                const handleClick = () => {
                  if (isLocked) {
                    setLockedExerciseName(exercise.name || exercise.exercise_name || 'Übung');
                    return;
                  }
                  setModalExercise({ ...exercise, uniqueKey });
                };

                return (
                  <button
                    key={uniqueKey}
                    onClick={handleClick}
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 relative
                      ${isExCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isLocked
                          ? 'bg-slate-800/50 text-slate-600 border border-slate-700 opacity-50 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 active:scale-95'}
                    `}
                    disabled={isLocked}
                  >
                    {isExCompleted ? <CheckCircle2 className="w-5 h-5" /> : exIdx + 1}
                    {isLocked && <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20"><span className="text-[10px] font-bold text-slate-400">🔒</span></div>}
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
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-12 items-center sm:justify-between">
        {index > 0 ? (
          <Button variant="outline" onClick={onPrev} className="w-full sm:w-auto border-slate-700 text-slate-400 hover:text-white">
            ← Zurück
          </Button>
        ) : <div className="hidden sm:block" />}

        {!isCompleted ? (
          <div className="w-full sm:w-auto flex flex-col items-center gap-1">
            <Button
              onClick={onComplete}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all px-8 py-5 text-base"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Ich bin bereit für die nächste Phase ✓
            </Button>
            <p className="text-[10px] text-slate-500 text-center">Nur weiter, wenn du dich wirklich besser fühlst</p>
          </div>
        ) : index < totalPhases - 1 ? (
          <Button onClick={onNext} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-8 py-6">
            Nächste Phase →
          </Button>
        ) : null}
      </div>
    </motion.div>
    </>
  );
}