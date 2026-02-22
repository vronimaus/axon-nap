import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Check, Sparkles, X, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WeaknessGenerator({ rehabPlan, currentExercises, onExerciseGenerated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [weakness, setWeakness] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExercise, setGeneratedExercise] = useState(null);

  const generateExercise = async () => {
    if (!weakness.trim()) {
      toast.error('Bitte beschreibe deine Schwachstelle');
      return;
    }

    setIsGenerating(true);
    try {
      const feedbackHistory = rehabPlan.feedback_history || [];
      
      const { data } = await base44.functions.invoke('rehabCoach', {
        action: 'generate_exercise',
        rehabPlan,
        weakness,
        currentExercises,
        feedbackHistory
      });
      
      setGeneratedExercise(data.exercise);
      toast.success('Übung generiert!');
    } catch (error) {
      console.error('Error generating exercise:', error);
      toast.error('Fehler beim Generieren der Übung');
    } finally {
      setIsGenerating(false);
    }
  };

  const addToPlan = () => {
    if (generatedExercise && onExerciseGenerated) {
      onExerciseGenerated(generatedExercise);
      setIsOpen(false);
      setWeakness('');
      setGeneratedExercise(null);
      toast.success('Übung zum Plan hinzugefügt!');
    }
  };

  return (
    <div className="mb-6">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 h-auto py-4 flex flex-col items-center gap-1 group transition-all"
        >
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
            AI Plan-Optimierung
          </div>
          <span className="text-[10px] text-slate-400 font-normal opacity-70 group-hover:opacity-100 transition-opacity">
            Klicke hier, um eine spezifische Schwachstelle zu beheben
          </span>
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-emerald-500/30 p-5 bg-slate-900/80 shadow-[0_0_20px_rgba(16,185,129,0.1)] overflow-hidden relative"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h4 className="font-bold text-white flex items-center gap-2 uppercase tracking-wide text-sm">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    AI Plan-Optimierung
                    </h4>
                    <p className="text-slate-400 text-xs mt-1">
                    Beschreibe dein Problem, und die KI generiert die perfekte Übung dafür.
                    </p>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            {!generatedExercise ? (
                <div className="space-y-4 relative z-10">
                    <Textarea
                    value={weakness}
                    onChange={(e) => setWeakness(e.target.value)}
                    placeholder="z.B. 'Mein linkes Knie schmerzt beim Treppensteigen' oder 'Ich habe Schwierigkeiten mit der Hüftrotation'"
                    className="bg-slate-950/50 border-slate-700 text-white focus:border-emerald-500/50 min-h-[100px] text-sm resize-none"
                    />
                    
                    <div className="flex gap-2">
                        <Button
                        onClick={generateExercise}
                        disabled={isGenerating || !weakness.trim()}
                        className="flex-1 bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                        {isGenerating ? (
                            <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analysiere & Generiere...
                            </>
                        ) : (
                            <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Lösung generieren
                            </>
                        )}
                        </Button>
                    </div>
                </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 rounded-xl bg-slate-950 border border-emerald-500/20 overflow-hidden relative z-10"
              >
                {/* Generated Result Header */}
                <div className="p-4 border-b border-slate-800 bg-emerald-950/10 flex justify-between items-start">
                    <div>
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">KI-Vorschlag</div>
                        <h5 className="font-bold text-white text-lg">{generatedExercise.name}</h5>
                    </div>
                    <div className="px-2 py-1 bg-slate-900 rounded border border-slate-700 text-[10px] text-slate-300 font-mono">
                        {generatedExercise.sets_reps_tempo || "3x10"}
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Insights */}
                    <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <span className="font-bold text-emerald-400 block mb-1">🎯 Ziel</span>
                            <span className="text-slate-300">{generatedExercise.goal_explanation || "Spezifische Problemlösung"}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <span className="font-bold text-slate-400 block mb-1">✨ Benefit</span>
                            <span className="text-slate-300">{generatedExercise.benefits || "Verbesserte Funktion"}</span>
                        </div>
                    </div>

                    {/* Instruction Preview */}
                    <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800 leading-relaxed">
                        {generatedExercise.instruction?.slice(0, 150)}...
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={addToPlan}
                            className="flex-1 bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 transition-colors"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Zum Plan hinzufügen
                        </Button>
                        <Button
                            onClick={() => {
                            setGeneratedExercise(null);
                            // Keep weakness text to allow refinement
                            }}
                            variant="outline"
                            className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            Neu generieren
                        </Button>
                    </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}