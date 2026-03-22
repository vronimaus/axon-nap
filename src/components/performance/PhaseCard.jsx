import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, CheckCircle2, Brain, Activity, Dumbbell, AlertTriangle, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrainingExerciseCard from './TrainingExerciseCard';
import PhaseCompleteModal from './PhaseCompleteModal';

export default function PhaseCard({ phase, index, totalPhases, isCompleted, onComplete, onNext, onPrev, readinessStatus, goalDescription }) {
  const [openCardKey, setOpenCardKey] = React.useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [completedExercises, setCompletedExercises] = React.useState(() => {
    if (!phase.exercises) return {};
    const initial = {};
    phase.exercises.forEach((ex, idx) => {
      if (ex.completed) initial[`${ex.section || 'other'}-${idx}`] = true;
    });
    return initial;
  });

  // Group exercises by section — with smart fallback assignment
  const sections = useMemo(() => {
    if (!phase.exercises) return [];

    const groups = {
      neuro_primer:    { label: 'Neuro-Primer',     icon: Brain,     exercises: [], color: 'text-cyan-400',    accent: 'border-cyan-500/30 bg-cyan-500/5' },
      sling_activation:{ label: 'MFR / Sling Prep', icon: Activity,  exercises: [], color: 'text-purple-400',  accent: 'border-purple-500/30 bg-purple-500/5' },
      performance:     { label: 'Performance',       icon: Dumbbell,  exercises: [], color: 'text-blue-400',    accent: 'border-blue-500/30 bg-blue-500/5' },
      resilience:      { label: 'Resilience',        icon: Wind,      exercises: [], color: 'text-emerald-400', accent: 'border-emerald-500/30 bg-emerald-500/5' },
      other:           { label: 'Übungen',            icon: Target,    exercises: [], color: 'text-slate-400',   accent: 'border-slate-700 bg-slate-800/20' },
    };

    phase.exercises.forEach((ex, globalIndex) => {
      // Smart fallback: infer section from category/name if not set
      let section = ex.section;
      if (!section || !groups[section]) {
        const cat = (ex.category || '').toLowerCase();
        const name = (ex.name || '').toLowerCase();
        if (cat === 'neuro' || cat === 'breath' || name.includes('neuro') || name.includes('sakkaden') || name.includes('vestibular')) {
          section = 'neuro_primer';
        } else if (cat === 'mfr' || cat === 'mobility' || name.includes('mfr') || name.includes('release') || name.includes('mobilit')) {
          section = 'sling_activation';
        } else if (cat === 'resilience' || name.includes('atem') || name.includes('breath') || name.includes('cool')) {
          section = 'resilience';
        } else {
          section = 'performance';
        }
      }
      groups[section].exercises.push({ ...ex, globalIndex });
    });

    return Object.entries(groups)
      .filter(([_, group]) => group.exercises.length > 0)
      .map(([key, group]) => ({ key, ...group }));
  }, [phase.exercises]);

  // Readiness-based default level
  const defaultLevel = useMemo(() => {
    if (readinessStatus === 'red') return 'basic';
    if (readinessStatus === 'yellow') return 'basic';
    if (readinessStatus === 'green') return 'advanced';
    return 'standard';
  }, [readinessStatus]);

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
      className="space-y-10"
    >
      {/* Readiness Banner */}
      {readinessStatus && readinessStatus !== 'green' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
            readinessStatus === 'yellow'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'}`} />
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'}`}>
              {readinessStatus === 'yellow' ? 'Maintenance Mode – Basic Variante aktiv' : 'Low Battery – Basic Variante aktiv'}
            </p>
            <p className="text-xs text-slate-400">
              {readinessStatus === 'yellow'
                ? 'Dein System signalisiert erhöhten Pflegebedarf. Alle Übungen wurden auf die Basic-Variante umgestellt. Du kannst manuell wechseln.'
                : 'Rote Ampel. Heute liegt der Fokus auf Regeneration. Alle Übungen auf Basic gesetzt – hör auf deinen Körper.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Green Banner */}
      {readinessStatus === 'green' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border px-4 py-3 flex items-start gap-3 bg-emerald-500/10 border-emerald-500/30"
        >
          <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5 text-emerald-400">System Ready – Advanced Modus vorgeschlagen</p>
            <p className="text-xs text-slate-400">Dein System ist heute in Topform. Advanced-Variante voreingestellt – du kannst jederzeit anpassen.</p>
          </div>
        </motion.div>
      )}

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
            {/* Section Header */}
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${section.accent}`}>
               <section.icon className={`w-4 h-4 ${section.color} flex-shrink-0`} />
               <h4 className={`text-xs font-bold uppercase tracking-[0.15em] ${section.color} flex-1`}>
                  {section.label}
               </h4>
               <span className="text-[10px] text-slate-500 font-mono">{section.exercises.length} Übungen</span>
            </div>

            {/* Exercise Selector — pill buttons with truncated name */}
            <div className="flex flex-col gap-1.5 px-1">
              {section.exercises.map((exercise, exIdx) => {
                const uniqueKey = `${section.key}-${exIdx}`;
                const isExCompleted = completedExercises[uniqueKey] || exercise.completed;
                const isActive = openCardKey === uniqueKey;

                return (
                  <button
                    key={uniqueKey}
                    onClick={() => setOpenCardKey(isActive ? null : uniqueKey)}
                    className={`
                      flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200
                      ${isActive 
                        ? `border ${section.accent} ${section.color} shadow-sm` 
                        : isExCompleted 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-slate-800/60 text-slate-300 border border-slate-700/60 hover:border-slate-500 hover:text-white'}
                    `}
                  >
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isExCompleted ? 'bg-green-500/20 text-green-400' : isActive ? 'bg-white/10' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {isExCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : exIdx + 1}
                    </span>
                    <span className="flex-1 truncate">{exercise.name || `Übung ${exIdx + 1}`}</span>
                    {exercise.sets_reps_tempo && (
                      <span className="text-xs text-slate-500 flex-shrink-0 hidden sm:block">{exercise.sets_reps_tempo}</span>
                    )}
                    <span className={`text-xs transition-transform ${isActive ? 'rotate-180' : ''}`}>▾</span>
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
                      defaultLevel={defaultLevel}
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
            onClick={() => setShowCompleteModal(true)}
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

      {/* Phase Complete Modal */}
      <AnimatePresence>
        {showCompleteModal && (
          <PhaseCompleteModal
            phase={phase}
            phaseIndex={index}
            totalPhases={totalPhases}
            goalDescription={goalDescription || phase.title}
            isLastPhase={index === totalPhases - 1}
            onContinue={() => {
              setShowCompleteModal(false);
              onComplete();
              if (index < totalPhases - 1) onNext();
            }}
            onRepeatPhase={() => setShowCompleteModal(false)}
            onClose={() => setShowCompleteModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}