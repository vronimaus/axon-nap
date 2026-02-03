import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Target, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingPlan() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [completedPhases, setCompletedPhases] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          window.location.href = createPageUrl('Landing');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch latest active training plan
  const { data: activePlan } = useQuery({
    queryKey: ['activePlan', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const plans = await base44.entities.TrainingPlan.filter({ 
        user_email: user.email,
        status: 'active'
      }, '-created_date', 1);
      return plans[0] || null;
    },
    enabled: !!user?.email
  });

  // Fetch user performance progress
  const { data: progressData } = useQuery({
    queryKey: ['userProgress', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.UserPerformanceProgress.filter({
        user_email: user.email
      });
    },
    enabled: !!user?.email
  });

  if (isLoading || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="text-slate-400 hover:text-cyan-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-cyan-400">Dein Trainingsplan</h1>
              <p className="text-xs sm:text-sm text-slate-400">Personalisiert nach deinen Baselines</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {!activePlan ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-cyan-500/30 p-8 text-center"
          >
            <Target className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-2">Noch kein aktiver Trainingsplan</h2>
            <p className="text-slate-400 mb-6">
              Starten Sie eine Performance Coaching Session, um einen personalisierten Plan zu erhalten.
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              Zum Dashboard
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Plan Summary */}
            <div className="glass rounded-2xl border border-amber-500/30 p-6 bg-gradient-to-r from-amber-500/10 to-transparent">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-amber-400 mb-2">{activePlan.goal_description || activePlan.goal}</h2>
                  <p className="text-slate-300 mb-4">
                    Dauer: <span className="font-semibold text-amber-400">{activePlan.estimated_duration_weeks} Wochen</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Target className="w-4 h-4 text-cyan-400" />
                      <span>{activePlan.phases?.length || 3} Phasen</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">
                    {Object.values(completedPhases).filter(Boolean).length}/{activePlan.phases?.length || 3}
                  </div>
                  <p className="text-xs text-slate-400">Phasen abgeschlossen</p>
                </div>
              </div>
            </div>

            {/* Phases */}
            <div className="space-y-3">
              {activePlan.phases?.map((phase, idx) => (
                <PhaseCard
                  key={idx}
                  phase={phase}
                  index={idx}
                  isExpanded={expandedPhase === idx}
                  onToggle={() => setExpandedPhase(expandedPhase === idx ? null : idx)}
                  isCompleted={completedPhases[idx]}
                  onComplete={() => setCompletedPhases(prev => ({
                    ...prev,
                    [idx]: !prev[idx]
                  }))}
                />
              ))}
            </div>

            {/* Session Summary */}
            {Object.values(completedPhases).filter(Boolean).length === activePlan.phases?.length && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl border border-green-500/30 p-6 bg-gradient-to-r from-green-500/10 to-transparent"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-bold text-green-400">Session abgeschlossen!</h3>
                </div>
                <p className="text-slate-300 mb-4">
                  Großartig! Jetzt speichern wir deine Ergebnisse.
                </p>
                <Button
                  onClick={() => {
                    toast.success('Feedback wird gespeichert...');
                    // In PerformanceChat würde dieser Button zum SessionFeedbackForm führen
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  Feedback eingeben
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PhaseCard({ phase, index, isExpanded, onToggle, isCompleted, onComplete }) {
  const phaseIcons = {
    hardware: '⚙️',
    software: '🧠',
    integration: '💪'
  };

  const getPhaseColor = (idx) => {
    if (idx === 0) return { bg: 'from-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400' };
    if (idx === 1) return { bg: 'from-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' };
    return { bg: 'from-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' };
  };

  const colors = getPhaseColor(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`glass rounded-xl border transition-all bg-gradient-to-r ${colors.bg} to-transparent ${colors.border}`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="text-2xl">
            {phase.phase_number === 1 ? '🏗️' : phase.phase_number === 2 ? '📈' : '🎯'}
          </div>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>
              {phase.title || `Phase ${phase.phase_number || index + 1}`}
            </h3>
            <p className="text-sm text-slate-400">{phase.duration_weeks || 2} Wochen</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted 
              ? 'bg-green-500/30 border-green-500' 
              : 'border-slate-600'
          }`}>
            {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400" />}
          </div>
          <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-4 space-y-4">
              {/* Phase Description */}
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Fokus:</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{phase.description}</p>
              </div>

              {/* Exercises */}
              {phase.exercises && phase.exercises.length > 0 && (
                <div className="pt-4 border-t border-slate-700/50">
                  <h4 className="font-semibold text-slate-200 mb-3">Übungen:</h4>
                  <div className="space-y-3">
                    {phase.exercises.map((exercise, exIdx) => (
                      <div key={exIdx} className="bg-white/5 rounded-lg p-3">
                        <p className="font-medium text-slate-200">{exercise.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{exercise.sets_reps_tempo}</p>
                        <p className="text-sm text-slate-400 mt-2">{exercise.instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Button */}
              <div className="pt-4 border-t border-slate-700/50 flex gap-2">
                <Button
                  onClick={onComplete}
                  variant={isCompleted ? 'outline' : 'default'}
                  className={`flex-1 ${
                    isCompleted
                      ? 'border-green-500/50 text-green-400'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                  }`}
                >
                  {isCompleted ? '✓ Abgeschlossen' : 'Als erledigt markieren'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}