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
  const [checkAnswers, setCheckAnswers] = useState({});
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: async () => {
      const routines = await base44.entities.Routine.filter({ id: routineId });
      return routines[0];
    },
    enabled: !!routineId
  });

  // Load MFR Node data for detailed instructions
  const { data: mfrNodes = [] } = useQuery({
    queryKey: ['mfrNodes'],
    queryFn: () => base44.entities.MFRNode.list()
  });

  // Load Exercise data for neuro drills
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list()
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
    
    // Show success check before moving to next step
    if (currentStep < routine.sequence.length - 1) {
      setShowSuccessCheck(true);
    } else {
      setCompleted(true);
      setIsPlaying(false);
      saveHistory();
    }
  };

  const handleCheckResponse = (response) => {
    setCheckAnswers({
      ...checkAnswers,
      [currentStep]: response
    });
    setShowSuccessCheck(false);
    setIsPlaying(false);
    
    // Move to next step
    if (currentStep < routine.sequence.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompleted(true);
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

  // Success Check messages per flow & step
  const successChecks = {
    'Morning Spark': [
      "Fühlt sich deine Haut jetzt 'elektrisiert' oder präsenter an?",
      "Ist dein Blickfeld schärfer? Lässt der Nackendruck nach?",
      "Kannst du den Kopf jetzt leichter drehen? (Check: N1)",
      "Spürst du mehr Grip und Stabilität im Stand?",
      "Fühlst du den Energie-Kick in deinem System?",
      "Geht die Atmung jetzt leichter in den Brustkorb?",
      "Fühlst du dich stabiler und 'verbundener' mit dem Boden?"
    ],
    'Office Rescue': [
      "Spürst du einen Entspannungsimpuls oder musstest du schlucken?",
      "Fühlt sich dein Kiefer lockerer an? (Check: N12)",
      "Ist die Spannung in deinen Unterarmen gesunken?",
      "Fühlt sich das aufrechte Sitzen jetzt müheloser an?",
      "Spürst du mehr Freiheit in der Leiste beim Aufstehen?",
      "Wirkt der Raum um dich herum gerade weiter und ruhiger?",
      "Fühlt sich dein Gesäß wieder 'aktiv' und wach an?"
    ],
    'Performance Prep': [
      "Läuft das Sprunggelenk 'runder' und ohne Blockaden?",
      "Fühlt sich dein unterer Rücken stabiler und kontrollierter an?",
      "Ist dein Gleichgewicht beim nächsten Test fester?",
      "Spürst du die Kraftübertragung bis in den Rumpf?",
      "Gleiten deine Schulterblätter jetzt flüssiger?",
      "Ist deine Rumpfspannung ('Bracing') jetzt auf 100%?",
      "Bist du bereit? Fühlt sich das Gewicht jetzt leichter an?"
    ],
    'Nightly Reset': [
      "Ist das Schwarz vor deinen Augen tiefer geworden?",
      "Lässt der Druck in deiner Kehle und dem Nacken nach?",
      "Spürst du, wie dein innerer Rhythmus langsamer wird?",
      "Wird dein Bauch warm und weich? (Check: N8)",
      "Fällt das Ausatmen jetzt schwereloser? (Check: N4)",
      "Fühlen sich deine Beine jetzt schwerer und entspannter an?",
      "Ist dein Herzschlag jetzt ruhig und gleichmäßig?"
    ]
  };

  const currentCheckQuestion = successChecks[routine.routine_name]?.[currentStep] || "Spürst du eine Verbesserung?";

  // Get detailed instruction from MFR Node or Exercise
  const getDetailedInstruction = () => {
    if (currentSequence.type === 'mfr' && currentSequence.node_id) {
      const node = mfrNodes.find(n => n.node_id === currentSequence.node_id);
      return {
        title: node?.name_de || currentSequence.node_id,
        instruction: node?.user_instruction || currentSequence.instruction,
        expertTip: node?.expert_tip
      };
    } else if (currentSequence.exercise_id) {
      // For all exercise types (neuro, strength, mobility, breath)
      const exercise = exercises.find(e => e.exercise_id === currentSequence.exercise_id);
      return {
        title: exercise?.name || currentSequence.exercise_id,
        instruction: exercise?.description || currentSequence.instruction,
        neuroInput: exercise?.neuro_input
      };
    }
    return {
      title: currentSequence.node_id || 'Übung',
      instruction: currentSequence.instruction
    };
  };

  const detailedContent = getDetailedInstruction();

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Pulse */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1.5 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-cyan rounded-2xl border border-cyan-500/40 p-10 max-w-2xl w-full text-center relative z-10 neuro-glow"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4"
          >
            {routine.completion_title || "System optimiert!"}
          </motion.h2>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-200 text-base leading-relaxed mb-8 max-w-xl mx-auto"
          >
            {routine.completion_message || `Du hast "${routine.routine_name}" erfolgreich durchgeführt. Dein System ist jetzt optimiert und bereit!`}
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-8 py-6 text-lg font-semibold shadow-xl"
            >
              Zurück zum Dashboard
            </Button>
          </motion.div>
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
            <div className="glass rounded-2xl border border-cyan-500/20 p-8 mb-6 bg-slate-900/50 backdrop-blur-xl neuro-glow">
              {/* Step Type Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className={`px-4 py-2 rounded-full text-sm font-bold border ${
                  currentSequence.type === 'mfr' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                  currentSequence.type === 'neuro' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' :
                  currentSequence.type === 'strength' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' :
                  currentSequence.type === 'mobility' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                  'bg-green-500/20 text-green-400 border-green-500/40'
                }`}>
                  {currentSequence.type === 'mfr' ? 'Hardware (MFR)' :
                   currentSequence.type === 'neuro' ? 'Software (Neuro)' :
                   currentSequence.type === 'strength' ? 'Integration' :
                   currentSequence.type === 'mobility' ? 'Mobility (CARs)' :
                   'Breathing'}
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <Timer className="w-5 h-5" />
                  <span className="text-3xl font-mono font-bold">
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Instruction */}
              <h2 className="text-xl font-bold text-cyan-300 mb-4">
                {detailedContent.title}
              </h2>
              <p className="text-slate-200 text-base leading-relaxed mb-6">
                {detailedContent.instruction}
              </p>

              {/* Expert Tip or Neuro Input */}
              {(detailedContent.expertTip || detailedContent.neuroInput) && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-purple-300 leading-relaxed">
                    <span className="font-bold text-purple-400">💡 {detailedContent.expertTip ? 'Experten-Tipp' : 'Neuro-Input'}:</span> {detailedContent.expertTip || detailedContent.neuroInput}
                  </p>
                </div>
              )}

              {/* Visual Cue */}
              {currentSequence.type === 'mfr' && currentSequence.node_id && (
                <div className="glass-cyan rounded-xl p-4 mb-6 border border-cyan-500/30">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/c7c1085f4_TEchnicalMFRCoordinates.jpg"
                    alt="MFR Node Map"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </div>
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
            onClick={() => {
              if (currentStep === routine.sequence.length - 1) {
                setCompleted(true);
                setIsPlaying(false);
                saveHistory();
              } else {
                handleNextStep();
              }
            }}
            variant="outline"
            size="lg"
            className="border-slate-600 text-slate-400"
          >
            {currentStep === routine.sequence.length - 1 ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Beenden
              </>
            ) : (
              'Weiter →'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}