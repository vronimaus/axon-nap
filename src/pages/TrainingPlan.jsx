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
              <h2 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-1">
                Trainingsplan
              </h2>
              {activePlan?.goal_description && (
                <h1 className="text-xl md:text-2xl font-bold text-cyan-50">
                  {activePlan.goal_description}
                </h1>
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
            {/* Coach Message & Readiness Bubble */}
            {activePlan && readinessStatus && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-4 mb-8 pl-1"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/36d608561_Gemini_Generated_Image_y1tl62y1tl62y1tl.png" 
                        alt="Coach" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  {/* Status Indicator Dot */}
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${
                    readinessStatus === 'green' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 
                    readinessStatus === 'yellow' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 
                    'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                  }`} />
                </div>
                
                {/* Speech Bubble */}
                <div className="flex-1 relative">
                  {/* Bubble Tail */}
                  <div className="absolute top-4 -left-2 w-4 h-4 bg-slate-800/80 border-l border-b border-cyan-500/30 transform rotate-45 z-0" />
                  
                  <div className="relative z-10 p-5 rounded-2xl rounded-tl-sm bg-[#0B1221] border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                    {/* Header line inside bubble */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        readinessStatus === 'green' ? 'text-green-400' : 
                        readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {readinessStatus === 'green' ? '● System Ready' : readinessStatus === 'yellow' ? '● Maintenance Mode' : '● Low Battery'}
                      </span>
                    </div>
                    
                    <p className="text-slate-200 text-sm font-medium leading-relaxed">
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


                {/* Tech Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Progress</span>
                       <span className="text-sm font-bold text-white tracking-wide">
                          PHASE {activePlan.current_phase || 1} <span className="text-slate-600 mx-1">/</span> {activePlan.phases?.length || 3}
                       </span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {(activePlan.current_phase / (activePlan.phases?.length || 3) * 100).toFixed(0)}% SYNC
                    </span>
                  </div>
                  
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-800 z-0" />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((activePlan.current_phase || 1) / (activePlan.phases?.length || 3)) * 100}%` }}
                      className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 relative z-10 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    />
                  </div>
                </div>





                {/* Sequential Phase Navigation */}
                {activePlan.phases && activePlan.phases.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {activePlan.phases.map((phase, idx) => {
                      const isLocked = idx > 0 && !completedPhases[idx - 1];
                      const isDone = completedPhases[idx];
                      const isActive = activePhaseIdx === idx;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => !isLocked && setActivePhaseIdx(idx)}
                          disabled={isLocked}
                          className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                            isActive
                              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                              : isDone
                              ? 'bg-slate-900 border-green-900/50 text-green-500'
                              : isLocked
                              ? 'bg-slate-900/50 border-slate-800 text-slate-700 cursor-not-allowed'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
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
                  className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  Zum Dashboard
                </Button>
              </motion.div>
            </div>
            )}
      </div>

      </div>
      );
      }



// ReadinessBanner removed (replaced by Coach Message)

// PhaseCard was here (moved to component)