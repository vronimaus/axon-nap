import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { AlertCircle, ArrowLeft, Activity, Zap, Zap as ZapIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DailyReadinessCheck from '@/components/dashboard/DailyReadinessCheck';
import { Helmet } from 'react-helmet-async';
import { useTrialStatus } from '@/components/useTrialStatus';
import ExerciseDetailModal from '@/components/rehab/ExerciseDetailModal';
import RehabPhaseCard from '@/components/rehab/RehabPhaseCard';
import DailyTuneUpModal from '@/components/rehab/DailyTuneUpModal';
import RehabPhaseSidebar from '@/components/rehab/RehabPhaseSidebar';
import SessionSummaryCard from '@/components/rehab/SessionSummaryCard';
import PhaseCompletionCard from '@/components/rehab/PhaseCompletionCard';
import ExpertNotesSection from '@/components/rehab/ExpertNotesSection';

export default function RehabPlan() {
  const { hasAccess } = useTrialStatus();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const [readinessStatus, setReadinessStatus] = useState(null);
  const [activePhaseIdx, setActivePhaseIdx] = useState(0);
  const [completedPhases, setCompletedPhases] = useState({});
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [activeModalExercise, setActiveModalExercise] = useState(null);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showDailyTuneUp, setShowDailyTuneUp] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const isBuilderPreview = window.self !== window.top;
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          if (!isBuilderPreview) window.location.href = createPageUrl('Landing');
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
        const isBuilderPreview = window.self !== window.top;
        if (!isBuilderPreview) window.location.href = createPageUrl('Landing');
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
        const plans = await base44.entities.RehabPlan.filter(filter, '-plan_generated_date', 5);
        for (const plan of plans) {
          if (plan.phases && Array.isArray(plan.phases) && plan.phases.length > 0) {
            return plan;
          }
          // Auto-archive broken plans (no phases)
          try {
            await base44.entities.RehabPlan.update(plan.id, { status: 'completed' });
          } catch (_e) { /* ignore */ }
        }
        return null;
      };

      const byEmail = await findValidPlan({ user_email: user.email, status: 'active' });
      if (byEmail) return byEmail;

      // Fallback: check by created_by
      return await findValidPlan({ created_by: user.email, status: 'active' });
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
        toast.success('Glückwunsch! Du hast alle Phasen abgeschlossen!');
      } else {
        toast.success(`Phase abgeschlossen. Willkommen in Phase ${result.updateData.current_phase}.`);
      }
    },
    onError: (error) => {
      console.error('Phase completion error:', error);
      toast.error('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  });

  const handleStartSession = () => {
    const currentPhaseIdx = Math.max(0, (rehabPlan?.current_phase || 1) - 1);
    const currentPhase = rehabPlan?.phases?.[currentPhaseIdx];
    const exercises = currentPhase?.exercises || [];
    setSessionExercises(exercises);
    setActiveExerciseIdx(0);
    setActiveModalExercise(exercises[0] || null);
    setShowIntroModal(false);
    setSessionStarted(true);
  };

  const handleExerciseComplete = (data) => {
    const nextIdx = activeExerciseIdx + 1;
    if (nextIdx < sessionExercises.length) {
      setActiveExerciseIdx(nextIdx);
      setActiveModalExercise(sessionExercises[nextIdx]);
    } else {
      setActiveModalExercise(null);
      setSessionStarted(false);
      toast.success('Session abgeschlossen.');
    }
    if (data?.exercise_id) {
      submitFeedbackMutation.mutate({ exerciseId: data.exercise_id, metricValue: data.pain_level || 0, notes: 'Completed' });
    }
  };

  // Live-Adjust: Übung in laufender Session austauschen
  const handleExerciseSubstituted = async (newExerciseId) => {
    try {
      const results = await base44.entities.Exercise.filter({ exercise_id: newExerciseId });
      const newEx = results?.[0];
      if (newEx) {
        // Ersetze die aktuelle Übung in der Session-Liste
        const updatedSession = [...sessionExercises];
        updatedSession[activeExerciseIdx] = {
          ...updatedSession[activeExerciseIdx],
          exercise_id: newEx.exercise_id,
          name: newEx.name,
          description: newEx.description,
          instruction: newEx.description,
          axon_moment: newEx.axon_moment,
          category: newEx.category,
        };
        setSessionExercises(updatedSession);
        setActiveModalExercise(updatedSession[activeExerciseIdx]);
        toast.success(`Übung getauscht: ${newEx.name}`);
      } else {
        // Kein Exercise-Record gefunden → einfach weiter
        handleExerciseComplete({ exercise_id: sessionExercises[activeExerciseIdx]?.exercise_id });
      }
    } catch (e) {
      console.error('Substitution load error:', e);
    }
    queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
  };

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
    return <div className="min-h-screen bg-[#111111]" />;
  }

  if (!rehabPlan) {
    return (
      <div className="min-h-screen bg-[#111111] p-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-xl border border-white/[0.06] bg-zinc-900/60 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Noch kein Reha-Plan</h2>
          <p className="text-zinc-400 mb-6">
            Starte eine Diagnose im Command-Bereich, um einen personalisierten Plan zu erhalten.
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] text-white"
          >
            Zum Command
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-20 md:pb-6">
      <Helmet>
        <title>Rehabilitation - AXON Rehab</title>
        <meta name="description" content={rehabPlan?.problem_summary ? `Dein Wiederherstellungsplan für: ${rehabPlan.problem_summary}` : 'Dein personalisierter AXON Rehabilitationsplan.'} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Daily Tune-Up Modal */}
      <DailyTuneUpModal
        isOpen={showDailyTuneUp}
        onClose={() => setShowDailyTuneUp(false)}
        rehabPlan={rehabPlan}
        user={user}
        queryClient={queryClient}
        region={rehabPlan?.problem_summary || 'Lenden / Unterer Rücken'}
      />

      {/* Rehab Intro Modal - deactivated, session starts directly */}

      {/* Sequential Exercise Modal */}
      <ExerciseDetailModal
        exercise={activeModalExercise}
        isOpen={!!activeModalExercise && sessionStarted}
        onClose={() => {
          // Closing mid-session: just pause, show session summary
          setActiveModalExercise(null);
          setSessionStarted(false);
        }}
        onComplete={handleExerciseComplete}
        onSubstituted={handleExerciseSubstituted}
        rehabPlanId={rehabPlan?.id}
        queryClient={queryClient}
        totalExercises={sessionExercises.length}
        currentExerciseIdx={activeExerciseIdx}
        isSequential={true}
      />

      {/* Readiness Check Modal */}
      <AnimatePresence>
        {showReadinessCheck && (
          <DailyReadinessCheck user={user} onClose={handleReadinessCheckClose} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#111111] border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Rehabilitation
              </h2>
              {rehabPlan.problem_summary && (
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  {rehabPlan.problem_summary}
                </h1>
              )}
              {rehabPlan.nms_trigger_input && rehabPlan.nms_trigger_output && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium text-zinc-500 border border-white/[0.06] px-2 py-0.5 rounded-full">
                    {rehabPlan.nms_trigger_input}
                  </span>
                  <span className="text-[10px] text-zinc-600">→</span>
                  <span className="text-[10px] font-medium text-zinc-400 border border-white/[0.06] px-2 py-0.5 rounded-full">
                    {rehabPlan.nms_trigger_output}
                  </span>
                </div>
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

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Left Sidebar - Phase Navigation */}
        <div className="hidden lg:flex w-48 flex-col flex-shrink-0 border-r border-white/[0.06] pr-6 pt-6">
          <RehabPhaseSidebar
            phases={rehabPlan.phases}
            activePhaseIdx={activePhaseIdx}
            currentPhaseNum={rehabPlan.current_phase || 1}
            onSelectPhase={setActivePhaseIdx}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-4xl px-4 py-6 space-y-6">
        
        {/* 1. Daily Tune-Up CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Daily Tune-Up</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Starte eine 15-minütige Test-Reset-Retest-Session, um sofort zu spüren, wie effektiv das Protokoll ist.
          </p>
          {readinessStatus === 'red' && (
            <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs font-bold text-red-300 uppercase tracking-widest">System im Erholungsmodus</p>
              </div>
              <p className="text-xs text-red-200/80 leading-relaxed">
                Das ist kein Rückschlag — das ist dein Körper, der dir gerade etwas sehr Wichtiges sagt. 
                Erholung <em>ist</em> Training. Ohne sie stapeln sich Mikro-Stressmuster und du bremst 
                deinen eigenen Fortschritt aus.
              </p>
              <p className="text-xs text-red-200/60 leading-relaxed">
                Heute reicht ein sanfter MFR-Release, um dein Nervensystem zu beruhigen und 
                morgen wieder mit voller Kapazität starten zu können. Du machst genau das Richtige.
              </p>
            </div>
          )}
          {readinessStatus === 'yellow' && (
            <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">Eingeschränkte Kapazität</p>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Dein System ist heute nicht auf 100 % — und das ist völlig normal. Du kannst trainieren, 
                aber hör genau in deinen Körper hinein. Reduziere Intensität und Tempo wo nötig, 
                das schützt dich vor unnötigen Rückschritten.
              </p>
              <p className="text-xs text-amber-200/60 leading-relaxed">
                Fokus heute: Technik über Last, Qualität über Quantität.
              </p>
            </div>
          )}
          <Button
            onClick={() => setShowDailyTuneUp(true)}
            className={`w-full border border-white/[0.06] text-white font-bold ${readinessStatus === 'red' ? 'bg-zinc-900 hover:bg-zinc-800 opacity-70' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            {readinessStatus === 'red' ? 'Nur MFR-Release starten' : 'Tune-Up starten'}
          </Button>
        </motion.div>

        {/* 2. Progress Indicator */}
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Progress</span>
              <span className="text-sm font-bold text-white tracking-wide">
                Phase {rehabPlan.current_phase || 1} <span className="text-zinc-600 mx-1">/</span> {rehabPlan.phases?.length || 3}
              </span>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-20 h-20 flex-shrink-0"
            >
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-800" />
                <motion.circle
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-400"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - ((rehabPlan.current_phase || 1) / (rehabPlan.phases?.length || 3)))}
                  strokeLinecap="round"
                  style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-lg font-bold text-white">
                  {((rehabPlan.current_phase || 1) / (rehabPlan.phases?.length || 3) * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">recovered</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 3. Session Summary Card */}
        {rehabPlan.phases && rehabPlan.phases[activePhaseIdx] && (
          <SessionSummaryCard
            phase={rehabPlan.phases[activePhaseIdx]}
            readinessStatus={readinessStatus}
            onStartSession={handleStartSession}
          />
        )}

        {/* 4. Expert Notes Section */}
        {rehabPlan.phases && rehabPlan.phases[activePhaseIdx] && (
          <ExpertNotesSection phase={rehabPlan.phases[activePhaseIdx]} />
        )}

        {/* 5. Recommended FLOW Routines - before Phase Card */}
        {rehabPlan.recommended_mfr_routines && rehabPlan.recommended_mfr_routines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Unterstützende Routinen</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-3">Diese FLOW-Routinen unterstützen diese Phase:</p>
            <div className="space-y-2">
              {rehabPlan.recommended_mfr_routines.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-white/[0.04]">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-200">{r.routine_name}</p>
                    {r.reason && <p className="text-xs text-zinc-500 mt-0.5">{r.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 6. Phase Detail Card */}
        {rehabPlan.phases && rehabPlan.phases[activePhaseIdx] && (
          <RehabPhaseCard
            phase={rehabPlan.phases[activePhaseIdx]}
            phases={rehabPlan.phases}
            index={activePhaseIdx}
            totalPhases={rehabPlan.phases.length}
            isCompleted={completedPhases[activePhaseIdx] || (activePhaseIdx + 1) < (rehabPlan.current_phase || 1)}
            rehabPlanId={rehabPlan.id}
            queryClient={queryClient}
            hasAccess={hasAccess}
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

        {/* 7. Phase Completion Card - show when phase completed */}
        {rehabPlan.phases && rehabPlan.phases[activePhaseIdx] && (activePhaseIdx + 1) < (rehabPlan.current_phase || 1) && (
          <PhaseCompletionCard
            currentPhase={activePhaseIdx + 1}
            nextPhase={rehabPlan.phases[activePhaseIdx + 1]}
            isLastPhase={activePhaseIdx + 1 >= rehabPlan.phases.length}
            onNext={() => setActivePhaseIdx(activePhaseIdx + 1)}
          />
        )}

        </div>
      </div>
    </div>
  );
}