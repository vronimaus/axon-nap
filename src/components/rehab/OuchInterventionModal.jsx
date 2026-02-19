import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import PainIntensitySlider from '../diagnosis/PainIntensitySlider';
import MiniBodyMap from './MiniBodyMap';

export default function OuchInterventionModal({ 
  isOpen, 
  onClose, 
  exerciseId, 
  exerciseName,
  rehabPlanId,
  onExerciseSubstituted 
}) {
  const [step, setStep] = useState('intro'); // intro → location → intensity → scanning → result
  const [selectedNode, setSelectedNode] = useState(null);
  const [painIntensity, setPainIntensity] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [substitution, setSubstitution] = useState(null);

  const handleLocationSelect = (nodeId) => {
    setSelectedNode(nodeId);
    setStep('intensity');
  };

  const handleIntensitySubmit = async (intensity) => {
    setPainIntensity(intensity);
    setStep('scanning');
    setIsProcessing(true);

    base44.analytics.track({
      eventName: 'ouch_intervention_started',
      properties: { exercise_id: exerciseId, pain_nrs: intensity, node_id: selectedNode }
    });

    try {
      const response = await base44.functions.invoke('liveAdjustAlgorithm', {
        current_exercise_id: exerciseId,
        pain_node_id: selectedNode,
        pain_nrs: intensity,
        user_email: (await base44.auth.me()).email
      });

      if (response.data.success) {
        setSubstitution(response.data);
        setStep('result');
      } else {
        // Red mode - no alternative found
        toast.error(response.data.message || 'Keine sichere Alternative gefunden');
        onClose();
      }
    } catch (error) {
      console.error('Algorithm error:', error);
      toast.error('Fehler bei der Analyse');
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptSubstitution = async () => {
    setIsProcessing(true);
    try {
      // Update RehabPlan with substitution
      await base44.entities.RehabPlan.update(rehabPlanId, {
        current_exercise_substituted: true,
        substituted_exercise_id: substitution.substituted_exercise_id,
        pain_feedback_node: selectedNode,
        pain_nrs: painIntensity,
        intervention_mode: substitution.intervention_mode,
        session_status: 'active',
        live_adjust_log: [{
          timestamp: new Date().toISOString(),
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          node_feedback: selectedNode,
          pain_nrs: painIntensity,
          action_taken: substitution.action_taken,
          new_exercise_id: substitution.substituted_exercise_id,
          reasoning: substitution.reasoning
        }]
      });

      base44.analytics.track({
        eventName: 'ouch_intervention_accepted',
        properties: { 
          from_exercise: exerciseId, 
          to_exercise: substitution.substituted_exercise_id,
          pain_nrs: painIntensity 
        }
      });

      toast.success('Übung wurde getauscht!');
      onExerciseSubstituted(substitution.substituted_exercise_id);
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleReject}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl border border-cyan-500/20 max-w-lg w-full mx-4 overflow-hidden"
          >
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {/* Intro Step */}
                {step === 'intro' && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4"
                  >
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Stopp – Sicherheit geht vor</h2>
                    <p className="text-slate-300 text-sm">
                      Lass uns kurz schauen, was los ist. Wo spürst du den Schmerz?
                    </p>
                    <Button
                      onClick={() => setStep('location')}
                      className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold"
                    >
                      Schmerz lokalisieren
                    </Button>
                  </motion.div>
                )}

                {/* Location Step */}
                {step === 'location' && (
                  <motion.div
                    key="location"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-white text-center">Wo tut es weh?</h3>
                    <p className="text-slate-400 text-sm text-center">Tippe auf die schmerzende Stelle</p>
                    <MiniBodyMap onNodeSelect={handleLocationSelect} />
                  </motion.div>
                )}

                {/* Intensity Step */}
                {step === 'intensity' && (
                  <motion.div
                    key="intensity"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-white text-center">Schmerzintensität</h3>
                    <p className="text-slate-400 text-sm text-center">Auf einer Skala von 1–10</p>
                    <PainIntensitySlider onSubmit={handleIntensitySubmit} />
                  </motion.div>
                )}

                {/* Scanning Step */}
                {step === 'scanning' && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <AlertCircle className="w-12 h-12 text-cyan-400" />
                      </motion.div>
                    </div>
                    <p className="text-slate-300 font-medium">Sicherheitsscan läuft...</p>
                    <p className="text-slate-400 text-sm">Suche passende Alternative</p>
                  </motion.div>
                )}

                {/* Result Step */}
                {step === 'result' && substitution && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-green-400 mb-1">Alternative gefunden!</h3>
                          <p className="text-sm text-slate-300">{substitution.reasoning}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <p className="text-sm text-slate-400 mb-2">Neuer Plan:</p>
                      <p className="font-bold text-cyan-400">
                        {substitution.exercise_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {substitution.action_taken === 'pivot_to_drill' 
                          ? 'Isometrische Alternative – Dein Gelenk bleibt sicher'
                          : 'Modifizierte Ausführung – reduzierte Belastung'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="flex-1 h-12"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Ablehnen
                      </Button>
                      <Button
                        onClick={handleAcceptSubstitution}
                        disabled={isProcessing}
                        className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                      >
                        {isProcessing ? 'Wird gespeichert...' : 'Ja, tauschen'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}