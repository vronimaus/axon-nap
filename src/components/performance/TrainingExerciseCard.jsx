import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, RotateCcw, Flame, Check, PlayCircle, Info, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TrainingExerciseCard({ exercise, idx, onDetailClick }) {
  const [fullExercise, setFullExercise] = useState(exercise);
  const [isExpanded, setIsExpanded] = useState(false);
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
      className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
        isExpanded 
          ? 'bg-slate-800/80 border border-cyan-500/30 ring-1 ring-cyan-500/20' 
          : 'bg-slate-900/40 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40'
      }`}
    >
      {/* Main Clickable Area (Header) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-center gap-4 cursor-pointer"
      >
        {/* Exercise Icon / Image Placeholder */}
        <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700 overflow-hidden ${isCompleted ? 'border-green-500/50 text-green-400' : 'text-slate-400'}`}>
          {fullExercise.image_url ? (
            <img src={fullExercise.image_url} alt={fullExercise.name} className="w-full h-full object-cover" />
          ) : (
            <PlayCircle className="w-6 h-6 opacity-70" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm truncate ${isCompleted ? 'text-green-400' : 'text-slate-200'}`}>
            {fullExercise.name}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> {specs}
            </span>
            {fullExercise.category && (
              <>
                <span>•</span>
                <span className="capitalize">{fullExercise.category}</span>
              </>
            )}
          </div>
        </div>

        {/* Quick Action / Status */}
        <div className="flex-shrink-0">
            <button
              onClick={handleSetClick}
              className={`h-9 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all border ${
                isCompleted 
                  ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <span>{setsDone}/{totalSets}</span>
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