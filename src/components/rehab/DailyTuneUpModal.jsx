import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MFRResetScreenDynamic from './DailyTuneUp/MFRResetScreenDynamic';
import NeuroDrillScreen from './DailyTuneUp/NeuroDrillScreen';
import RetestScreen from './DailyTuneUp/RetestScreen';
import IntegrationScreen from './DailyTuneUp/IntegrationScreen';
import NeuralChargeBar from './DailyTuneUp/NeuralChargeBar';

import { base44 } from '@/api/base44Client';

const SCREENS = [
  { id: 0, label: 'MFR Reset', title: 'Hardware-Reset' },
  { id: 1, label: 'Neuro Drill', title: 'Software-Update' },
  { id: 2, label: 'Retest', title: 'Vergleich' },
  { id: 3, label: 'Integration', title: 'Easy Strength' }
];

export default function DailyTuneUpModal({
  isOpen,
  onClose,
  rehabPlan,
  user,
  queryClient,
  nodeId = 'N4', // Default zu Lendenwirbelsäule, aber über Props übergebar
}) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [mfrNodeCompleted, setMFRNodeCompleted] = useState(false);
  const [neuroDrillCompleted, setNeuroDrillCompleted] = useState(false);
  const [retestCompleted, setRetestCompleted] = useState(false);
  const [integrationCompleted, setIntegrationCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent border-b border-emerald-500/20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">
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

        {/* Neural Charge Bar */}
        <div className="px-5 py-4">
          <NeuralChargeBar charge={neuralCharge} />
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
                screenId={1}
                onComplete={handleScreenComplete}
              />
            )}
            {currentScreen === 2 && (
              <RetestScreen
                key="retest"
                screenId={2}
                onComplete={handleScreenComplete}
              />
            )}
            {currentScreen === 3 && (
              <IntegrationScreen
                key="integration"
                screenId={3}
                onComplete={handleScreenComplete}
                isSubmitting={isSubmitting}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}