import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import MFRResetScreenDynamic from './DailyTuneUp/MFRResetScreenDynamic';
import NeuroDrillScreen from './DailyTuneUp/NeuroDrillScreen';
import RetestScreen from './DailyTuneUp/RetestScreen';
import IntegrationScreen from './DailyTuneUp/IntegrationScreen';
import CoachingBridgeScreen from './DailyTuneUp/CoachingBridgeScreen';
import CompletionScreen from './DailyTuneUp/CompletionScreen';
import NeuralChargeBarCompact from './DailyTuneUp/NeuralChargeBarCompact';
import { buildInterventionFlow } from '@/lib/neuralPermissionEvaluation';

import { base44 } from '@/api/base44Client';

const SCREENS = [
  { id: 0, label: 'MFR Reset', title: 'Hardware-Reset' },
  { id: 1, label: 'Neuro Drill', title: 'Software-Update' },
  { id: 2, label: 'Retest', title: 'Vergleich' },
  { id: 3, label: 'Brücke', title: 'Anker setzen' },
  { id: 4, label: 'Integration', title: 'Easy Strength' },
  { id: 5, label: 'Abschluss', title: 'Fertig' }
];

// Map region labels (from bodyMapRegions.js polygon detection) to Node IDs.
// Labels may include a laterality suffix (" links" / " rechts") which is stripped before lookup.
// Two-level keys allow front/back differentiation where needed: "front:Label" / "back:Label".
const REGION_TO_NODE_ID = {
  // CP - Kopf / Caput
  'Kopf/Stirn': 'CP-P',
  'Ohr/Kiefergelenk': 'CP-P',
  'Hinterkopf': 'CP-P',

  // CL - Hals / Collum
  'Hals vorne': 'CL-P',
  'Nacken seitlich': 'CL-P',
  'Nacken/HWS': 'CL-P',

  // TH - Brustkorb / Thorax
  'Obere Brust/Schlüsselbein': 'TH-A',
  'Brust': 'TH-A',
  'Oberer Rücken': 'TH-P',
  'Mittlerer Rücken': 'TH-P',

  // LU - Lende / Lumbar
  'Unterer Rücken/LWS': 'LU-P',
  'Bauch oben': 'LU-A',
  'Bauch/Nabel': 'LU-A',

  // PV - Becken / Pelvis
  'Unterbauch/Becken': 'LU-A',
  'Gesäß': 'PV-P',

  // SC - Schulter / Scapula (Acromion, Deltoid, Schultergelenk)
  'front:Schulter/Acromion': 'SC-A',
  'back:Schulter/Acromion': 'SC-P',
  'Schulterblatt': 'SC-P',

  // HU - Oberarm / Humerus (nur der eigentliche Oberarm, nicht die Schulter)
  'Oberarm': 'HU-A',

  // CU - Ellenbogen / Cubitus
  'Ellenbogen': 'CU-A',

  // CX - Hüfte / Coxa
  'front:Hüfte/Becken': 'CX-A',
  'back:Hüfte/Becken': 'CX-P',
  'front:Oberschenkel': 'CX-A',
  'back:Oberschenkel': 'CX-P',

  // GE - Knie / Genu
  'Knie': 'GE-A',
  'Kniekehle': 'GE-P',

  // TA - Sprunggelenk / Talus
  'Unterschenkel': 'TA-A',
  'Wade': 'TA-P',
  'Ferse/Achillessehne': 'TA-P',

  // Fuß
  'Fuß/Knöchel': 'TA-A',
};

function lookupNodeId(region, view) {
  if (!region) return null;
  // Strip laterality suffix (" links" / " rechts")
  const label = region.replace(/\s+(links|rechts)$/, '').trim();
  // Try view-prefixed key first, then plain label
  return REGION_TO_NODE_ID[`${view}:${label}`] || REGION_TO_NODE_ID[label] || null;
}

export default function DailyTuneUpModal({
  isOpen,
  onClose,
  user,
  queryClient,
  region = 'Lenden / Unterer Rücken',
  bodyView = 'front',
  explicitNodeId = null, // resolved nodeId from disambiguation (highest priority)
  sfmaValues = null, // { movement_level, pain_rest, pain_move } from SFMAQuickCheck
  selectedChains = null, // LLM-selected causal chains from selectCausalChain
}) {
  const [activeChainIndex, setActiveChainIndex] = useState(0);
  // When explicitNodeId is set (from disambiguation), prefer the chain matching that nodeId
  const matchingChain = explicitNodeId
    ? selectedChains?.find(c => c.node_id === explicitNodeId)
    : null;
  const activeChain = matchingChain || (!explicitNodeId ? selectedChains?.[activeChainIndex] : null);
  const nodeId = explicitNodeId || activeChain?.node_id || lookupNodeId(region, bodyView) || 'LU-P';
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
  const [retestResults, setRetestResults] = useState(null);

  // TTS disabled

  // Load TuneUp causal chain data — prefer LLM-selected chain, fallback to DB lookup
  useEffect(() => {
    if (activeChain) {
      setTuneUpData(activeChain);
      return;
    }
    base44.entities.TuneUpCausalChain.filter({ node_id: nodeId })
      .then(results => { if (results.length > 0) setTuneUpData(results[0]); })
      .catch(err => console.error('Error loading TuneUp data:', err));
  }, [activeChainIndex, selectedChains, nodeId]);

  // Switch to next chain — resets the screen flow
  const handleNextChain = () => {
    if (!selectedChains || activeChainIndex >= selectedChains.length - 1) return;
    setActiveChainIndex(prev => prev + 1);
    setCurrentScreen(0);
    setMFRNodeCompleted(false);
    setNeuroDrillCompleted(false);
    setRetestCompleted(false);
    setIntegrationCompleted(false);
    setNeuralPermission(null);
    setInterventionFlow(null);
  };

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
    } else if (screenId === 2) {
      setRetestCompleted(true);
      if (data?.retestResults) setRetestResults(data.retestResults);
      if (data?.neuralPermissionEvaluation) {
        setNeuralPermission(data.neuralPermissionEvaluation);
        const flow = buildInterventionFlow(data.neuralPermissionEvaluation, tuneUpData);
        setInterventionFlow(flow);

        if (data.neuralPermissionEvaluation.permissionGranted) {
          setCurrentScreen(3); // Coaching Bridge
        } else {
          setCurrentScreen(3); // Intervention message at bridge position
        }
      } else {
        setCurrentScreen(3); // Bridge
      }
    } else if (screenId === 3) {
      // Bridge → Integration
      setCurrentScreen(4);
    } else if (screenId === 4) {
      // Integration → Completion
      setIntegrationCompleted(true);
      setCurrentScreen(5);
    } else if (screenId === 5) {
      await submitSession(data);
    }
  };

  const handleIntervention = (flow) => {
    // All interventions show a message at the bridge position (screen 3).
    // After acknowledgment, the user proceeds to Integration (screen 4).
    setCurrentScreen(3);
  };

  const submitSession = async (sessionData) => {
    setIsSubmitting(true);
    try {
      // Save session to RoutineHistory for mobility trend tracking
      try {
        await base44.entities.RoutineHistory.create({
          routine_id: nodeId,
          routine_name: tuneUpData?.node_name_de || region || 'Tune-Up',
          completed: true,
          feedback: {
            tension_level: retestResults?.tension_level ?? null,
            rom_improvement: retestResults?.rom_improvement ?? null,
            movement_quality: retestResults?.movement_quality ?? null,
            neural_permission: neuralPermission?.permissionGranted ?? null,
            node_id: nodeId,
          },
        });
      } catch (e) { console.error('RoutineHistory save error:', e); }

      base44.analytics.track({
        eventName: 'daily_tune_up_completed',
        properties: {
          user_email: user?.email,
          node_id: nodeId,
          neural_permission_granted: neuralPermission?.permissionGranted ?? true,
          intervention: interventionFlow?.nextScreen || 'NONE'
        }
      });

      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }

      setTimeout(() => {
        onClose({ success: true });
      }, 1500);
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">
                {SCREENS[currentScreen].label}
              </span>
              {selectedChains?.length > 1 && (
                <span className="text-[9px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  Kette {activeChainIndex + 1}/{selectedChains.length}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {tuneUpData?.node_name_de || SCREENS[currentScreen].title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Schritt {currentScreen + 1}/{SCREENS.length}
              {tuneUpData?.target_chain && <span className="ml-2 text-cyan-700">{tuneUpData.target_chain}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {selectedChains?.length > 1 && activeChainIndex < selectedChains.length - 1 && currentScreen === 5 && (
              <button
                onClick={handleNextChain}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-colors"
              >
                Nächste <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                tuneUpData={tuneUpData}
              />
            )}
            {currentScreen === 1 && (
              <NeuroDrillScreen
                key="neuro"
                nodeId={nodeId}
                screenId={1}
                onComplete={handleScreenComplete}
                tuneUpData={tuneUpData}
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
              <CoachingBridgeScreen
                key="bridge"
                screenId={3}
                onComplete={handleScreenComplete}
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
                    onClick={() => { setInterventionFlow(null); setCurrentScreen(4); }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-bold"
                  >
                    ✓ Verstanden
                  </motion.button>
                </div>
              </motion.div>
            )}
            {currentScreen === 4 && (
              <IntegrationScreen
                key="integration"
                nodeId={nodeId}
                screenId={4}
                onComplete={handleScreenComplete}
                tuneUpData={tuneUpData}
              />
            )}
            {currentScreen === 5 && (
              <CompletionScreen
                key="completion"
                screenId={5}
                onComplete={handleScreenComplete}
                isSubmitting={isSubmitting}
              />
            )}

          </AnimatePresence>
        </div>

        {/* Compact Neural Charge Bar (fixed bottom-right) */}
        <NeuralChargeBarCompact charge={neuralCharge} />
      </motion.div>
    </>
  );
}