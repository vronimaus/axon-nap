import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Zap, Target, CheckCircle2, Clock, AlertCircle, Activity } from 'lucide-react';
import { toast } from 'sonner';
import GoalCard from '../components/performance/GoalCard';

export default function TrainingPlan() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [completedPhases, setCompletedPhases] = useState({});
  
  // Get tab from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'rehab');

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

  // Fetch Performance Goals
  const { data: goals = [] } = useQuery({
    queryKey: ['performanceGoals'],
    queryFn: () => base44.entities.PerformanceGoal.list(),
    enabled: !!user?.email
  });

  // Fetch Rehab Routines (exclude predefined Flow routines)
  const { data: routines } = useQuery({
    queryKey: ['routines', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allRoutines = await base44.entities.Routine.filter({ 
        created_by: user.email
      }, '-created_date');
      // Filter out predefined Flow routines (wakeup, full_reset, evening)
      return allRoutines.filter(r => 
        !['wakeup', 'full_reset', 'evening'].includes(r.category)
      );
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="rehab" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Rehab
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance">
            {activePlan ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Plan Header */}
                <div className="glass rounded-2xl border border-amber-500/30 p-6 bg-gradient-to-r from-amber-500/10 to-transparent">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-amber-400 mb-1">{activePlan.goal_description}</h2>
                      <p className="text-slate-400 text-sm">
                        {activePlan.estimated_duration_weeks} Wochen Plan · Phase {activePlan.current_phase || 1}/{activePlan.phases?.length || 3}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">Gestartet</div>
                      <div className="text-sm text-slate-300">{new Date(activePlan.plan_generated_date).toLocaleDateString('de-DE')}</div>
                    </div>
                  </div>
                </div>

                {/* Phases */}
                {activePlan.phases?.map((phase, idx) => (
                  <PhaseCard
                    key={idx}
                    phase={phase}
                    index={idx}
                    isExpanded={expandedPhase === idx}
                    onToggle={() => setExpandedPhase(expandedPhase === idx ? null : idx)}
                    isCompleted={completedPhases[idx]}
                    onComplete={() => {
                      setCompletedPhases({ ...completedPhases, [idx]: !completedPhases[idx] });
                      toast.success(completedPhases[idx] ? 'Als nicht erledigt markiert' : 'Phase abgeschlossen! 🎉');
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl border border-cyan-500/30 p-8 text-center"
              >
                <Target className="w-16 h-16 text-amber-400 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-2">Kein aktiver Trainingsplan</h2>
                <p className="text-slate-400 mb-6">
                  Starte eine Performance Coaching Session, um deinen personalisierten Plan zu erstellen.
                </p>
                <Button
                  onClick={() => window.location.href = createPageUrl('Dashboard')}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                >
                  Zum Dashboard
                </Button>
              </motion.div>
            )}
          </TabsContent>

          {/* Rehab Tab */}
          <TabsContent value="rehab">
            {!routines || routines.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl border border-cyan-500/30 p-8 text-center"
              >
                <Activity className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-2">Keine Rehab-Routinen vorhanden</h2>
                <p className="text-slate-400 mb-6">
                  Starte eine Diagnose-Session, um personalisierte Rehab-Übungen zu erhalten.
                </p>
                <Button
                  onClick={() => window.location.href = createPageUrl('Dashboard')}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
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
                {routines.map((routine, idx) => (
                  <RoutineCard key={routine.id} routine={routine} index={idx} />
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RoutineCard({ routine, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="text-2xl">{routine.icon || '🎯'}</div>
          <div>
            <h3 className="font-semibold text-purple-400">{routine.routine_name}</h3>
            <p className="text-sm text-slate-400">{routine.total_duration} Min · {routine.sequence?.length || 0} Übungen</p>
          </div>
        </div>
        <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
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
              {routine.description && (
                <div>
                  <p className="text-sm text-slate-400 leading-relaxed">{routine.description}</p>
                </div>
              )}

              {routine.sequence && routine.sequence.length > 0 && (
                <div className="pt-4 border-t border-slate-700/50">
                  <h4 className="font-semibold text-slate-200 mb-3">Übungen:</h4>
                  <div className="space-y-3">
                    {routine.sequence.map((step, stepIdx) => (
                      <div key={stepIdx} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-200">
                            {step.type === 'mfr' && '🔨 Hardware'}
                            {step.type === 'neuro' && '🧠 Software'}
                            {step.type === 'strength' && '💪 Integration'}
                            {step.type === 'breath' && '🌬️ Atem'}
                            {step.type === 'mobility' && '🤸 Mobilität'}
                          </p>
                          <span className="text-xs text-slate-500">{step.duration_seconds}s</span>
                        </div>
                        <p className="text-sm text-slate-400">{step.instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-700/50">
                <Button
                  onClick={() => {
                    // Start routine flow
                    toast.success('Routine wird gestartet...');
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  Routine starten
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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