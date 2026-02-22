import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap, CheckCircle2, Brain, Activity, Dumbbell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrainingExerciseCard from './TrainingExerciseCard';

export default function PhaseCard({ phase, index, totalPhases, isCompleted, onComplete, onNext, onPrev, onExerciseClick }) {
  
  // Group exercises by section
  const sections = useMemo(() => {
    if (!phase.exercises) return [];
    
    const groups = {
      neuro_primer: { label: '1. Neuro-Primer', icon: Brain, exercises: [], color: 'text-cyan-400' },
      sling_activation: { label: '2. Sling Activation', icon: Activity, exercises: [], color: 'text-purple-400' },
      performance: { label: '3. Performance-Block', icon: Dumbbell, exercises: [], color: 'text-amber-400' },
      resilience: { label: '4. Resilience', icon: Sparkles, exercises: [], color: 'text-green-400' },
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

  const getPhaseColor = (idx) => {
    if (idx === 0) return { bg: 'from-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: Target };
    if (idx === 1) return { bg: 'from-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: TrendingUp };
    return { bg: 'from-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', icon: Zap };
  };

  const colors = getPhaseColor(index);
  const PhaseIcon = colors.icon;

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Phase Info Card (Minimal) */}
      <div className={`glass rounded-xl border ${colors.border} p-5 relative overflow-hidden`}>
         <div className={`absolute inset-0 bg-gradient-to-r ${colors.bg} to-transparent opacity-50`} />
         <div className="relative z-10 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900 border ${colors.border}`}>
              <PhaseIcon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>Phase {index + 1}</span>
                {isCompleted && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">Abgeschlossen</span>}
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">{phase.title}</h3>
            </div>
         </div>
      </div>

      {/* Sections & Exercises */}
      <div className="space-y-6">
        {sections.map((section, secIdx) => (
          <div key={section.key} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <section.icon className={`w-4 h-4 ${section.color}`} />
              <h4 className={`text-sm font-bold ${section.color}`}>{section.label}</h4>
            </div>
            
            <div className="space-y-3">
              {section.exercises.map((exercise, exIdx) => (
                <TrainingExerciseCard
                  key={`${section.key}-${exIdx}`}
                  exercise={exercise}
                  idx={exIdx} // visual index within section
                  onDetailClick={onExerciseClick}
                />
              ))}
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