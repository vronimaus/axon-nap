import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ThreatLevelScreen from './DailyTuneUp/ThreatLevelScreen';
import MFRResetScreen from './DailyTuneUp/MFRResetScreen';
import NeuroDrillScreen from './DailyTuneUp/NeuroDrillScreen';
import RetestScreen from './DailyTuneUp/RetestScreen';
import IntegrationScreen from './DailyTuneUp/IntegrationScreen';
import NeuralChargeBar from './DailyTuneUp/NeuralChargeBar';
import { useTTS } from '@/hooks/useTTS';
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

  const { isPlaying, playText, stop } = useTTS();

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
      // Coach-Audio nur bei Screen 0 (Intro)
      playText(`Okay, dein Ausgangswert ist ${data.threatLevel}. Jetzt machen wir einen MFR-Reset.`);
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
      await submitSession();
    }
  };

  const submitSession = async () => {
    setIsSubmitting(true);
    try {
      if (!rehabPlan?.id || !user?.email) return;

      // Log session to feedback_history
      const today = new Date().toISOString().split('T')[0];
      const feedback = {
        date: today,
        session_type: 'daily_tune_up',
        threat_level_before: threatLevelBefore,
        threat_level_after: threatLevelAfter,
        improvement: threatLevelBefore - threatLevelAfter,
        neural_charge: 100,
        notes: 'Daily Tune-Up session completed'
      };

      const history = rehabPlan.feedback_history || [];
      history.push(feedback);

      await base44.entities.RehabPlan.update(rehabPlan.id, {
        feedback_history: history
      });

      // Track analytics
      base44.analytics.track({
        eventName: 'daily_tune_up_completed',
        properties: {
          improvement: threatLevelBefore - threatLevelAfter,
          user_email: user.email
        }
      });

      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
      }

      playText('🎉 Session abgeschlossen! Du hast einen großartigen Fortschritt gemacht!');
      
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Session submission error:', error);
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

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed inset-x-0 bottom-0 z-[9999] max-h-[92vh] overflow-y-auto rounded-t-3xl bg-slate-950 border-t border-emerald-500/30 shadow-2xl"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Neural Charge Bar */}
        <NeuralChargeBar charge={neuralCharge} />

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
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

        {/* Screen Content */}
        <div className="px-5 py-6 pb-10 min-h-[60vh]">
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