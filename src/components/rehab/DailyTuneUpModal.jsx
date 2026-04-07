import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ThreatLevelScreen from './DailyTuneUp/ThreatLevelScreen';
import MFRResetScreen from './DailyTuneUp/MFRResetScreen';
import NeuroDrillScreen from './DailyTuneUp/NeuroDrillScreen';
import RetestScreen from './DailyTuneUp/RetestScreen';
import IntegrationScreen from './DailyTuneUp/IntegrationScreen';
import NeuralChargeBar from './DailyTuneUp/NeuralChargeBar';

import { base44 } from '@/api/base44Client';

const SCREENS = [
  { id: 0, label: 'Baseline Test', title: 'Dein Threat Level' },
  { id: 1, label: 'MFR Reset', title: 'Hardware-Reset' },
  { id: 2, label: 'Neuro Drill', title: 'Software-Update' },
  { id: 3, label: 'Retest', title: 'Vergleich' },
  { id: 4, label: 'Integration', title: 'Easy Strength' }
];

export default function DailyTuneUpModal({
  isOpen,
  onClose,
  rehabPlan,
  user,
  queryClient,
}) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [threatLevelBefore, setThreatLevelBefore] = useState(null);
  const [threatLevelAfter, setThreatLevelAfter] = useState(null);
  const [mfrNodeCompleted, setMFRNodeCompleted] = useState(false);
  const [neuroDrillCompleted, setNeuroDrillCompleted] = useState(false);
  const [integrationCompleted, setIntegrationCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TTS disabled

  // Calculate neural charge (0-100%)
  const neuralCharge = (() => {
    let charge = 0;
    if (threatLevelBefore !== null) charge += 20;
    if (mfrNodeCompleted) charge += 20;
    if (neuroDrillCompleted) charge += 20;
    if (threatLevelAfter !== null) charge += 20;
    if (integrationCompleted) charge += 20;
    return charge;
  })();

  const handleScreenComplete = async (screenId, data) => {
    if (screenId === 0) {
      setThreatLevelBefore(data.threatLevel);
      setCurrentScreen(1);
    } else if (screenId === 1) {
      setMFRNodeCompleted(true);
      setCurrentScreen(2);
      // Silent transition
    } else if (screenId === 2) {
      setNeuroDrillCompleted(true);
      setCurrentScreen(3);
      // Silent transition
    } else if (screenId === 3) {
      setThreatLevelAfter(data.threatLevel);
      setCurrentScreen(4);
      // Silent transition
    } else if (screenId === 4) {
      setIntegrationCompleted(true);
      await submitSession(threatLevelBefore, threatLevelAfter ?? data?.threatLevel);
    }
  };

  const submitSession = async (before, after) => {
    setIsSubmitting(true);
    const improvement = (before ?? 0) - (after ?? 0);
    try {
      if (rehabPlan?.id && user?.email) {
        const today = new Date().toISOString().split('T')[0];
        const feedback = {
          date: today,
          session_type: 'daily_tune_up',
          threat_level_before: before,
          threat_level_after: after,
          improvement,
          neural_charge: 100,
          notes: 'Daily Tune-Up session completed'
        };
        const history = rehabPlan.feedback_history || [];
        history.push(feedback);
        await base44.entities.RehabPlan.update(rehabPlan.id, { feedback_history: history });
      }

      base44.analytics.track({
        eventName: 'daily_tune_up_completed',
        properties: { improvement, user_email: user?.email }
      });

      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
      }

      // Smart outcome: improvement ≥ 2 → flow, else → rehab plan
      const noImprovement = improvement < 2;
      setTimeout(() => {
        onClose({ noImprovement });
      }, 2000);
    } catch (error) {
      console.error('Session submission error:', error);
      setTimeout(() => onClose({ noImprovement: false }), 1000);
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
              <ThreatLevelScreen
                key="threat-before"
                onComplete={handleScreenComplete}
                isFirst={true}
                threat={threatLevelBefore}
              />
            )}
            {currentScreen === 1 && (
              <MFRResetScreen
                key="mfr"
                onComplete={handleScreenComplete}
                rehabPlan={rehabPlan}
              />
            )}
            {currentScreen === 2 && (
              <NeuroDrillScreen
                key="neuro"
                onComplete={handleScreenComplete}
              />
            )}
            {currentScreen === 3 && (
              <RetestScreen
                key="threat-after"
                onComplete={handleScreenComplete}
                threatBefore={threatLevelBefore}
              />
            )}
            {currentScreen === 4 && (
              <IntegrationScreen
                key="integration"
                onComplete={handleScreenComplete}
                isSubmitting={isSubmitting}
                improvement={threatLevelAfter ? threatLevelBefore - threatLevelAfter : 0}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}