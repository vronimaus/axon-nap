import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MFRResetScreenDynamic from './DailyTuneUp/MFRResetScreenDynamic';
import NeuroDrillScreen from './DailyTuneUp/NeuroDrillScreen';
import RetestScreen from './DailyTuneUp/RetestScreen';
import IntegrationScreen from './DailyTuneUp/IntegrationScreen';
import NeuralChargeBarCompact from './DailyTuneUp/NeuralChargeBarCompact';

import { base44 } from '@/api/base44Client';

const SCREENS = [
  { id: 0, label: 'MFR Reset', title: 'Hardware-Reset' },
  { id: 1, label: 'Neuro Drill', title: 'Software-Update' },
  { id: 2, label: 'Retest', title: 'Vergleich' },
  { id: 3, label: 'Integration', title: 'Easy Strength' }
];

// Map region names (from InteractiveBodyMapInput) to Node IDs
// Includes view-specific distinctions (front vs back)
const REGION_TO_NODE_ID = {
  // Front-View Regionen
  'Kopf/Stirn': 'N1',
  'Ohr/Kiefergelenk': 'N1',
  'Hals vorne': 'N2',
  'Schulter vorne/Acromion': 'N6',
  'obere Brust/Schlüsselbein': 'N3',
  'Oberarm': 'N6',
  'mittlere Brust': 'N3',
  'Ellenbogen-Beuge': 'N6',
  'Bauch oben': 'N5',
  'Bauch Mitte/Bauchnabel': 'N5',
  'Unterarm/Handgelenk': 'N4',
  'Unterbauch/Becken': 'N7',
  'Becken/Hüfte': 'N7',
  'Oberschenkel vorne': 'N8',
  'Knie vorne': 'N10',
  'Unterschenkel/Schienbein': 'N11',
  'Fuß/Knöchel vorne': 'N12',

  // Back-View Regionen
  'Hinterkopf': 'N1',
  'Nacken seitlich': 'N2',
  'Nacken/obere Halswirbelsäule': 'N2',
  'Schulter hinten/Acromion': 'N6',
  'oberer Rücken/Nacken': 'N3',
  'Schulterblatt': 'N4',
  'oberer Rücken': 'N3',
  'Ellenbogen': 'N4',
  'mittlerer Rücken': 'N5',
  'unterer Rücken/Lendenwirbelsäule': 'N6',
  'Gesäß': 'N7',
  'Oberschenkel hinten': 'N9',
  'Kniekehle': 'N10',
  'Wade': 'N11',
  'Ferse/Achillessehne': 'N12',
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

  // TTS disabled

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
      setCurrentScreen(3);
      // Silent transition
    } else if (screenId === 3) {
      setIntegrationCompleted(true);
      await submitSession(data);
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
          mfr_completed: true,
          neuro_completed: true,
          retest_completed: true,
          integration_completed: true,
          neural_charge: 100,
          notes: 'Daily Tune-Up session completed'
        };
        const history = rehabPlan.feedback_history || [];
        history.push(feedback);
        await base44.entities.RehabPlan.update(rehabPlan.id, { feedback_history: history });
      }

      base44.analytics.track({
        eventName: 'daily_tune_up_completed',
        properties: { user_email: user?.email }
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
            {currentScreen === 3 && (
              <IntegrationScreen
                key="integration"
                nodeId={nodeId}
                screenId={3}
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