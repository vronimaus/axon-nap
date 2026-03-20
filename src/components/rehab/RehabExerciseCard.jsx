import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Brain, Check, Edit2, Play, Settings2, AlertCircle, Zap, Activity, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import OuchInterventionModal from './OuchInterventionModal';
import { canPlayExercise } from './ExerciseAccessControl';
import ExerciseLockedPaywall from './ExerciseLockedPaywall';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EditableNumber = ({ value, label, onChange, unit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-16 bg-slate-800 text-center text-3xl font-bold text-white rounded border border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ) : (
          <div className="flex items-start">
            <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
            <Edit2 className="w-3 h-3 text-slate-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
        {label} {unit && <span className="text-slate-600">({unit})</span>}
      </span>
    </div>
  );
};

export default function RehabExerciseCard({ exercise, idx, isOpen, onToggle, onComplete, rehabPlanId, queryClient, phases = [], hasAccess = true }) {
  // Props fallback
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = isOpen !== undefined ? isOpen : localExpanded;
  const toggle = onToggle || (() => setLocalExpanded(!localExpanded));
  
  // Check if exercise is locked
  const canPlay = canPlayExercise(exercise.exercise_id, phases, hasAccess);
  const [showPaywall, setShowPaywall] = useState(false);

  // Exercise Data State
  const [fullExercise, setFullExercise] = useState(exercise);
  
  // Protocol State
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  
  // UI State
  const [showDetails, setShowDetails] = useState(false); // Collapsible details
  const [isFinishing, setIsFinishing] = useState(false); // Pain check mode
  const [painLevel, setPainLevel] = useState(0); // 0-10 NRS
  const [isCompleted, setIsCompleted] = useState(exercise.completed || false);
  
  // Intervention State
  const [isOuchModalOpen, setIsOuchModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Parse initial data
  useEffect(() => {
    if (exercise.exercise_id) {
      base44.entities.Exercise.filter({ exercise_id: exercise.exercise_id })
        .then(results => {
          if (results?.length > 0) {
            const dbEx = results[0];
            setFullExercise(prev => ({
              ...prev,
              ...dbEx,
              sets_reps_tempo: exercise.sets_reps_tempo || dbEx.sets_reps_tempo,
              instruction: dbEx.description || dbEx.instruction || exercise.instruction,
            }));
            
            // Try to parse sets/reps
            const specs = exercise.sets_reps_tempo || dbEx.sets_reps_tempo || "3x10";
            const setMatch = specs.match(/(\d+)\s*[xX]/);
            const repMatch = specs.match(/[xX]\s*(\d+)/);
            if (setMatch) setSets(parseInt(setMatch[1]));
            if (repMatch) setReps(parseInt(repMatch[1]));
          }
        })
        .catch(() => {});
    }
  }, [exercise.exercise_id]);

  const handleFinishClick = (e) => {
    e.stopPropagation();
    setIsFinishing(true);
  };

  const confirmFinish = () => {
    setIsCompleted(true);
    setIsFinishing(false);
    
    let message = 'Übung abgeschlossen!';
    if (painLevel > 5) message += ' ⚠️ Schmerz notiert.';
    else if (painLevel > 0) message += ' 👍';
    else message += ' 🔥 Stark!';
    
    toast.success(message);
    
    if (onComplete) {
      onComplete({
        ...exercise,
        completed: true,
        actual_sets: sets,
        actual_reps: reps,
        pain_level: painLevel
      });
    }
  };

  const handleBoost = async () => {
    if (!fullExercise.next_progression_id) {
      toast.info('Kein Upgrade-Pfad definiert.');
      return;
    }
    setIsUpgrading(true);
    try {
      const { data } = await base44.functions.invoke('performanceBoost', {
        rehabPlanId: rehabPlanId,
        exerciseId: fullExercise.exercise_id,
        currentPhaseIndex: 0 // Simplification, would need actual phase index
      });
      if (data?.blocked) toast.error(data.reason || 'Upgrade nicht möglich');
      else if (data?.success) {
        toast.success(data.message || '🚀 Übung upgraded!', { duration: 5000 });
        if (queryClient) queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
      }
    } catch { toast.error('Fehler beim Upgrade'); }
    finally { setIsUpgrading(false); }
  };

  // Hidden state handled by parent or return null if forced
  if (!isExpanded) return null;

  // If locked and not completed, show paywall instead
  if (!canPlay && !isCompleted) {
    return (
      <>
        <AnimatePresence>
          {showPaywall && (
            <ExerciseLockedPaywall
              exerciseName={fullExercise.name || exercise.name || 'Übung'}
              onClose={() => setShowPaywall(false)}
            />
          )}
        </AnimatePresence>
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative opacity-50"
        >
          <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-start justify-between">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-500 uppercase tracking-tight leading-none mb-1">
                {fullExercise.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-800 text-slate-600 px-1.5 py-0.5 rounded border border-slate-700">
                  {fullExercise.category || 'Rehab'}
                </span>
              </div>
            </div>
            <Lock className="w-5 h-5 text-slate-600" />
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Lock className="w-12 h-12 text-slate-600" />
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">Diese Übung ist gesperrt</p>
              <p className="text-slate-500 text-xs">Schließe zuerst die erste Übung dieser Kategorie ab</p>
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="mt-4 px-6 py-2 bg-amber-500/20 text-amber-400 text-sm font-bold rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              Alle freischalten
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  // Full "One-Page" View for Open State
  return (
    <>
      <AnimatePresence>
        {showPaywall && (
          <ExerciseLockedPaywall
            exerciseName={fullExercise.name || exercise.name || 'Übung'}
            onClose={() => setShowPaywall(false)}
          />
        )}
      </AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-950 rounded-2xl border border-emerald-500/30 overflow-hidden shadow-2xl relative"
      >
      {/* 1. Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-start justify-between">
         <div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1 shadow-emerald-glow">
              {fullExercise.name}
            </h3>
            <div className="flex items-center gap-2">
               <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                 {fullExercise.category || 'Rehab'}
               </span>
               {fullExercise.stecco_chain && (
                 <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900">
                   {fullExercise.stecco_chain}
                 </span>
               )}
            </div>
         </div>
         {/* Status Indicator */}
         <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
           isCompleted 
             ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
             : 'bg-slate-800 text-slate-500 border-slate-700'
         }`}>
           {isCompleted ? 'Completed' : 'Active'}
         </div>
      </div>

      {/* 2. Content Area */}
      <div className="p-5 space-y-6">
         
         {/* Collapsible Detail Toggle */}
         <div>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70 hover:bg-emerald-950/40 transition-all duration-200 group mb-2"
            >
               <span className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                 <Settings2 className="w-4 h-4" />
                 Setup & Ausführung (Klick für Anleitung)
               </span>
               <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
               {showDetails && (
                 <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden"
                 >
                    <div className="pt-2 pb-4 space-y-4">
                       {/* Hero: AXON Moment */}
                       {fullExercise.axon_moment && (
                         <div className="relative overflow-hidden rounded-xl border border-emerald-500/50 bg-emerald-950/10 p-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                            <div className="flex items-start gap-3 relative z-10">
                               <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                  <Brain className="w-5 h-5 text-emerald-400" />
                               </div>
                               <div>
                                  <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">AXON Moment</h5>
                                  <p className="text-sm font-medium text-emerald-100 italic leading-relaxed">
                                    "{fullExercise.axon_moment}"
                                  </p>
                               </div>
                            </div>
                         </div>
                       )}

                       {/* Setup / Instructions */}
                       <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ausführung</h5>
                          <div className="text-sm text-slate-300 leading-relaxed pl-1 prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-strong:text-emerald-300 prose-ul:pl-4">
                             <ReactMarkdown>{fullExercise.instruction || fullExercise.description || ''}</ReactMarkdown>
                          </div>
                          {fullExercise.cues && fullExercise.cues.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-800">
                               <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pro-Cues</h5>
                               <ul className="list-disc list-outside ml-4 space-y-1">
                                  {fullExercise.cues.map((cue, i) => (
                                    <li key={i} className="text-xs text-slate-400">{cue}</li>
                                  ))}
                               </ul>
                            </div>
                          )}
                       </div>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* 3. Smart Protocol */}
         <div className="relative">
            {/* Vibe Check Overlay (After finishing) */}
            <AnimatePresence>
              {isFinishing && (
                <motion.div 
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-500/30"
                >
                   <h4 className="text-lg font-bold text-white mb-6">Schmerzlevel während der Übung?</h4>
                   <div className="w-full max-w-[80%] space-y-6">
                      <Slider
                        value={[painLevel]}
                        onValueChange={(vals) => setPainLevel(vals[0])}
                        max={10}
                        step={0.5}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                         <span>Kein Schmerz (0)</span>
                         <span className={`${painLevel > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>NRS {painLevel}</span>
                         <span>Max (10)</span>
                      </div>
                   </div>
                   <button 
                     onClick={confirmFinish}
                     className="mt-8 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95"
                   >
                     Fortschritt speichern
                   </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Protocol Display */}
            <div className={`transition-all duration-300 ${isFinishing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <div className="flex items-center justify-center gap-4 md:gap-8 mb-6">
                  <div className="text-slate-600 text-xl font-light">×</div>
                  <EditableNumber value={sets} label="Sätze" onChange={setSets} />
                  <div className="text-slate-600 text-xl font-light">×</div>
                  <EditableNumber value={reps} label="Reps" onChange={setReps} />
               </div>

               {/* Intervention Buttons */}
               <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setIsOuchModalOpen(true)}
                    className="flex-1 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Ouch! (Schmerz)
                  </button>
                  {fullExercise.next_progression_id && (
                    <button
                      onClick={handleBoost}
                      disabled={isUpgrading}
                      className="flex-1 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" /> {isUpgrading ? 'Lädt...' : 'Boost (Upgrade)'}
                    </button>
                  )}
               </div>

               <p className="text-center text-[10px] text-slate-500 font-mono mb-6">
                 PAUSE: 60 SEK
               </p>

               <button
                  onClick={handleFinishClick}
                  disabled={isCompleted}
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] transition-all transform active:scale-[0.98] shadow-lg ${
                    isCompleted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20 hover:shadow-emerald-500/40'
                  }`}
               >
                  {isCompleted ? 'Bereits abgeschlossen' : '[ ÜBUNG ABSCHLIESSEN ]'}
               </button>
            </div>
         </div>
      </div>

        <OuchInterventionModal
          isOpen={isOuchModalOpen}
          onClose={() => setIsOuchModalOpen(false)}
          exerciseId={fullExercise.exercise_id}
          exerciseName={fullExercise.name}
          rehabPlanId={rehabPlanId}
          onExerciseSubstituted={() => { if (queryClient) queryClient.invalidateQueries({ queryKey: ['rehabPlan'] }); }}
        />
      </motion.div>
    </>
  );
}