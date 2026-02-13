import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Check } from 'lucide-react';
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
          className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neue Übung für spezifische Schwachstelle generieren
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl border border-purple-500/30 p-4 bg-gradient-to-r from-purple-500/10 to-transparent"
          >
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              KI-gestützte Übungsgenerierung
            </h4>
            <p className="text-slate-300 text-sm mb-3">
              Beschreibe eine spezifische Schwachstelle oder ein Problem, das du noch hast:
            </p>
            
            <Textarea
              value={weakness}
              onChange={(e) => setWeakness(e.target.value)}
              placeholder="z.B. 'Mein linkes Knie schmerzt beim Treppensteigen' oder 'Ich habe Schwierigkeiten mit der Hüftrotation'"
              className="mb-3 bg-slate-800 border-slate-600 text-white"
              rows={3}
            />

            {!generatedExercise ? (
              <div className="flex gap-2">
                <Button
                  onClick={generateExercise}
                  disabled={isGenerating || !weakness.trim()}
                  className="flex-1 bg-purple-500/30 text-purple-400 hover:bg-purple-500/40"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Übung generieren
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Abbrechen
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700"
              >
                <h5 className="font-bold text-white mb-2">{generatedExercise.name}</h5>
                
                <div className="mb-3 p-2 rounded bg-purple-500/10">
                  <p className="text-xs font-semibold text-purple-400 mb-1">🎯 Warum diese Übung?</p>
                  <p className="text-slate-300 text-sm">{generatedExercise.goal_explanation}</p>
                </div>

                <div className="mb-3 p-2 rounded bg-green-500/10">
                  <p className="text-xs font-semibold text-green-400 mb-1">✨ Das bringt's dir:</p>
                  <p className="text-slate-300 text-sm">{generatedExercise.benefits}</p>
                </div>

                <p className="text-slate-400 text-sm mb-1">
                  <strong>Ausführung:</strong> {generatedExercise.sets_reps_tempo}
                </p>
                <p className="text-slate-300 text-sm whitespace-pre-wrap mb-3">
                  {generatedExercise.instruction}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={addToPlan}
                    className="flex-1 bg-green-500/30 text-green-400 hover:bg-green-500/40"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Zum Plan hinzufügen
                  </Button>
                  <Button
                    onClick={() => {
                      setGeneratedExercise(null);
                      setWeakness('');
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Neu generieren
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function Sparkles({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z" fill="currentColor"/>
      <path d="M19 12L19.5 13.5L21 14L19.5 14.5L19 16L18.5 14.5L17 14L18.5 13.5L19 12Z" fill="currentColor"/>
      <path d="M5 16L5.5 17.5L7 18L5.5 18.5L5 20L4.5 18.5L3 18L4.5 17.5L5 16Z" fill="currentColor"/>
    </svg>
  );
}