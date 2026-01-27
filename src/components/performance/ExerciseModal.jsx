import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExerciseModal({ exercise, isOpen, onClose }) {
  if (!exercise) return null;
  
  const difficultyColors = {
    beginner: 'text-emerald-400',
    intermediate: 'text-amber-400',
    advanced: 'text-red-400'
  };
  
  const categoryLabels = {
    mobilisation: 'Mobilisation',
    stretch: 'Dehnung',
    strength: 'Kräftigung',
    neuro_fix: 'Neuro-Fix'
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full z-50"
          >
            <div className="glass border border-cyan-500/30 rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-cyan-400 mb-2">
                    {exercise.name}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    {exercise.category && (
                      <span className="text-xs px-3 py-1 rounded-full glass-cyan border border-cyan-500/30 text-cyan-400">
                        {categoryLabels[exercise.category]}
                      </span>
                    )}
                    {exercise.difficulty && (
                      <span className={`text-xs px-3 py-1 rounded-full glass border border-slate-600 ${difficultyColors[exercise.difficulty]}`}>
                        {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="flex-shrink-0 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Ausführung
                </h3>
                <div className="bg-[#333333] rounded-2xl p-4 border border-slate-600">
                  <p className="text-white leading-relaxed whitespace-pre-line">
                    {exercise.description}
                  </p>
                </div>
              </div>
              
              {/* Cues */}
              {exercise.cues && exercise.cues.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-400" />
                    Wichtige Tipps
                  </h3>
                  <div className="space-y-2">
                    {exercise.cues.map((cue, index) => (
                      <div key={index} className="flex items-start gap-3 bg-[#333333] rounded-xl p-3 border border-purple-500/20">
                        <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white text-sm">{cue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Close Button */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold"
                >
                  Verstanden
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}