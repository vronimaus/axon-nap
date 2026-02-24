import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Check, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DailyReadinessCheck from '../components/dashboard/DailyReadinessCheck';
import { Helmet } from 'react-helmet-async';
import RehabPhaseCard from '../components/rehab/RehabPhaseCard';

const WeaknessGenerator = React.lazy(() => import('../components/rehab/WeaknessGenerator'));

export default function RehabPlan() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const [readinessStatus, setReadinessStatus] = useState(null);
  const [activePhaseIdx, setActivePhaseIdx] = useState(0);
  const [completedPhases, setCompletedPhases] = useState({});
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

  const { data: rehabPlan } = useQuery({
    queryKey: ['rehabPlan', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      // Helper: find first plan that has valid phases
      const findValidPlan = async (filter) => {
        try {
          console.log('[RehabPlan] Searching with filter:', filter);
          // Fetch more plans to be safe, and sort by created_date as fallback
          const plans = await base44.entities.RehabPlan.filter(filter, '-created_date', 20);
          console.log('[RehabPlan] Found plans:', plans.length);
          
          for (const plan of plans) {
            console.log('[RehabPlan] Checking plan:', plan.id, 'Status:', plan.status, 'Phases:', plan.phases?.length);
            
            // Skip completed plans so we find the active one
            if (plan.status === 'completed') continue;
            
            // Explicitly check for active status OR missing status (legacy)
            // But if it has phases, we generally want it unless it's completed
            
            if (plan.phases && Array.isArray(plan.phases) && plan.phases.length > 0) {
              console.log('[RehabPlan] Found valid plan:', plan.id);
              return plan;
            }
          }
        } catch (err) {
          console.error('[RehabPlan] Error finding plan:', err);
        }
        return null;
      };

      // Try explicit user_email match first
      const byEmail = await findValidPlan({ user_email: user.email });
      if (byEmail) return byEmail;

      // Fallback: try created_by match
      const byCreator = await findValidPlan({ created_by: user.email });
      if (byCreator) return byCreator;

      // Emergency fallback: try listing recently updated plans and check ownership client-side
      // This helps if the filter indices are somehow broken
      try {
        console.log('[RehabPlan] Trying emergency fallback list...');
        const allRecent = await base44.entities.RehabPlan.list('-updated_date', 20);
        const myPlan = allRecent.find(p => 
          (p.user_email === user.email || p.created_by === user.email) && 
          p.status !== 'completed' &&
          p.phases?.length > 0
        );
        if (myPlan) {
          console.log('[RehabPlan] Found plan via emergency fallback:', myPlan.id);
          return myPlan;
        }
      } catch (e) {
        console.error('[RehabPlan] Emergency fallback failed:', e);
      }

      return null;
    },
    enabled: !!user?.email
  });

  // Sync activePhaseIdx with current plan phase on load
  useEffect(() => {
    if (rehabPlan?.current_phase) {
      setActivePhaseIdx(Math.min((rehabPlan.current_phase || 1) - 1, (rehabPlan.phases?.length || 1) - 1));
    }
  }, [rehabPlan]);

  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ exerciseId, metricValue, notes }) => {
      if (!rehabPlan) return;
      
      const today = new Date().toISOString().split('T')[0];
      const feedback = {
        date: today,
        exercise_id: exerciseId,
        metric_value: metricValue,
        notes
      };

      const history = rehabPlan.feedback_history || [];
      history.push(feedback);

      await base44.entities.RehabPlan.update(rehabPlan.id, {
        feedback_history: history
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
    },
    onError: (error) => {
      console.error('Feedback error:', error);
      toast.error('Fehler beim Speichern des Fortschritts');
    }
  });

  const completeCurrentPhaseMutation = useMutation({
    mutationFn: async () => {
      if (!rehabPlan) return null;

      const currentPhaseNum = rehabPlan.current_phase || 1;
      const nextPhase = currentPhaseNum + 1;
      const isLastPhase = currentPhaseNum >= rehabPlan.phases.length;

      const updateData = {
        current_phase: isLastPhase ? currentPhaseNum : nextPhase,
        status: isLastPhase ? 'completed' : 'active',
        phase_start_date: isLastPhase ? rehabPlan.phase_start_date : new Date().toISOString().split('T')[0]
      };

      await base44.entities.RehabPlan.update(rehabPlan.id, updateData);

      // Track completion
      base44.analytics.track({
        eventName: isLastPhase ? 'rehab_plan_completed' : 'rehab_phase_completed',
        properties: { 
          phase: currentPhaseNum,
          total_phases: rehabPlan.phases.length
        }
      });

      return { isLastPhase, updateData };
    },
    onSuccess: async (result) => {
      if (!result || !user?.email) return;
      
      await queryClient.refetchQueries({ 
        queryKey: ['rehabPlan', user.email],
        type: 'active'
      });
      
      if (result.isLastPhase) {
        toast.success('🎉 Glückwunsch! Du hast alle Phasen abgeschlossen!');
      } else {
        toast.success(`✅ Phase abgeschlossen! Willkommen in Phase ${result.updateData.current_phase}.`);
      }
    },
    onError: (error) => {
      console.error('Phase completion error:', error);
      toast.error('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  });

  const handleReadinessCheckClose = async () => {
    setShowReadinessCheck(false);
    // Mark check as done for today
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem('readiness_check_done', today);
    // Refresh user data to get updated readiness status
    try {
      const updatedUser = await base44.auth.me();
      setReadinessStatus(updatedUser.current_readiness_status);
      setUser(updatedUser);
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  if (!rehabPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
        <div className="max-w-md w-full glass rounded-2xl border border-slate-700 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Noch kein Reha-Plan</h2>
          <p className="text-slate-300 mb-6">
            Starte eine Diagnose im Command-Bereich, um einen personalisierten Plan zu erhalten.
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="w-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          >
            Zum Command
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      <Helmet>
        <title>Rehabilitation - AXON Rehab</title>
        <meta name="description" content={rehabPlan?.problem_summary ? `Dein Wiederherstellungsplan für: ${rehabPlan.problem_summary}` : 'Dein personalisierter AXON Rehabilitationsplan.'} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Readiness Check Modal */}
      <AnimatePresence>
        {showReadinessCheck && (
          <DailyReadinessCheck user={user} onClose={handleReadinessCheckClose} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-emerald-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">
                Rehabilitation
              </h2>
              {rehabPlan.problem_summary && (
                <h1 className="text-xl md:text-2xl font-bold text-emerald-50">
                  {rehabPlan.problem_summary}
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Coach Message & Readiness Bubble - Green Theme */}
        {readinessStatus && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-4 mb-8 pl-1"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
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
                readinessStatus === 'green' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 
                readinessStatus === 'yellow' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 
                'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
              }`} />
            </div>
            
            {/* Speech Bubble */}
            <div className="flex-1 relative">
              {/* Bubble Tail */}
              <div className="absolute top-4 -left-2 w-4 h-4 bg-slate-800/80 border-l border-b border-emerald-500/30 transform rotate-45 z-0" />
              
              <div className="relative z-10 p-5 rounded-2xl rounded-tl-sm bg-[#0B1221] border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                {/* Header line inside bubble */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    readinessStatus === 'green' ? 'text-emerald-400' : 
                    readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {readinessStatus === 'green' ? '● System Ready' : readinessStatus === 'yellow' ? '● Maintenance Mode' : '● Low Battery'}
                  </span>
                </div>
                
                <p className="text-slate-200 text-sm font-medium leading-relaxed">
                   {readinessStatus === 'green' 
                     ? "Dein System ist bereit. Wir können heute vollen Fokus auf die Wiederherstellung legen."
                     : readinessStatus === 'yellow'
                     ? "Wir gehen es heute ruhig an. Fokus: Schmerzlinderung und sanfte Mobilität."
                     : "Rote Ampel. Nur die nötigsten MFR-Übungen. Hör auf deinen Körper."
                   }
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tech Progress Bar - Green Theme */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Progress</span>
               <span className="text-sm font-bold text-white tracking-wide">
                  PHASE {rehabPlan.current_phase || 1} <span className="text-slate-600 mx-1">/</span> {rehabPlan.phases?.length || 3}
               </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              {((rehabPlan.current_phase || 1) / (rehabPlan.phases?.length || 3) * 100).toFixed(0)}% RECOVERED
            </span>
          </div>
          
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-slate-800 z-0" />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((rehabPlan.current_phase || 1) / (rehabPlan.phases?.length || 3)) * 100}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 relative z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
          </div>
        </div>



        {/* Active Phase Card */}
        {rehabPlan.phases && rehabPlan.phases[activePhaseIdx] && (
          <RehabPhaseCard
            phase={rehabPlan.phases[activePhaseIdx]}
            index={activePhaseIdx}
            totalPhases={rehabPlan.phases.length}
            isCompleted={completedPhases[activePhaseIdx] || (activePhaseIdx + 1) < (rehabPlan.current_phase || 1)}
            rehabPlanId={rehabPlan.id}
            queryClient={queryClient}
            onFeedbackSubmit={({ exerciseId, metricValue, notes }) =>
              submitFeedbackMutation.mutate({ exerciseId, metricValue, notes })
            }
            onComplete={() => {
              completeCurrentPhaseMutation.mutate();
            }}
            onNext={() => setActivePhaseIdx(activePhaseIdx + 1)}
            onPrev={() => setActivePhaseIdx(activePhaseIdx - 1)}
          />
        )}

        {/* AI-Powered Weakness Generator (Keep this as extra tool at bottom) */}
        <div className="mt-8 pt-8 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">AI Plan-Optimierung</h3>
            <React.Suspense fallback={<div className="glass rounded-xl p-6 border border-slate-700 text-center text-slate-400">Lädt...</div>}>
              <WeaknessGenerator
              rehabPlan={rehabPlan}
              currentExercises={rehabPlan.phases[activePhaseIdx]?.exercises}
              onExerciseGenerated={async (newExercise) => {
                const updatedPhases = [...rehabPlan.phases];
                updatedPhases[activePhaseIdx].exercises.push({
                  exercise_id: `custom_${Date.now()}`,
                  ...newExercise
                });
                await base44.entities.RehabPlan.update(rehabPlan.id, {
                  phases: updatedPhases
                });
                queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
                }}
                />
            </React.Suspense>
        </div>

      </div>
    </div>
  );
}