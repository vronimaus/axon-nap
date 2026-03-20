import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Brain, Check, Edit2, Play, Settings2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
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
            className="w-16 bg-slate-800 text-center text-3xl font-bold text-white rounded border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

export default function TrainingExerciseCard({ exercise, idx, onDetailClick, isOpen, onToggle, onComplete, defaultLevel }) {
  // Props fallback
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = isOpen !== undefined ? isOpen : localExpanded;
  const toggle = onToggle || (() => setLocalExpanded(!localExpanded));

  // Exercise Data State
  const [fullExercise, setFullExercise] = useState(exercise);
  const [level, setLevel] = useState(defaultLevel || 'standard'); // basic, standard, advanced
  
  // Protocol State
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [weight, setWeight] = useState(0); // Optional
  
  // UI State
  const [showDetails, setShowDetails] = useState(false); // Collapsible details
  const [isFinishing, setIsFinishing] = useState(false); // RPE check mode
  const [rpe, setRpe] = useState(7);
  const [isCompleted, setIsCompleted] = useState(exercise.completed || false);

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
            const specs = exercise.sets_reps_tempo || dbEx.sets_reps_tempo || "3x12";
            const setMatch = specs.match(/(\d+)\s*[xX]/);
            const repMatch = specs.match(/[xX]\s*(\d+)/);
            if (setMatch) setSets(parseInt(setMatch[1]));
            if (repMatch) setReps(parseInt(repMatch[1]));
          }
        })
        .catch(() => {});
    }
  }, [exercise.exercise_id]);

  // Determine content based on level
  const currentContent = React.useMemo(() => {
    if (level === 'basic' && fullExercise.progression_basic) {
      return {
        description: fullExercise.progression_basic.description,
        focus: fullExercise.progression_basic.focus
      };
    }
    if (level === 'advanced' && fullExercise.progression_advanced) {
      return {
        description: fullExercise.progression_advanced.description,
        focus: fullExercise.progression_advanced.focus
      };
    }
    return {
      description: fullExercise.instruction || fullExercise.description,
      focus: fullExercise.axon_moment
    };
  }, [level, fullExercise]);

  const handleFinishClick = (e) => {
    e.stopPropagation();
    setIsFinishing(true);
  };

  const confirmFinish = () => {
    setIsCompleted(true);
    setIsFinishing(false);
    toast.success('Übung abgeschlossen! 🔥');
    if (onComplete) {
      onComplete({
        ...exercise,
        completed: true,
        actual_sets: sets,
        actual_reps: reps,
        actual_weight: weight,
        rpe: rpe
      });
    }
  };

  // Hidden state handled by parent or return null if forced
  if (!isExpanded) return null;

  // Full "One-Page" View for Open State
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl relative"
    >
      {/* 1. Header (Sticky-ish feeling) */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-start justify-between">
         <div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1 shadow-cyan-glow">
              {fullExercise.name}
            </h3>
            <div className="flex items-center gap-2">
               <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                 {fullExercise.category || 'Exercise'}
               </span>
               {/* Level Badge / Switch */}
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900 hover:border-cyan-500 transition-colors uppercase font-bold tracking-wider">
                      {level} <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-slate-800">
                    <DropdownMenuItem onClick={() => setLevel('basic')} className="text-slate-300 focus:bg-slate-800 cursor-pointer">
                      Basic
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLevel('standard')} className="text-slate-300 focus:bg-slate-800 cursor-pointer">
                      Standard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLevel('advanced')} className="text-cyan-300 focus:bg-slate-800 cursor-pointer">
                      Advanced
                    </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </div>
         {/* Status Indicator */}
         <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
           isCompleted 
             ? 'bg-green-500/10 text-green-400 border-green-500/20' 
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
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-500/70 hover:bg-cyan-950/40 transition-all duration-200 group mb-2"
            >
               <span className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                 <Settings2 className="w-4 h-4" />
                 Setup & Ausführung (Klick für Anleitung)
               </span>
               <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
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
                       {(currentContent.focus || fullExercise.axon_moment) && (
                         <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-cyan-950/10 p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                            <div className="flex items-start gap-3 relative z-10">
                               <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                  <Brain className="w-5 h-5 text-cyan-400" />
                               </div>
                               <div>
                                  <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">AXON Moment</h5>
                                  <p className="text-sm font-medium text-cyan-100 italic leading-relaxed">
                                    "{currentContent.focus || fullExercise.axon_moment}"
                                  </p>
                               </div>
                            </div>
                         </div>
                       )}

                       {/* Setup / Instructions */}
                       <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ausführung</h5>
                          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line pl-1">
                             {currentContent.description}
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

         {/* 3. Smart Protocol (Always Visible when open) */}
         <div className="relative">
            {/* Vibe Check Overlay (After finishing) */}
            <AnimatePresence>
              {isFinishing && (
                <motion.div 
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center p-4 rounded-xl border border-cyan-500/30"
                >
                   <h4 className="text-lg font-bold text-white mb-6">Wie hat es sich angefühlt?</h4>
                   <div className="w-full max-w-[80%] space-y-6">
                      <Slider
                        value={[rpe]}
                        onValueChange={(vals) => setRpe(vals[0])}
                        max={10}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                         <span>Easy</span>
                         <span className="text-cyan-400">RPE {rpe}</span>
                         <span>Hard</span>
                      </div>
                   </div>
                   <button 
                     onClick={confirmFinish}
                     className="mt-8 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95"
                   >
                     Bestätigen & Weiter
                   </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Protocol Display */}
            <div className={`transition-all duration-300 ${isFinishing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
                  <div className="text-slate-600 text-xl font-light">×</div>
                  <EditableNumber value={sets} label="Sätze" onChange={setSets} />
                  <div className="text-slate-600 text-xl font-light">×</div>
                  <EditableNumber value={reps} label="Reps" onChange={setReps} />
                  <div className="text-slate-600 text-xl font-light">@</div>
                  <EditableNumber value={weight} label="Load" unit="kg" onChange={setWeight} />
               </div>

               <p className="text-center text-[10px] text-slate-500 font-mono mb-6">
                 PAUSE: 60 SEK (Auto-Start nach Abschluss)
               </p>

               <button
                  onClick={handleFinishClick}
                  disabled={isCompleted}
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] transition-all transform active:scale-[0.98] shadow-lg ${
                    isCompleted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20 hover:shadow-cyan-500/40'
                  }`}
               >
                  {isCompleted ? 'Bereits abgeschlossen' : '[ ÜBUNG BEENDET ]'}
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}