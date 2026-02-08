import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Target, Zap, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ExerciseDetailModal({ exercise, onClose }) {
  if (!exercise) return null;

  // Check if this is a complementary drill (has frequency and duration fields)
  const isComplementaryDrill = !!(exercise.frequency && exercise.duration);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl glass rounded-2xl border border-cyan-500/30 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass border-b border-cyan-500/20 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">{exercise.name}</h2>
              {exercise.sets_reps_tempo && <p className="text-slate-400 text-sm">{exercise.sets_reps_tempo}</p>}
              {isComplementaryDrill && (
                <p className="text-slate-400 text-sm capitalize">
                  {exercise.category.replace('_', ' ')}: {exercise.frequency} ({exercise.duration})
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isComplementaryDrill ? (
            /* Simplified view for complementary drills */
            <div className="space-y-4">
              {/* Rationale */}
              <div className="glass rounded-xl p-5 border border-cyan-500/20">
                <h3 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Warum diese Übung?
                </h3>
                <p className="text-slate-300 leading-relaxed">{exercise.rationale}</p>
              </div>

              {/* Instruction if available */}
              {exercise.instruction && (
                <div className="glass rounded-xl p-5 border border-purple-500/20">
                  <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Ausführung
                  </h3>
                  <div className="space-y-3 text-slate-300 leading-relaxed">
                    {exercise.instruction.split('\n').map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs text-purple-400 font-semibold">
                          {idx + 1}
                        </div>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Full tabbed view for regular exercises */
            <Tabs defaultValue="execution" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="execution" className="text-xs sm:text-sm">
                  <Target className="w-4 h-4 mr-1" />
                  Ausführung
                </TabsTrigger>
                <TabsTrigger value="cues" className="text-xs sm:text-sm">
                  <Zap className="w-4 h-4 mr-1" />
                  Cues
                </TabsTrigger>
                <TabsTrigger value="progression" className="text-xs sm:text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Progression
                </TabsTrigger>
                <TabsTrigger value="expert" className="text-xs sm:text-sm">
                  <Info className="w-4 h-4 mr-1" />
                  Experten
                </TabsTrigger>
              </TabsList>

              {/* Execution Tab */}
              <TabsContent value="execution" className="space-y-4">
                <div className="glass rounded-xl p-5 border border-cyan-500/20">
                  <h3 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Schritt-für-Schritt Anleitung
                  </h3>
                  <div className="space-y-3 text-slate-300 leading-relaxed">
                    {exercise.instruction?.split('\n').map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs text-cyan-400 font-semibold">
                          {idx + 1}
                        </div>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {exercise.notes && (
                  <div className="glass rounded-xl p-5 border border-amber-500/20 bg-amber-500/5">
                    <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Wichtige Hinweise
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{exercise.notes}</p>
                  </div>
                )}
              </TabsContent>

              {/* Cues Tab */}
              <TabsContent value="cues" className="space-y-4">
                <div className="glass rounded-xl p-5 border border-purple-500/20">
                  <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Technik-Cues
                  </h3>
                  {exercise.cues && exercise.cues.length > 0 ? (
                    <div className="space-y-2">
                      {exercise.cues.map((cue, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-slate-300">
                          <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <p>{cue}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">Keine spezifischen Cues verfügbar.</p>
                  )}
                </div>

                {exercise.common_mistakes && (
                  <div className="glass rounded-xl p-5 border border-red-500/20 bg-red-500/5">
                    <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Häufige Fehler
                    </h3>
                    <div className="space-y-2">
                      {exercise.common_mistakes.map((mistake, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-slate-300">
                          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p>{mistake}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Progression Tab */}
              <TabsContent value="progression" className="space-y-4">
                <div className="glass rounded-xl p-5 border border-green-500/20">
                  <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Progressions-Strategie
                  </h3>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    {exercise.progression_strategy || 'Steigere Volumen oder Intensität schrittweise über mehrere Wochen.'}
                  </p>
                  
                  {exercise.progression_milestones && exercise.progression_milestones.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Meilensteine</h4>
                      {exercise.progression_milestones.map((milestone, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            <span className="font-medium text-slate-200">{milestone.level}</span>
                          </div>
                          <p className="text-sm text-slate-400 ml-4">{milestone.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {exercise.deload_protocol && (
                  <div className="glass rounded-xl p-5 border border-blue-500/20 bg-blue-500/5">
                    <h3 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Deload-Protokoll
                    </h3>
                    <p className="text-slate-300 text-sm">{exercise.deload_protocol}</p>
                  </div>
                )}
              </TabsContent>

              {/* Expert Tab */}
              <TabsContent value="expert" className="space-y-4">
                {exercise.expert_insight && (
                  <div className="glass rounded-xl p-5 border border-amber-500/20">
                    <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Experten-Insight
                    </h3>
                    <div className="text-slate-300 leading-relaxed space-y-2">
                      <p className="italic text-slate-400 text-sm mb-2">"{exercise.expert_insight.quote}"</p>
                      <p className="text-xs text-slate-500">— {exercise.expert_insight.source}</p>
                      <p className="mt-3">{exercise.expert_insight.explanation}</p>
                    </div>
                  </div>
                )}

                {exercise.scientific_background && (
                  <div className="glass rounded-xl p-5 border border-purple-500/20">
                    <h3 className="font-semibold text-purple-400 mb-3">Wissenschaftlicher Hintergrund</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{exercise.scientific_background}</p>
                  </div>
                )}

                {exercise.fms_relevance && (
                  <div className="glass rounded-xl p-5 border border-cyan-500/20">
                    <h3 className="font-semibold text-cyan-400 mb-3">FMS Pattern</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{exercise.fms_relevance}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 glass border-t border-cyan-500/20 p-4">
          <Button
            onClick={onClose}
            className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
          >
            Schließen
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}