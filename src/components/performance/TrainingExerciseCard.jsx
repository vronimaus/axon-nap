import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, RotateCcw, Flame, Check, PlayCircle, Info, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TrainingExerciseCard({ exercise, idx, onDetailClick, isOpen, onToggle }) {
  // Fallback to local state if no props provided (backward compatibility)
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = isOpen !== undefined ? isOpen : localExpanded;
  const toggle = onToggle || (() => setLocalExpanded(!localExpanded));

  const [fullExercise, setFullExercise] = useState(exercise);
  const [setsDone, setSetsDone] = useState(0);

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
              instruction: exercise.instruction || dbEx.description || dbEx.instruction,
            }));
          }
        })
        .catch(() => {});
    }
  }, [exercise.exercise_id]);

  // Parse Sets/Reps
  // Format usually: "3x12 reps" or "3x 45s"
  const specs = fullExercise.sets_reps_tempo || "3x10";
  const totalSetsMatch = specs.match(/^(\d+)/);
  const totalSets = totalSetsMatch ? parseInt(totalSetsMatch[1]) : 3;

  const handleSetClick = (e) => {
    e.stopPropagation();
    if (setsDone < totalSets) {
      setSetsDone(prev => prev + 1);
      toast.success(`Satz ${setsDone + 1} erledigt!`);
    } else {
      setSetsDone(0); // Reset for demo purposes or keep it done? User usually wants to reset if clicked again or just keep it.
      // Let's keep it maxed out or reset? Let's reset if they want to re-do.
    }
  };

  const isCompleted = setsDone >= totalSets;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl transition-all duration-300 group ${
        isExpanded 
          ? 'bg-slate-800 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
          : 'bg-[#0B1120] border border-slate-800 hover:border-slate-600'
      }`}
    >
      {/* Left Active Indicator Line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
        isCompleted ? 'bg-green-500' : isExpanded ? 'bg-cyan-500' : 'bg-transparent group-hover:bg-slate-700'
      }`} />

      {/* Main Clickable Area (Header) */}
      <div 
        onClick={toggle}
        className="p-4 pl-6 flex items-center gap-4 cursor-pointer"
      >
        {/* Play Icon / Image - More minimal */}
        <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden transition-colors ${
          isCompleted 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
            : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 group-hover:text-cyan-400 group-hover:border-cyan-500/30'
        }`}>
          {fullExercise.image_url ? (
            <img src={fullExercise.image_url} alt={fullExercise.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm tracking-tight truncate transition-colors ${
            isCompleted ? 'text-green-400' : isExpanded ? 'text-white' : 'text-slate-300 group-hover:text-white'
          }`}>
            {fullExercise.name}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-slate-500 group-hover:text-slate-400">
            <span className="flex items-center gap-1 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
              {specs}
            </span>
            {fullExercise.category && (
              <span className="uppercase tracking-wider">{fullExercise.category}</span>
            )}
          </div>
        </div>

        {/* Quick Action / Status - Sleeker Button */}
        <div className="flex-shrink-0">
            <button
              onClick={handleSetClick}
              className={`h-8 min-w-[3rem] px-3 rounded-md flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                isCompleted 
                  ? 'bg-green-500 text-slate-900 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="tracking-widest">{setsDone}/{totalSets}</span>
              )}
            </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="px-4 pb-4 pt-0 space-y-4">
              <div className="h-px w-full bg-slate-700/50 mb-3" />
              
              {/* Instructions */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anleitung</p>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {fullExercise.instruction || fullExercise.description}
                </div>
              </div>

              {/* AXON Moment */}
              {fullExercise.axon_moment && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase">AXON Moment</span>
                  </div>
                  <p className="text-xs text-slate-300 italic">
                    "{fullExercise.axon_moment}"
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                 <button 
                  onClick={(e) => { e.stopPropagation(); onDetailClick(fullExercise); }}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors"
                 >
                   Details & Video
                 </button>
                 <button className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors">
                   Alternative wählen
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}