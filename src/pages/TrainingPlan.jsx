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
import { Helmet } from 'react-helmet-async';
import PhaseCard from '../components/performance/PhaseCard';
import { User } from 'lucide-react';

export default function TrainingPlan() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhaseIdx, setActivePhaseIdx] = useState(0);
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
        
        // Check if readiness check already done today (via sessionStorage)
        const today = new Date().toISOString().split('T')[0];
        const checkDone = sessionStorage.getItem('readiness_check_done');
        
        if (checkDone !== today) {
          const lastCheck = currentUser.last_readiness_check;
          if (lastCheck !== today) {
            setShowReadinessCheck(true);
          } else {
            setReadinessStatus(currentUser.current_readiness_status);
            sessionStorage.setItem('readiness_check_done', today);
          }
        } else {
          setReadinessStatus(currentUser.current_readiness_status);
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
    // Mark check as done for today
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem('readiness_check_done', today);
    // Refresh user data to get updated readiness status
    try {
      const updatedUser = await base44.auth.me();
      setReadinessStatus(updatedUser.current_readiness_status);
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
      <Helmet>
        <title>Trainingsplan - AXON Performance</title>
        <meta name="description" content={activePlan ? `Dein personalisierter Trainingsplan: ${activePlan.goal_description}` : 'Dein AXON Performance Trainingsplan für optimale Ergebnisse.'} />
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="AXON Trainingsplan" />
        <meta property="og:description" content={activePlan ? `Personalisierter Plan: ${activePlan.goal_description}` : 'Dein Performance Trainingsplan'} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
                Dein Trainingsplan
              </h1>
              {activePlan?.goal_description && (
                <p className="text-sm text-slate-400 mt-1">
                  Ziel: <strong>{activePlan.goal_description}</strong>
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
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
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Coach Message & Readiness */}
            {activePlan && readinessStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-lg"
              >
                {/* Background Glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-cyan-500/30 bg-slate-950 p-1 flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-cyan-900/20 flex items-center justify-center overflow-hidden">
                       {/* Placeholder for Coach Avatar or Icon */}
                       {user?.photo_url ? (
                         <img src={user.photo_url} alt="Coach" className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-6 h-6 text-cyan-400" />
                       )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                     {/* Dynamic Message based on Readiness */}
                     <div className="glass-cyan inline-flex px-3 py-1 rounded-full text-xs font-medium text-cyan-300 mb-2 border border-cyan-500/20">
                        {readinessStatus === 'green' ? 'System bereit' : readinessStatus === 'yellow' ? 'System braucht Pflege' : 'Akku leer'}
                     </div>
                     <p className="text-slate-200 font-medium leading-relaxed">
                       {readinessStatus === 'green' 
                         ? `Dein System ist bereit. Fokus heute: ${activePlan.goal_description || 'Maximale Performance'}.`
                         : readinessStatus === 'yellow'
                         ? "Dein System signalisiert Bedarf an Pflege. Fokus heute: Mobilität & Stabilität."
                         : "Rote Ampel. Fokus heute: Aktive Regeneration & Reset."
                       }
                     </p>
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


                {/* Progress Indicator */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-slate-300">
                      Phase {activePlan.current_phase || 1} von {activePlan.phases?.length || 3}
                    </span>
                    <span className="text-xs text-slate-500">
                      {activePlan.estimated_duration_weeks} Wochen · Gestartet {activePlan.plan_generated_date ? new Date(activePlan.plan_generated_date).toLocaleDateString('de-DE') : '–'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((activePlan.current_phase || 1) / (activePlan.phases?.length || 3)) * 100}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                    />
                  </div>
                </div>





                {/* Sequential Phase Navigation */}
                {activePlan.phases && activePlan.phases.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {activePlan.phases.map((phase, idx) => {
                      const isLocked = idx > 0 && !completedPhases[idx - 1];
                      const isDone = completedPhases[idx];
                      return (
                        <button
                          key={idx}
                          onClick={() => !isLocked && setActivePhaseIdx(idx)}
                          disabled={isLocked}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            activePhaseIdx === idx
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                              : isDone
                              ? 'bg-green-500/10 border-green-500/40 text-green-400'
                              : isLocked
                              ? 'border-slate-700 text-slate-600 cursor-not-allowed'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {isDone ? '✓ ' : isLocked ? '🔒 ' : ''}{phase.title || `Phase ${idx + 1}`}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Active Phase Card */}
                {activePlan.phases && activePlan.phases[activePhaseIdx] && (
                  <PhaseCard
                    phase={activePlan.phases[activePhaseIdx]}
                    index={activePhaseIdx}
                    totalPhases={activePlan.phases.length}
                    isCompleted={completedPhases[activePhaseIdx]}
                    onComplete={() => {
                      const newCompleted = { ...completedPhases, [activePhaseIdx]: true };
                      setCompletedPhases(newCompleted);
                      toast.success('Phase abgeschlossen! 🎉');
                      if (activePhaseIdx < activePlan.phases.length - 1) {
                        setTimeout(() => setActivePhaseIdx(activePhaseIdx + 1), 600);
                      }
                    }}
                    onNext={() => setActivePhaseIdx(activePhaseIdx + 1)}
                    onPrev={() => setActivePhaseIdx(activePhaseIdx - 1)}
                    onExerciseClick={(exercise) => setSelectedExercise(exercise)}
                  />
                )}

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
            <div className="flex items-center justify-center min-h-[50vh]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full glass rounded-2xl border border-slate-700 p-8 text-center"
              >
                <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Kein aktiver Trainingsplan</h2>
                <p className="text-slate-300 mb-6">
                  Starte eine Performance Coaching Session, um deinen personalisierten Plan zu erstellen.
                </p>
                <Button
                  onClick={() => window.location.href = createPageUrl('Dashboard')}
                  className="w-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                >
                  Zum Dashboard
                </Button>
              </motion.div>
            </div>
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



// ReadinessBanner removed (replaced by Coach Message)

// PhaseCard was here (moved to component)