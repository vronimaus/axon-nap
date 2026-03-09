import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Check, Timer, Activity, AlertTriangle, ChevronDown, Brain } from 'lucide-react';
import { createPageUrl } from '@/utils';
import GlossaryTooltip from '../components/glossary/GlossaryTooltip';
import DailyReadinessCheck from '../components/dashboard/DailyReadinessCheck';
import { Helmet } from 'react-helmet-async';

// Helper: Replace glossary terms in text with tooltips
function InstructionWithGlossary({ instruction }) {
  const glossaryMap = {
    'Voodoo Floss': 'flossing',
    'Flossing': 'flossing',
    'Floss': 'flossing',
    'Dorsiflexion': 'dorsiflexion',
    'Torque': 'torque',
    'Bracing': 'bracing',
    'Smash': 'smash',
    'Couch Stretch': 'couch_stretch'
  };

  const renderWithGlossary = (text) => {
    if (!text || typeof text !== 'string') return text;

    const parts = [];
    let remaining = text;
    let keyCounter = 0;

    // Sort by length (longest first to match "Voodoo Floss" before "Floss")
    const sortedTerms = Object.keys(glossaryMap).sort((a, b) => b.length - a.length);

    sortedTerms.forEach((term) => {
      const newParts = [];
      
      parts.length === 0 ? [remaining] : parts.forEach((part) => {
        if (typeof part === 'string') {
          // Case-insensitive split while preserving the original case
          const regex = new RegExp(`(${term})`, 'gi');
          const segments = part.split(regex);
          
          segments.forEach((segment, i) => {
            if (segment && regex.test(segment)) {
              // Reset regex after test
              regex.lastIndex = 0;
              newParts.push(
                <GlossaryTooltip key={`g-${keyCounter++}`} term={glossaryMap[term]}>
                  {segment}
                </GlossaryTooltip>
              );
            } else if (segment) {
              newParts.push(segment);
            }
          });
        } else {
          newParts.push(part);
        }
      });

      if (parts.length === 0) {
        // First iteration
        const regex = new RegExp(`(${term})`, 'gi');
        const segments = remaining.split(regex);
        
        segments.forEach((segment) => {
          if (segment && regex.test(segment)) {
            regex.lastIndex = 0;
            newParts.push(
              <GlossaryTooltip key={`g-${keyCounter++}`} term={glossaryMap[term]}>
                {segment}
              </GlossaryTooltip>
            );
          } else if (segment) {
            newParts.push(segment);
          }
        });
      }

      if (newParts.length > 0) {
        parts.length = 0;
        parts.push(...newParts);
      }
    });

    return parts.length > 0 ? parts : remaining;
  };

  if (!instruction) return null;

  const lines = instruction.split('\n');

  return (
    <div className="text-sm text-slate-300 leading-relaxed space-y-2">
      {lines.map((line, idx) => (
        <p key={idx}>
          {line.trim() ? renderWithGlossary(line) : <br />}
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
  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const [readinessStatus, setReadinessStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [expandedProgression, setExpandedProgression] = useState(null);
  const [currentNRS, setCurrentNRS] = useState(null);

  // Check auth and readiness
  useEffect(() => {
    const checkAuthAndReadiness = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check if readiness check needed for today
        const today = new Date().toISOString().split('T')[0];
        const lastCheck = currentUser?.last_readiness_check;
        
        if (lastCheck !== today) {
          setShowReadinessCheck(true);
        } else {
          setReadinessStatus(currentUser?.current_readiness_status);
        }
      } catch (e) {
        // User not logged in - that's ok for demo flows
        setUser(null);
      }
    };
    checkAuthAndReadiness();
  }, []);

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

  // Get current exercise details if exercise_id is set
  const currentExerciseId = routine?.sequence?.[currentStep]?.exercise_id;
  const currentExercise = exercises.find(e => e.exercise_id === currentExerciseId);

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
      
      // Track completion
      base44.analytics.track({
        eventName: 'flow_completed',
        properties: { 
          routine_name: routine.routine_name,
          category: routine.category,
          duration: routine.total_duration
        }
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
        expertTip: node?.expert_tip,
        purposeExplanation: currentSequence.purpose_explanation,
        benefits: currentSequence.benefits
      };
    }
    
    // If exercise details are in the sequence, use them
    if (currentSequence.exercise_name) {
      return {
        title: currentSequence.exercise_name,
        instruction: currentSequence.instruction || currentSequence.exercise_description || '',
        axonMoment: currentSequence.axon_moment,
        purposeExplanation: currentSequence.purpose_explanation,
        benefits: currentSequence.benefits
      };
    }
    
    // For mobility flows: Extract title from first line (before colon or line break)
    const lines = instruction.split('\n');
    const firstLine = lines[0] || '';
    
    if (firstLine.includes(':')) {
      const title = firstLine.replace(':', '').trim();
      const restOfInstruction = lines.slice(1).join('\n').trim();
      return { title, instruction: restOfInstruction };
    }
    
    return {
      title: `Übung ${currentStep + 1}`,
      instruction,
      purposeExplanation: currentSequence.purpose_explanation,
      benefits: currentSequence.benefits
    };
  };

  const detailedContent = getDetailedInstruction();

  const handleReadinessCheckClose = async () => {
    setShowReadinessCheck(false);
    // Refresh user data to get updated readiness status
    try {
      const updatedUser = await base44.auth.me();
      setReadinessStatus(updatedUser?.current_readiness_status);
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

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
      <Helmet>
        <title>{routine.routine_name} - AXON Flow</title>
        <meta name="description" content={routine.description || `Erlebe ${routine.routine_name} - Ein ${routine.total_duration}-Minuten ${routine.category} Flow für optimale Performance.`} />
        <meta name="robots" content="noindex, nofollow" />

        {/* Open Graph */}
        <meta property="og:title" content={`${routine.routine_name} - AXON Flow`} />
        <meta property="og:description" content={routine.description || `${routine.total_duration} Minuten ${routine.category} Training`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${routine.routine_name} - AXON Flow`} />
        <meta name="twitter:description" content={routine.description || `${routine.total_duration} Minuten ${routine.category} Training`} />
      </Helmet>

      {/* Readiness Check Modal */}
      <AnimatePresence>
        {showReadinessCheck && user && (
          <DailyReadinessCheck user={user} onClose={handleReadinessCheckClose} />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">


        {/* Readiness Recommendation */}
         {readinessStatus && (
           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className={`glass rounded-xl p-4 mb-6 border ${
               readinessStatus === 'green'
                 ? 'border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent'
                 : readinessStatus === 'yellow'
                 ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent'
                 : 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent'
             }`}
           >
            <div className="flex items-start gap-3">
              {readinessStatus === 'green' ? (
                <Check className="w-6 h-6 flex-shrink-0 text-green-400" />
              ) : (
                <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
                  readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'
                }`} />
              )}
              <div>
                <h3 className={`font-bold mb-1 text-sm ${
                  readinessStatus === 'green' ? 'text-green-400' :
                  readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {readinessStatus === 'green'
                    ? 'Top-Form! Leg einen Zahn zu 💪'
                    : readinessStatus === 'yellow'
                    ? 'Sanfter Flow empfohlen'
                    : 'Dein System braucht heute Ruhe'}
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {readinessStatus === 'green'
                    ? 'Dein System ist bereit! Perfekter Tag für intensivere Varianten oder längere Flow-Sessions.'
                    : readinessStatus === 'yellow'
                    ? 'Dein System braucht heute eher Pflege als Belastung. Wähle eine entspannte Routine.'
                    : 'Basierend auf deinem Daily Check empfehlen wir dir heute nur sanfte Atemübungen oder MFR-Release. Keine aktiven Flows.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
              {/* Exercise Image removed temporarily */}
              
              {/* Step Type Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className={`px-3 py-1 rounded text-[10px] uppercase tracking-widest font-bold border ${
                  currentSequence.type === 'mfr' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  currentSequence.type === 'neuro' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  currentSequence.type === 'strength' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                  currentSequence.type === 'mobility' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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

              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-6 shadow-cyan-glow">
                {detailedContent.title}
              </h2>

              {/* Hero: AXON Moment */}
              {(detailedContent.axonMoment || detailedContent.expertTip) && (
                <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-cyan-950/10 p-4 mb-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">
                        {detailedContent.axonMoment ? 'AXON Moment' : 'Experten-Tipp'}
                      </h5>
                      <p className="text-sm font-medium text-cyan-100 italic leading-relaxed">
                        "{detailedContent.axonMoment || detailedContent.expertTip}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Setup / Instructions */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mb-6">
                 <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Ausführung</h5>
                 <InstructionWithGlossary instruction={detailedContent.instruction} />
              </div>

              {/* Additional Context Grid */}
              {(detailedContent.purposeExplanation || detailedContent.benefits) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {detailedContent.purposeExplanation && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Warum diese Übung?</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{detailedContent.purposeExplanation}</p>
                    </div>
                  )}
                  {detailedContent.benefits && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Was du danach spürst</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{detailedContent.benefits}</p>
                    </div>
                  )}
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

              {/* Progression Variants - use sequence data first, fall back to exercise entity */}
              {(currentSequence.progression_basic || currentSequence.progression_advanced || currentExercise) && (
                <div className="space-y-3">
                  {/* Basic Progression */}
                  {(currentSequence.progression_basic || currentExercise?.progression_basic) && (
                    <motion.div
                      className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <button
                        onClick={() => setExpandedProgression(expandedProgression === 'basic' ? null : 'basic')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
                          📉 Basic: {currentExercise.progression_basic.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            expandedProgression === 'basic' ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedProgression === 'basic' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 pb-4 border-t border-slate-800/50 pt-3 mt-1"
                          >
                            <p className="text-sm text-slate-300 leading-relaxed mb-2">{currentExercise.progression_basic.description}</p>
                            <p className="text-xs text-slate-400">
                              <span className="font-bold uppercase tracking-wider text-slate-500">Fokus:</span> {currentExercise.progression_basic.focus}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Advanced Progression */}
                  {currentExercise.progression_advanced && (
                    <motion.div
                      className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <button
                        onClick={() => setExpandedProgression(expandedProgression === 'advanced' ? null : 'advanced')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
                          📈 Advanced: {currentExercise.progression_advanced.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-cyan-500 transition-transform ${
                            expandedProgression === 'advanced' ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedProgression === 'advanced' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 pb-4 border-t border-slate-800/50 pt-3 mt-1"
                          >
                            <p className="text-sm text-slate-300 leading-relaxed mb-2">{currentExercise.progression_advanced.description}</p>
                            <p className="text-xs text-cyan-500/80">
                              <span className="font-bold uppercase tracking-wider text-cyan-500">Fokus:</span> {currentExercise.progression_advanced.focus}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex gap-2 sm:gap-4 justify-center">
          <Button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            variant="outline"
            className="border-slate-600 text-slate-400 text-xs sm:text-sm px-3 sm:px-4 h-10 sm:h-11"
          >
            ← Zurück
          </Button>
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 sm:px-12 text-xs sm:text-sm h-10 sm:h-11"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
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
            className="border-slate-600 text-slate-400 text-xs sm:text-sm px-3 sm:px-4 h-10 sm:h-11"
          >
            {currentStep === routine.sequence.length - 1 ? (
              <>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
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