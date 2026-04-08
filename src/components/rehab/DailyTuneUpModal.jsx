import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MFRResetScreenDynamic from './DailyTuneUp/MFRResetScreenDynamic';
import NeuroDrillScreen from './DailyTuneUp/NeuroDrillScreen';
import RetestScreen from './DailyTuneUp/RetestScreen';
import IntegrationScreen from './DailyTuneUp/IntegrationScreen';
import NeuralChargeBarCompact from './DailyTuneUp/NeuralChargeBarCompact';
import { buildInterventionFlow } from '@/lib/neuralPermissionEvaluation';

import { base44 } from '@/api/base44Client';

const SCREENS = [
  { id: 0, label: 'MFR Reset', title: 'Hardware-Reset' },
  { id: 1, label: 'Neuro Drill', title: 'Software-Update' },
  { id: 2, label: 'Retest', title: 'Vergleich' },
  { id: 3, label: 'Integration', title: 'Easy Strength' }
];

// Map region names (from InteractiveBodyMapInput) to Node IDs
// Based on Stecco 14-Segment System: CP, CL, TH, LU, PV, SC, HU, CU, CA, DI, CX, GE, TA, PE
const REGION_TO_NODE_ID = {
  // CP - Kopf (Caput)
  'Kopf/Stirn': 'CP-A',
  'Ohr/Kiefergelenk': 'CP-A',
  'Hinterkopf': 'CP-P',

  // CL - Hals (Collum)
  'Hals vorne': 'CL-A',
  'Nacken seitlich': 'CL-P',
  'Nacken/obere Halswirbelsäule': 'CL-P',

  // TH - Brustkorb (Thorax)
  'obere Brust/Schlüsselbein': 'TH-A',
  'mittlere Brust': 'TH-A',
  'oberer Rücken/Nacken': 'TH-P',
  'oberer Rücken': 'TH-P',
  'mittlerer Rücken': 'TH-P',

  // LU - Lende (Lumbar)
  'unterer Rücken/Lendenwirbelsäule': 'LU-P',
  'Bauch oben': 'LU-A',
  'Bauch Mitte/Bauchnabel': 'LU-A',

  // PV - Becken (Pelvis)
  'Unterbauch/Becken': 'PV-A',
  'Becken/Hüfte': 'PV-A',
  'Gesäß': 'PV-P',

  // SC - Schulter (Scapula)
  'Schulter vorne/Acromion': 'SC-A',
  'Schulter hinten/Acromion': 'SC-P',
  'Schulterblatt': 'SC-P',

  // HU - Oberarm (Humerus)
  'Oberarm': 'HU-A',

  // CU - Ellenbogen (Cubitus)
  'Ellenbogen-Beuge': 'CU-A',

  // CX - Hüfte (Coxa)
  'Vorderer Hüftbeuger': 'CX-A',
  'Hinterer Hüftbereich': 'CX-P',

  // GE - Knie (Genu)
  'Knie vorne': 'GE-A',
  'Kniekehle': 'GE-P',

  // TA - Sprunggelenk (Talus)
  'Unterschenkel/Schienbein': 'TA-A',
  'Wade': 'TA-P',
  'Ferse/Achillessehne': 'TA-P',

  // PE - Fuß (Pes)
  'Fuß/Knöchel vorne': 'PE-A',
};

export default function DailyTuneUpModal({
  isOpen,
  onClose,
  rehabPlan,
  user,
  queryClient,
  region = 'Lenden / Unterer Rücken',
  sfmaValues = null, // { movement_level, pain_rest, pain_move } from SFMAQuickCheck
}) {
  console.log('🔍 DailyTuneUpModal region prop:', region);
  const nodeId = REGION_TO_NODE_ID[region] || 'N6'; // Default zu N6 (Lendenwirbelsäule)
  console.log('🔍 Mapped nodeId:', nodeId);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [mfrNodeCompleted, setMFRNodeCompleted] = useState(false);
  const [neuroDrillCompleted, setNeuroDrillCompleted] = useState(false);
  const [retestCompleted, setRetestCompleted] = useState(false);
  const [integrationCompleted, setIntegrationCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfrPretestValue, setMfrPretestValue] = useState(null);
  const [tuneUpData, setTuneUpData] = useState(null);
  const [neuralPermission, setNeuralPermission] = useState(null);
  const [interventionFlow, setInterventionFlow] = useState(null);

  // TTS disabled

  // Load TuneUp causal chain data
  const loadTuneUpData = async () => {
    try {
      const results = await base44.entities.TuneUpCausalChain.filter({ node_id: nodeId });
      if (results.length > 0) {
        setTuneUpData(results[0]);
      }
    } catch (err) {
      console.error('Error loading TuneUp data:', err);
    }
  };

  React.useEffect(() => {
    loadTuneUpData();
  }, [nodeId]);

  // Calculate neural charge (0-100%)
  const neuralCharge = (() => {
    let charge = 0;
    if (mfrNodeCompleted) charge += 25;
    if (neuroDrillCompleted) charge += 25;
    if (retestCompleted) charge += 25;
    if (integrationCompleted) charge += 25;
    return charge;
  })();

  const handleScreenComplete = async (screenId, data) => {
    if (screenId === 0) {
      setMFRNodeCompleted(true);
      if (data?.pretestValue != null) setMfrPretestValue(data.pretestValue);
      setCurrentScreen(1);
    } else if (screenId === 1) {
      setNeuroDrillCompleted(true);
      setCurrentScreen(2);
      // Silent transition
    } else if (screenId === 2) {
      setRetestCompleted(true);
      // Evaluate Neural Permission
      if (data?.neuralPermissionEvaluation) {
        setNeuralPermission(data.neuralPermissionEvaluation);
        const flow = buildInterventionFlow(data.neuralPermissionEvaluation, tuneUpData);
        setInterventionFlow(flow);
        
        // Route based on permission
        if (data.neuralPermissionEvaluation.permissionGranted) {
          setCurrentScreen(3); // Integration
        } else {
          // Trigger intervention instead of integration
          handleIntervention(flow);
        }
      } else {
        setCurrentScreen(3); // Fallback
      }
    } else if (screenId === 3) {
      setIntegrationCompleted(true);
      await submitSession(data);
    }
  };

  const handleIntervention = (flow) => {
    // Route to intervention screen based on recommendedAction
    if (flow.nextScreen === 'PARASYMPATHETIC_DRILL') {
      // Show parasympathetic drill screen
      setCurrentScreen(4); // Will be added as new screen
    } else if (flow.nextScreen === 'SENSORY_PRIMING') {
      // Show sensory priming screen
      setCurrentScreen(5);
    } else if (flow.nextScreen === 'TWEAKOLOGY_POSITION_REGRESSION') {
      // Show tweaked integration screen
      setCurrentScreen(3);
    }
  };

  const submitSession = async (sessionData) => {
    setIsSubmitting(true);
    try {
      if (rehabPlan?.id && user?.email) {
        const today = new Date().toISOString().split('T')[0];
        const feedback = {
          date: today,
          session_type: 'daily_tune_up',
          mfr_completed: mfrNodeCompleted,
          neuro_completed: neuroDrillCompleted,
          retest_completed: retestCompleted,
          integration_completed: integrationCompleted,
          neural_charge: neuralCharge,
          neural_permission_granted: neuralPermission?.permissionGranted || true,
          neural_permission_reason: neuralPermission?.reason || 'CLEAR',
          intervention_applied: interventionFlow ? interventionFlow.nextScreen : null,
          notes: 'Daily Tune-Up session completed'
        };
        const history = rehabPlan.feedback_history || [];
        history.push(feedback);
        
        // Track guarding failures if permission was denied
        if (!neuralPermission?.permissionGranted) {
          const failures = (rehabPlan.neural_permission_failures || 0) + 1;
          await base44.entities.RehabPlan.update(rehabPlan.id, { 
            feedback_history: history,
            neural_permission_failures: failures
          });
        } else {
          await base44.entities.RehabPlan.update(rehabPlan.id, { feedback_history: history });
        }
      }

      base44.analytics.track({
        eventName: 'daily_tune_up_completed',
        properties: { 
          user_email: user?.email,
          neural_permission_granted: neuralPermission?.permissionGranted || true,
          intervention: interventionFlow?.nextScreen || 'NONE'
        }
      });

      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
      }

      setTimeout(() => {
        onClose({ success: true });
      }, 2000);
    } catch (error) {
      console.error('Session submission error:', error);
      setTimeout(() => onClose({ success: false }), 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-sm"
      />

      {/* Modal - Full Screen */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-[9999] bg-slate-950 overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent border-b border-cyan-500/20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">
              {SCREENS[currentScreen].label}
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {SCREENS[currentScreen].title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Schritt {currentScreen + 1} von {SCREENS.length}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentScreen === 0 && (
              <MFRResetScreenDynamic
                key="mfr"
                nodeId={nodeId}
                screenId={0}
                onComplete={handleScreenComplete}
              />
            )}
            {currentScreen === 1 && (
              <NeuroDrillScreen
                key="neuro"
                nodeId={nodeId}
                screenId={1}
                onComplete={handleScreenComplete}
              />
            )}
            {currentScreen === 2 && (
              <RetestScreen
                key="retest"
                nodeId={nodeId}
                screenId={2}
                sfmaValues={sfmaValues}
                onComplete={handleScreenComplete}
              />
            )}
            {currentScreen === 3 && !interventionFlow && (
              <IntegrationScreen
                key="integration"
                nodeId={nodeId}
                screenId={3}
                onComplete={handleScreenComplete}
                isSubmitting={isSubmitting}
              />
            )}
            {currentScreen === 3 && interventionFlow && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-sm mx-auto px-4 space-y-5 text-center"
              >
                <div className="glass rounded-2xl border border-yellow-500/30 p-6">
                  <p className="text-lg font-black text-yellow-300 mb-3">{interventionFlow.message}</p>
                  <p className="text-sm text-slate-300 mb-4">{interventionFlow.instruction}</p>
                  <motion.button
                    onClick={() => setInterventionFlow(null)}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-bold"
                  >
                    ✓ Verstanden
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Compact Neural Charge Bar (fixed bottom-right) */}
        <NeuralChargeBarCompact charge={neuralCharge} />
      </motion.div>
    </>
  );
}