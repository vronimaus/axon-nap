import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap, CheckCircle2, Brain, Activity, Dumbbell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrainingExerciseCard from './TrainingExerciseCard';

export default function PhaseCard({ phase, index, totalPhases, isCompleted, onComplete, onNext, onPrev }) {
  // Accordion State: Default to the first exercise of the first section
  const [openCardKey, setOpenCardKey] = React.useState(`${phase.exercises?.[0]?.section || 'neuro_primer'}-0`);

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

    phase.exercises.forEach(ex => {
      if (groups[ex.section]) {
        groups[ex.section].exercises.push(ex);
      } else {
        groups['other'].exercises.push(ex);
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
          <div key={section.key} className="space-y-4">
            {/* Modern Section Header (Left Aligned) */}
            <div className="flex items-center gap-3 pl-1 mt-4">
               <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-400 flex items-center gap-2">
                  <section.icon className="w-3.5 h-3.5" />
                  {section.label}
               </h4>
               <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>
            
            <div className="grid gap-4">
              {section.exercises.map((exercise, exIdx) => {
                const uniqueKey = `${section.key}-${exIdx}`;
                return (
                  <TrainingExerciseCard
                    key={uniqueKey}
                    exercise={exercise}
                    idx={exIdx} 
                    isOpen={openCardKey === uniqueKey}
                    onToggle={() => setOpenCardKey(openCardKey === uniqueKey ? null : uniqueKey)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="flex gap-3 pt-4">
        {index > 0 && (
          <Button variant="outline" onClick={onPrev} className="border-slate-700 text-slate-400 hover:text-white">
            ← Zurück
          </Button>
        )}
        <div className="flex-1" />
        {!isCompleted ? (
          <Button
            onClick={onComplete}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Phase abschließen
          </Button>
        ) : index < totalPhases - 1 ? (
          <Button onClick={onNext} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold">
            Nächste Phase →
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}