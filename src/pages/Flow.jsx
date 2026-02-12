import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Check, Timer, Activity } from 'lucide-react';
import { createPageUrl } from '@/utils';
import GlossaryTooltip from '../components/glossary/GlossaryTooltip';

// Helper: Replace glossary terms in text with tooltips
function InstructionWithGlossary({ instruction }) {
  const glossaryMap = {
    'Flossing': 'flossing',
    'Voodoo Floss': 'flossing',
    'Dorsiflexion': 'dorsiflexion',
    'Torque': 'torque',
    'Bracing': 'bracing',
    'Smash': 'smash',
    'Couch Stretch': 'couch_stretch'
  };

  // Create regex pattern from all terms (case insensitive)
  const terms = Object.keys(glossaryMap).sort((a, b) => b.length - a.length);
  const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

  const renderLineWithTooltips = (line) => {
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    // Reset regex
    regex.lastIndex = 0;

    while ((match = regex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`}>
            {line.slice(lastIndex, match.index)}
          </span>
        );
      }

      // Find the matching term (case-insensitive)
      const matchedText = match[0];
      const termKey = terms.find(t => t.toLowerCase() === matchedText.toLowerCase());
      const glossaryKey = termKey ? glossaryMap[termKey] : null;

      // Add glossary tooltip
      if (glossaryKey) {
        parts.push(
          <GlossaryTooltip key={`glossary-${key++}`} term={glossaryKey}>
            {matchedText}
          </GlossaryTooltip>
        );
      } else {
        parts.push(<span key={`text-${key++}`}>{matchedText}</span>);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(
        <span key={`text-${key++}`}>
          {line.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : line;
  };

  const lines = instruction.split('\n');

  return (
    <div className="text-slate-200 text-base leading-relaxed mb-6 space-y-2">
      {lines.map((line, idx) => (
        <p key={idx}>
          {line.trim() ? renderLineWithTooltips(line) : <br />}
        </p>
      ))}
    </div>
  );
}

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
    
    setIsPlaying(false);
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

  // Get detailed instruction - extract title from instruction
  const getDetailedInstruction = () => {
    const instruction = currentSequence.instruction || '';
    
    // For MFR nodes, try to get from MFR entity
    if (currentSequence.type === 'mfr' && currentSequence.node_id) {
      const node = mfrNodes.find(n => n.node_id === currentSequence.node_id);
      return {
        title: node?.name_de || currentSequence.node_id,
        instruction: node?.user_instruction || instruction,
        expertTip: node?.expert_tip
      };
    }
    
    // For mobility flows: Extract title from first line (before colon or line break)
    const lines = instruction.split('\n');
    const firstLine = lines[0] || '';
    
    // Check if first line ends with colon (typical format: "Title:\n\nInstructions")
    if (firstLine.includes(':')) {
      const title = firstLine.replace(':', '').trim();
      const restOfInstruction = lines.slice(1).join('\n').trim();
      return {
        title,
        instruction: restOfInstruction
      };
    }
    
    // Fallback: use full instruction
    return {
      title: `Übung ${currentStep + 1}`,
      instruction
    };
  };

  const detailedContent = getDetailedInstruction();

  // Generate completion message based on routine category
  const getCompletionMessage = () => {
    if (routine.category === 'mobility-training') {
      return `Du hast alle ${routine.sequence.length} Bewegungen gemeistert. Deine Gelenke sind mobilisiert, deine Bewegungsketten aktiviert.`;
    }
    return routine.completion_message || `Du hast "${routine.routine_name}" erfolgreich durchgeführt. Dein System ist jetzt optimiert!`;
  };

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
          className="glass-cyan border-cyan-500/40 neuro-glow rounded-2xl border p-10 max-w-2xl w-full text-center relative z-10"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl bg-gradient-to-br from-cyan-500 to-purple-600"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500"
          >
            {routine.completion_title || "Flow abgeschlossen!"}
          </motion.h2>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-200 text-base leading-relaxed mb-8 max-w-xl mx-auto"
          >
            {getCompletionMessage()}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => window.history.back()}
              className="w-full h-12 px-8 text-lg font-semibold shadow-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              Zurück zur Übersicht
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
          <div className="text-slate-400 max-w-2xl mx-auto">
            <InstructionWithGlossary instruction={routine.description || ''} />
          </div>
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
              <InstructionWithGlossary instruction={detailedContent.instruction} />

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
              
              {/* Exercise Image */}
              {currentSequence.image_url && (
                <div className="rounded-xl overflow-hidden mb-6 border border-cyan-500/30">
                  <img
                    src={currentSequence.image_url}
                    alt={detailedContent.title}
                    className="w-full h-auto"
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