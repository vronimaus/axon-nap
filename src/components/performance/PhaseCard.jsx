import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap, CheckCircle2, Brain, Activity, Dumbbell, Sparkles, AlertTriangle, TrendingDown, Zap as ZapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrainingExerciseCard from './TrainingExerciseCard';

export default function PhaseCard({ phase, index, totalPhases, isCompleted, onComplete, onNext, onPrev, readinessStatus }) {
  // Accordion State: All closed by default
  const [openCardKey, setOpenCardKey] = React.useState(null);

  // Track completed exercises locally for immediate UI feedback
  const [completedExercises, setCompletedExercises] = React.useState({});

  // Initialize completed state from props
  React.useEffect(() => {
     if (phase.exercises) {
       const initialCompleted = {};
       phase.exercises.forEach((ex, idx) => {
         if (ex.completed) initialCompleted[`${ex.section}-${idx}`] = true; // This key logic might need to align with uniqueKey logic below
       });
       // Note: The uniqueKey generation logic in the render loop is slightly complex (combining section and index).
       // Simpler approach: Map exercises to a flat index or keep the section structure.
     }
  }, [phase.exercises]);

  // Group exercises by section
  const sections = useMemo(() => {
    if (!phase.exercises) return [];

    const groups = {
      neuro_primer: { label: 'Neuro-Primer', icon: Brain, exercises: [], color: 'text-cyan-400' },
      sling_activation: { label: 'Sling Activation', icon: Activity, exercises: [], color: 'text-cyan-400' },
      performance: { label: 'Performance', icon: Dumbbell, exercises: [], color: 'text-cyan-400' },
      resilience: { label: 'Resilience', icon: Sparkles, exercises: [], color: 'text-cyan-400' },
      other: { label: 'Andere Übungen', icon: Target, exercises: [], color: 'text-slate-400' }
    };

    phase.exercises.forEach((ex, globalIndex) => {
      if (groups[ex.section]) {
        groups[ex.section].exercises.push({ ...ex, globalIndex });
      } else {
        groups['other'].exercises.push({ ...ex, globalIndex });
      }
    });

    return Object.entries(groups)
      .filter(([_, group]) => group.exercises.length > 0)
      .map(([key, group]) => ({ key, ...group }));
  }, [phase.exercises]);

  // Unified "Tech" Look - Monochrome/Cyan
  const colors = { 
    bg: 'from-slate-800/50', 
    border: 'border-slate-700/50', 
    text: 'text-cyan-400', 
    icon: Target 
  };
  const PhaseIcon = colors.icon;

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Phase Info Card (Modern/Dark) */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 overflow-hidden shadow-2xl">
         {/* Tech Background Elements */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
         
         <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">
                   Mission {index + 1}
                </span>
                {isCompleted && <span className="text-[10px] text-green-400 font-bold tracking-wider">✓ COMPLETED</span>}
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">{phase.title}</h3>
              <p className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-2">
                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-cyan-400 text-xs border border-cyan-500/20">
                  ~ 45 Min. / Session
                </span>
              </p>
            </div>
            
            {/* Minimal Circular Progress or Icon */}
            <div className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800/50 flex items-center justify-center shadow-inner">
               <span className="text-sm font-bold text-slate-300">{index + 1}/{totalPhases}</span>
            </div>
         </div>
      </div>

      {/* Sections & Exercises */}
      <div className="space-y-8">
        {sections.map((section, secIdx) => (
          <div key={section.key} className="space-y-6">
            {/* Modern Section Header */}
            <div className="flex items-center gap-3 pl-1 mt-4">
               <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-400 flex items-center gap-2">
                  <section.icon className="w-3.5 h-3.5" />
                  {section.label}
               </h4>
               <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>

            {/* Horizontal Button Selector */}
            <div className="flex flex-wrap gap-2 px-1">
              {section.exercises.map((exercise, exIdx) => {
                const uniqueKey = `${section.key}-${exIdx}`;
                const isCompleted = completedExercises[uniqueKey] || exercise.completed;
                const isActive = openCardKey === uniqueKey;

                return (
                  <button
                    key={uniqueKey}
                    onClick={() => setOpenCardKey(isActive ? null : uniqueKey)}
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300
                      ${isActive 
                        ? 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-110 z-10' 
                        : isCompleted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400'}
                    `}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : exIdx + 1}
                  </button>
                );
              })}
            </div>

            {/* Active Exercise Detail View */}
            <div className="relative">
              {section.exercises.map((exercise, exIdx) => {
                const uniqueKey = `${section.key}-${exIdx}`;
                if (openCardKey !== uniqueKey) return null;

                return (
                  <motion.div
                    key={uniqueKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrainingExerciseCard
                      exercise={exercise}
                      idx={exIdx} 
                      isOpen={true}
                      onToggle={() => setOpenCardKey(null)}
                      onComplete={() => {
                         // Mark locally as completed
                         setCompletedExercises(prev => ({ ...prev, [uniqueKey]: true }));

                         // Auto-advance logic
                         const allSectionKeys = section.exercises.map((_, i) => `${section.key}-${i}`);
                         const currentLocalIdx = allSectionKeys.indexOf(uniqueKey);

                         // If there is a next exercise in this section, go to it
                         if (currentLocalIdx < allSectionKeys.length - 1) {
                            setTimeout(() => setOpenCardKey(allSectionKeys[currentLocalIdx + 1]), 800);
                         } else {
                            // If section finished, maybe try next section? 
                            // For now just close or stay. Let's close nicely.
                            setTimeout(() => setOpenCardKey(null), 800);
                         }
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 items-center sm:justify-between">
        {index > 0 ? (
          <Button variant="outline" onClick={onPrev} className="w-full sm:w-auto border-slate-700 text-slate-400 hover:text-white">
            ← Zurück
          </Button>
        ) : <div className="hidden sm:block" />}

        {!isCompleted ? (
          <Button
            onClick={onComplete}
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all px-8 py-6 text-lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Phase abschließen
          </Button>
        ) : index < totalPhases - 1 ? (
          <Button onClick={onNext} className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold px-8 py-6">
            Nächste Phase →
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}