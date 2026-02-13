import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { ArrowLeft, Zap, Target, CheckCircle2, Clock, Info, TrendingUp, Sparkles, Loader2, MessageSquareText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import GoalCard from '../components/performance/GoalCard';
import ExerciseDetailModal from '../components/performance/ExerciseDetailModal';
import TrainingPlanChat from '../components/performance/TrainingPlanChat';
import DailyReadinessCheck from '../components/dashboard/DailyReadinessCheck';

export default function TrainingPlan() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [completedPhases, setCompletedPhases] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showComplementaryDrills, setShowComplementaryDrills] = useState(true);
  const [isAcceptingDrills, setIsAcceptingDrills] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const [readinessStatus, setReadinessStatus] = useState(null);
  
  const queryClient = useQueryClient();
  


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          window.location.href = createPageUrl('Landing');
          return;
        }
        setUser(currentUser);
        
        // Check if readiness check needed for today
        const today = new Date().toISOString().split('T')[0];
        const lastCheck = currentUser.last_readiness_check;
        
        if (lastCheck !== today) {
          setShowReadinessCheck(true);
        } else {
          setReadinessStatus(currentUser.daily_readiness_status);
        }
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



  const handleAcceptComplementaryDrills = async (planId) => {
    setIsAcceptingDrills(true);
    try {
      await base44.entities.TrainingPlan.update(planId, {
        complementary_drills_accepted: true
      });
      
      base44.analytics.track({
        eventName: 'complementary_drills_accepted',
        properties: { plan_goal: activePlan?.goal_description }
      });
      
      await queryClient.invalidateQueries({ queryKey: ['activePlan'] });
      toast.success('Ergänzende Übungen wurden zu deinem Plan hinzugefügt!');
    } catch (error) {
      console.error('Error accepting drills:', error);
      toast.error('Fehler beim Hinzufügen der Übungen');
    } finally {
      setIsAcceptingDrills(false);
    }
  };

  const handleDeclineComplementaryDrills = async (planId) => {
    try {
      await base44.entities.TrainingPlan.update(planId, {
        complementary_drills_accepted: false
      });
      setShowComplementaryDrills(false);
      toast.success('Du konzentrierst dich auf dein Hauptziel');
    } catch (error) {
      console.error('Error declining drills:', error);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  const handleReadinessCheckClose = async () => {
    setShowReadinessCheck(false);
    // Refresh user data to get updated readiness status
    try {
      const updatedUser = await base44.auth.me();
      setReadinessStatus(updatedUser.daily_readiness_status);
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

  const categoryLabels = {
    'mobility': 'Mobilität',
    'neuro_drill': 'Neuro-Drill',
    'fascial_release': 'Faszien-Release',
    'corrective': 'Korrektur'
  };

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

      {/* Readiness Check Modal */}
      <AnimatePresence>
        {showReadinessCheck && (
          <DailyReadinessCheck user={user} onClose={handleReadinessCheckClose} />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Readiness Recommendation */}
            {readinessStatus && readinessStatus !== 'green' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-xl p-6 border ${
                  readinessStatus === 'yellow' 
                    ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent'
                    : 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
                    readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'
                  }`} />
                  <div>
                    <h3 className={`font-bold mb-2 ${
                      readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {readinessStatus === 'yellow' 
                        ? 'Dein System ist heute im Pflegemodus' 
                        : 'Heute: Recovery First'}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                      {readinessStatus === 'yellow'
                        ? 'Basierend auf deinem Daily Check empfehlen wir dir heute eine sanfte Mobilitäts-Routine statt intensivem Training. Dein Körper braucht Pflege, keine Belastung.'
                        : 'Dein System ist heute im roten Bereich. Wir empfehlen dir dringend, heute auf intensives Training zu verzichten und dich auf Entspannung und Schmerz-Release zu konzentrieren.'}
                    </p>
                    <Button
                      onClick={() => window.location.href = createPageUrl('FlowRoutines')}
                      size="sm"
                      className={readinessStatus === 'yellow'
                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/50'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'}
                    >
                      Zu den Mobility Flows
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {activePlan ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Complementary Drills Suggestion */}
                {activePlan.suggested_complementary_drills?.length > 0 && 
                 !activePlan.complementary_drills_accepted && 
                 showComplementaryDrills && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-6 border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-transparent"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-cyan-400 mb-2">
                          Möchtest du ergänzende Übungen für maximale Longevity?
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed mb-3">
                          Basierend auf deinem Ziel und deinem Neuro-Profil haben wir {activePlan.suggested_complementary_drills.length} intelligente 
                          Ergänzungen identifiziert, die deine funktionelle Gesundheit langfristig unterstützen.
                        </p>
                        <div className="space-y-2 mb-4">
                          {activePlan.suggested_complementary_drills.map((drill, idx) => (
                            <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-cyan-400 font-semibold">
                                  {categoryLabels[drill.category]?.charAt(0) || idx + 1}
                                </div>
                                <div className="flex-1">
                                  <button onClick={() => setSelectedExercise(drill)} className="text-left w-full">
                                    <p className="font-medium text-slate-200 hover:text-cyan-400 transition-colors">{drill.name}</p>
                                    <p className="text-xs text-slate-400 mt-1">{drill.rationale}</p>
                                    {drill.frequency && (
                                      <p className="text-xs text-cyan-400 mt-1">
                                        Empfohlen: {drill.frequency} • {drill.duration}
                                      </p>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={() => handleAcceptComplementaryDrills(activePlan.id)}
                            disabled={isAcceptingDrills}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                          >
                            {isAcceptingDrills ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Füge hinzu...</>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4 mr-2" /> Ja, zu meinem Plan hinzufügen</>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeclineComplementaryDrills(activePlan.id)}
                            className="border-slate-600 text-slate-400 hover:text-slate-200"
                          >
                            Nein, nur auf mein Hauptziel fokussieren
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

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

                {/* Accepted Complementary Drills */}
                {activePlan.complementary_drills_accepted && activePlan.suggested_complementary_drills?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-transparent p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-cyan-400">Ergänzende Übungen für Longevity</h3>
                        <p className="text-xs text-slate-400">Zusätzlich zu deinen Hauptphasen</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {activePlan.suggested_complementary_drills.map((drill, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedExercise(drill)}
                          className="w-full bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-xs text-cyan-400 font-semibold">
                              {categoryLabels[drill.category]?.charAt(0) || (idx + 1)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-200">{drill.name}</h4>
                              <p className="text-sm text-slate-400 mt-1">{drill.rationale}</p>
                              {drill.frequency && (
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span className="text-cyan-400">{drill.frequency}</span>
                                  <span className="text-slate-500">{drill.duration}</span>
                                </div>
                              )}
                            </div>
                            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

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
                      toast.success(completedPhases[idx] ? 'Als nicht erledigt markiert' : 'Phase abgeschlossen!');
                    }}
                    onExerciseClick={(exercise) => setSelectedExercise(exercise)}
                  />
                ))}

                {/* Chat with Coach Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquareText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-purple-400 mb-2">Fragen zu deinem Plan?</h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Dein Performance Coach kann dir weitere Fragen beantworten, den Plan anpassen oder zusätzliche Übungen erklären.
                      </p>
                      <Button
                        onClick={() => setShowChat(!showChat)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      >
                        {showChat ? 'Chat schließen' : 'Mit Coach chatten'}
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Inline Chat Component */}
                <AnimatePresence>
                  {showChat && activePlan && (
                    <TrainingPlanChat activePlan={activePlan} />
                  )}
                </AnimatePresence>
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
      </div>

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <ExerciseDetailModal
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}



function PhaseCard({ phase, index, isExpanded, onToggle, isCompleted, onComplete, onExerciseClick }) {
  const getPhaseColor = (idx) => {
    if (idx === 0) return { bg: 'from-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: Target };
    if (idx === 1) return { bg: 'from-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: TrendingUp };
    return { bg: 'from-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', icon: Zap };
  };

  const colors = getPhaseColor(index);
  const PhaseIcon = colors.icon;

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
          <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
            <PhaseIcon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>
              {phase.title || `Phase ${phase.phase_number || index + 1}`}
            </h3>
            <p className="text-sm text-slate-400">
              {phase.duration_weeks || 2} Wochen · {phase.exercises?.length || 0} Übungen
            </p>
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
                  <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Übungen
                  </h4>
                  <div className="space-y-3">
                    {phase.exercises.map((exercise, exIdx) => (
                      <button
                        key={exIdx}
                        onClick={() => onExerciseClick(exercise)}
                        className="w-full bg-white/5 hover:bg-white/10 rounded-lg p-4 text-left transition-all group border border-transparent hover:border-cyan-500/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                              {exercise.name}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{exercise.sets_reps_tempo}</p>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 group-hover:text-cyan-400 transition-colors">
                            <Info className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2">{exercise.instruction?.split('\n')[0]}</p>
                      </button>
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
                  {isCompleted ? 'Abgeschlossen' : 'Als erledigt markieren'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}