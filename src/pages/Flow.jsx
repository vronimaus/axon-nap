import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Check, Timer, Activity } from 'lucide-react';

export default function Flow() {
  const [searchParams] = useSearchParams();
  const routineId = searchParams.get('routine_id');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [completed, setCompleted] = useState(false);

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: async () => {
      const routines = await base44.entities.Routine.filter({ id: routineId });
      return routines[0];
    },
    enabled: !!routineId
  });

  useEffect(() => {
    if (!routine || !isPlaying) return;

    const currentSequence = routine.sequence[currentStep];
    if (!currentSequence) return;

    setTimeRemaining(currentSequence.duration_seconds);

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleNextStep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, routine]);

  const handleNextStep = () => {
    if (!routine) return;
    
    if (currentStep < routine.sequence.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompleted(true);
      setIsPlaying(false);
      saveHistory();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setIsPlaying(false);
    }
  };

  const saveHistory = async () => {
    try {
      await base44.entities.RoutineHistory.create({
        routine_id: routine.id,
        routine_name: routine.routine_name,
        completed: true,
        duration_actual: routine.total_duration
      });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Activity className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Routine nicht gefunden</p>
      </div>
    );
  }

  const currentSequence = routine.sequence[currentStep];
  const progress = ((currentStep + 1) / routine.sequence.length) * 100;

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl border border-cyan-500/30 p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Routine abgeschlossen! 🎯</h2>
          <p className="text-slate-400 mb-6">
            Du hast "{routine.routine_name}" erfolgreich durchgeführt.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600"
          >
            Zurück zum Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
            {routine.routine_name}
          </h1>
          <p className="text-slate-400">{routine.description}</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Schritt {currentStep + 1} von {routine.sequence.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Current Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass rounded-2xl border border-cyan-500/30 p-8 mb-6">
              {/* Step Type Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                  currentSequence.type === 'mfr' ? 'bg-red-500/20 text-red-400' :
                  currentSequence.type === 'neuro' ? 'bg-purple-500/20 text-purple-400' :
                  currentSequence.type === 'strength' ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {currentSequence.type === 'mfr' ? '🎯 Hardware (MFR)' :
                   currentSequence.type === 'neuro' ? '🧠 Software (Neuro)' :
                   currentSequence.type === 'strength' ? '💪 Integration' :
                   '🫁 Breathing'}
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <Timer className="w-5 h-5" />
                  <span className="text-2xl font-mono font-bold">
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Instruction */}
              <h2 className="text-2xl font-bold text-white mb-4">
                {currentSequence.node_id || currentSequence.exercise_id || 'Übung'}
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                {currentSequence.instruction}
              </p>

              {/* Visual Cue */}
              {currentSequence.type === 'mfr' && currentSequence.node_id && (
                <div className="bg-slate-800 rounded-xl p-4 mb-6">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/c7c1085f4_TEchnicalMFRCoordinates.jpg"
                    alt="MFR Node Map"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            variant="outline"
            size="lg"
            className="border-slate-600 text-slate-400"
          >
            ← Zurück
          </Button>
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-12"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button
            onClick={handleNextStep}
            disabled={currentStep === routine.sequence.length - 1}
            variant="outline"
            size="lg"
            className="border-slate-600 text-slate-400"
          >
            Weiter →
          </Button>
        </div>
      </div>
    </div>
  );
}