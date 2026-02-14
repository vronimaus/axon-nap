import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ChevronDown, Check, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DailyReadinessCheck from '../components/dashboard/DailyReadinessCheck';
const ExerciseCoachingPanel = React.lazy(() => import('../components/rehab/ExerciseCoachingPanel'));
const WeaknessGenerator = React.lazy(() => import('../components/rehab/WeaknessGenerator'));

export default function RehabPlan() {
  const [user, setUser] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
        
        // Always show readiness check on RehabPlan page
        setShowReadinessCheck(true);
        setReadinessStatus(currentUser.current_readiness_status);
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
      const plans = await base44.entities.RehabPlan.filter({
        user_email: user.email
      }, '-plan_generated_date', 1);
      return plans[0] || null;
    },
    enabled: !!user?.email
  });

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
      toast.success('Fortschritt gespeichert!');
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

      console.log('Updating phase:', { currentPhaseNum, nextPhase, isLastPhase, updateData });
      const result = await base44.entities.RehabPlan.update(rehabPlan.id, updateData);
      console.log('Phase update result:', result);

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
      
      console.log('Success! Refetching with correct queryKey...');
      // Warte auf den Refetch mit der exakten queryKey
      await queryClient.refetchQueries({ 
        queryKey: ['rehabPlan', user.email],
        type: 'active'
      });
      
      console.log('Refetch complete, plan updated');
      
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

  const getAveragePainLevel = () => {
    if (!rehabPlan?.feedback_history?.length) return null;
    
    const recent = rehabPlan.feedback_history.slice(-10);
    const sum = recent.reduce((acc, f) => acc + (f.metric_value || 0), 0);
    return (sum / recent.length).toFixed(1);
  };

  const getDaysInCurrentPhase = () => {
    if (!rehabPlan?.phase_start_date) return 0;
    const start = new Date(rehabPlan.phase_start_date);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  const handleReadinessCheckClose = async () => {
    setShowReadinessCheck(false);
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
          <h2 className="text-xl font-bold text-white mb-2">Noch kein Trainingsplan</h2>
          <p className="text-slate-300 mb-6">
            Starte eine Diagnose im Command-Bereich, um einen personalisierten Plan zu erhalten.
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
          >
            Zum Command
          </Button>
        </div>
      </div>
    );
  }

  // Show completion banner only if status is explicitly 'completed'
  const showCompletionBanner = rehabPlan.status === 'completed';

  const currentPhaseIndex = (rehabPlan.current_phase || 1) - 1;
  const currentPhase = rehabPlan.phases[currentPhaseIndex] || rehabPlan.phases[0];

  if (!currentPhase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
        <div className="max-w-md w-full glass rounded-2xl border border-slate-700 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Plan-Fehler</h2>
          <p className="text-slate-300 mb-6">
            Der Trainingsplan hat keine Phasen. Bitte erstelle einen neuen Plan.
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
          >
            Zum Command
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Readiness Check Modal */}
      <AnimatePresence>
        {showReadinessCheck && (
          <DailyReadinessCheck user={user} onClose={handleReadinessCheckClose} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                Dein Wiederherstellungsplan
              </h1>
              {rehabPlan.problem_summary && (
                <p className="text-sm text-slate-400 mt-1">
                  Problem: <strong>{rehabPlan.problem_summary}</strong>
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Readiness Recommendation */}
        {readinessStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 glass rounded-xl p-6 border ${
              readinessStatus === 'green' 
                ? 'border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent'
                : readinessStatus === 'yellow'
                ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-transparent'
                : 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              {readinessStatus === 'green' ? (
                <Check className="w-6 h-6 flex-shrink-0 text-green-400" />
              ) : readinessStatus === 'yellow' ? (
                <AlertTriangle className="w-6 h-6 flex-shrink-0 text-yellow-400" />
              ) : (
                <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-400" />
              )}
              <div>
                {readinessStatus === 'green' && (
                  <>
                    <h3 className="font-bold text-green-400 mb-2">Top-Form erkannt! 💪</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                      Dein System ist heute bereit für volle Performance. Du kannst alle Übungen wie geplant durchführen.
                    </p>
                  </>
                )}
                {readinessStatus === 'yellow' && (
                  <>
                    <h3 className="font-bold text-yellow-400 mb-2">Moderate Belastung empfohlen ⚡</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Dein System braucht heute etwas Schonung. Fokussiere dich auf leichte Mobilität und MFR-Übungen. Reduziere Intensität und Wiederholungen bei Kraftübungen um 30-50%.
                    </p>
                  </>
                )}
                {readinessStatus === 'red' && (
                  <>
                    <h3 className="font-bold text-red-400 mb-2">Erholung priorisieren 🛑</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Dein System ist im Regenerationsmodus. Fokussiere dich heute ausschließlich auf sanfte MFR-Arbeit und Atemübungen. Krafttraining sollte pausiert werden.
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Completion Banner */}
        {showCompletionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass rounded-2xl border border-green-500/30 p-6 bg-gradient-to-br from-green-500/10 to-transparent"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎉</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-400 mb-1">Plan erfolgreich abgeschlossen!</h3>
                <p className="text-slate-300 text-sm">
                  Du hast alle {rehabPlan.phases.length} Phasen durchlaufen. Du kannst den Plan weiterhin als Referenz nutzen.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => window.location.href = createPageUrl('DiagnosisChat')}
                className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
              >
                Neuen Plan erstellen
              </Button>
            </div>
          </motion.div>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-slate-300">
              Phase {rehabPlan.current_phase || 1} von {rehabPlan.phases.length}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(rehabPlan.current_phase / rehabPlan.phases.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-orange-500 to-red-500"
            />
          </div>
        </div>

        {/* Current Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-orange-500/30 p-6 mb-8 bg-gradient-to-r from-orange-500/10 to-transparent"
        >
          <h2 className="text-2xl font-bold text-orange-400 mb-2">{currentPhase.title}</h2>
          <p className="text-slate-300 mb-4">{currentPhase.description}</p>
          <div className="text-sm text-slate-400">
            Empfohlene Dauer: <strong>{currentPhase.duration_days} Tage</strong>
          </div>
        </motion.div>

        {/* AI-Powered Weakness Generator */}
        <React.Suspense fallback={<div className="glass rounded-xl p-6 border border-slate-700 text-center text-slate-400">Lädt...</div>}>
          <WeaknessGenerator
          rehabPlan={rehabPlan}
          currentExercises={currentPhase.exercises}
          onExerciseGenerated={async (newExercise) => {
            const updatedPhases = [...rehabPlan.phases];
            updatedPhases[currentPhaseIndex].exercises.push({
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

        {/* Exercises */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Deine Übungen für diese Phase</h3>
          
          {currentPhase.exercises.map((exercise, idx) => {
            // Filter exercises based on readiness status
            const isStrengthExercise = exercise.category && ['strength', 'functional'].includes(exercise.category.toLowerCase());
            const shouldShowWarning = readinessStatus === 'yellow' && isStrengthExercise;
            const shouldSkip = readinessStatus === 'red' && isStrengthExercise;
            
            if (shouldSkip) return null;
            
            return (
            <motion.div
              key={exercise.exercise_id || `exercise-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass rounded-xl border border-slate-700 overflow-hidden"
            >
              {/* Exercise Header */}
              <button
                onClick={() => setExpandedExercise(
                  expandedExercise === exercise.exercise_id ? null : exercise.exercise_id
                )}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    shouldShowWarning 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{exercise.name}</h4>
                      {shouldShowWarning && (
                        <span className="text-yellow-400 text-xs">⚠️ Reduzieren</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {shouldShowWarning 
                        ? `${exercise.sets_reps_tempo} → Intensität um 30-50% reduzieren`
                        : exercise.sets_reps_tempo}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    expandedExercise === exercise.exercise_id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Exercise Details */}
              <AnimatePresence>
                {expandedExercise === exercise.exercise_id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-700 px-6 py-4 bg-slate-800/20"
                  >
                    {/* Readiness Warning */}
                    {shouldShowWarning && (
                      <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <h5 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" /> Moderate Belastung empfohlen
                        </h5>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Reduziere heute Intensität und Wiederholungen um 30-50%. Höre auf deinen Körper und pausiere bei Schmerzen.
                        </p>
                      </div>
                    )}

                    {/* Goal Explanation */}
                    {exercise.goal_explanation ? (
                      <div className="mb-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <h5 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                          <span>🎯</span> Worum geht's?
                        </h5>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {exercise.goal_explanation}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600">
                        <p className="text-slate-400 text-xs">
                          💡 Dieser Plan wurde vor unserem Update erstellt. Detaillierte Erklärungen sind für neuere Pläne verfügbar.
                        </p>
                      </div>
                    )}

                    {/* Benefits - only show if available */}
                    {exercise.benefits && (
                      <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <h5 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                          <span>✨</span> Das bringt's dir:
                        </h5>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {exercise.benefits}
                        </p>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="mb-6">
                      <h5 className="font-semibold text-slate-200 mb-2">So geht's:</h5>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {exercise.instruction}
                      </p>
                    </div>

                    {/* AI Coaching Panel */}
                    <React.Suspense fallback={<div className="text-slate-400 text-sm">Lädt Coaching-Panel...</div>}>
                      <ExerciseCoachingPanel
                      exercise={exercise}
                      rehabPlan={rehabPlan}
                      feedbackHistory={(rehabPlan.feedback_history || []).filter(
                        f => f.exercise_id === exercise.exercise_id
                        )}
                        />
                        </React.Suspense>

                    {/* Feedback Form */}
                    <ExerciseFeedbackForm
                      exercise={exercise}
                      onSubmit={(metricValue, notes) =>
                        submitFeedbackMutation.mutate({
                          exerciseId: exercise.exercise_id,
                          metricValue,
                          notes
                        })
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            );
          })}
        </div>

        {/* Red Status: Show filtered exercises info */}
        {readinessStatus === 'red' && currentPhase.exercises.some(ex => ex.category && ['strength', 'functional'].includes(ex.category.toLowerCase())) && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-slate-300 text-sm">
              ℹ️ Kraft- und funktionelle Übungen werden heute ausgeblendet. Fokussiere dich auf die sanften Mobilisations- und MFR-Übungen oben.
            </p>
          </div>
        )}

        {/* Recommended MFR Routines */}
        {rehabPlan.recommended_mfr_routines?.length > 0 && (
          <div className="mb-8 glass rounded-xl border border-purple-500/30 p-6 bg-gradient-to-r from-purple-500/10 to-transparent">
            <h3 className="font-semibold text-white mb-2">🎯 Empfohlene MFR-Routinen</h3>
            <p className="text-slate-300 text-sm mb-4">
              Diese Routinen unterstützen deine Rehabilitation optimal:
            </p>
            <div className="grid gap-3">
              {rehabPlan.recommended_mfr_routines.map((routine, idx) => (
                <div key={routine.routine_id || idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div>
                    <p className="font-semibold text-white text-sm">{routine.routine_name}</p>
                    <p className="text-xs text-slate-400">{routine.reason}</p>
                  </div>
                  <Button
                    onClick={() => window.location.href = createPageUrl(`Flow?routine_id=${routine.routine_id}`)}
                    size="sm"
                    className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  >
                    Starten
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase Progress & Completion */}
        <div className="mt-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl border border-slate-700 p-4">
            <div className="text-sm text-slate-400 mb-1">Tage in dieser Phase</div>
            <div className="text-2xl font-bold text-white">{getDaysInCurrentPhase()} / {currentPhase.duration_days}</div>
          </div>
          {getAveragePainLevel() !== null && (
            <div className="glass rounded-xl border border-slate-700 p-4">
              <div className="text-sm text-slate-400 mb-1">Ø Schmerzlevel</div>
              <div className={`text-2xl font-bold ${
                parseFloat(getAveragePainLevel()) <= 3 ? 'text-green-400' :
                parseFloat(getAveragePainLevel()) <= 6 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {getAveragePainLevel()} / 10
              </div>
            </div>
          )}
        </div>

          {/* Complete Phase Button */}
          {(rehabPlan.current_phase || 1) < rehabPlan.phases.length ? (
           <div className="glass rounded-xl border border-cyan-500/30 p-6 bg-gradient-to-r from-cyan-500/10 to-transparent">
             <h3 className="font-semibold text-white mb-2">Bereit für die nächste Phase?</h3>
             <p className="text-slate-300 text-sm mb-4">
               Wenn dein Schmerzlevel deutlich gesunken ist und du die Übungen gut beherrschst, kannst du zur nächsten Phase übergehen.
               {getAveragePainLevel() !== null && parseFloat(getAveragePainLevel()) > 5 && (
                 <span className="block mt-2 text-yellow-400">
                   ⚠️ Dein durchschnittliches Schmerzlevel ist noch hoch. Es wird empfohlen, noch ein paar Tage in dieser Phase zu bleiben.
                 </span>
               )}
             </p>
             <Button
               onClick={() => {
                 console.log('Phase completion triggered for phase:', rehabPlan.current_phase);
                 completeCurrentPhaseMutation.mutate();
               }}
               disabled={completeCurrentPhaseMutation.isPending}
               className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
             >
               {completeCurrentPhaseMutation.isPending ? 'Wird gespeichert...' : `Zur Phase ${(rehabPlan.current_phase || 1) + 1} wechseln`}
             </Button>
           </div>
          ) : (
            <div className="glass rounded-xl border border-green-500/30 p-6 bg-gradient-to-r from-green-500/10 to-transparent">
              <h3 className="font-semibold text-white mb-2">🎉 Finale Phase!</h3>
              <p className="text-slate-300 text-sm mb-4">
                Das ist die letzte Phase deines Reha-Plans. Wenn du diese erfolgreich abgeschlossen hast, kannst du den Plan als beendet markieren.
              </p>
              <Button
                onClick={() => completeCurrentPhaseMutation.mutate()}
                disabled={completeCurrentPhaseMutation.isPending}
                className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30"
              >
                {completeCurrentPhaseMutation.isPending ? 'Wird gespeichert...' : 'Plan als abgeschlossen markieren'}
              </Button>
            </div>
          )}

          {/* Progress Notes */}
          <div className="glass rounded-xl border border-slate-700 p-6">
            <h3 className="font-semibold text-white mb-3">💡 Tipp</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Mache diese Übungen regelmäßig - am besten täglich oder nach Bedarf. Dein Körper braucht Zeit, um sich anzupassen. 
              Tracke deinen Fortschritt nach jeder Session, damit du siehst wie sich dein Schmerzlevel entwickelt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseFeedbackForm({ exercise, onSubmit }) {
  const [metricValue, setMetricValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!metricValue.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(parseFloat(metricValue), notes);
      // Kurz auf dem Wert bleiben damit User sieht dass es gespeichert wurde, dann clearen
      setTimeout(() => {
        setMetricValue('');
        setNotes('');
      }, 500);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMetricLabel = () => {
    // Für Rehab-Pläne tracken wir primär Schmerzlevel
    if (exercise.category === 'mfr' || exercise.category === 'neuro') {
      return 'Schmerzlevel nach Übung (0-10)';
    }
    return 'Wie fühlte es sich an? (0-10)';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          {getMetricLabel()}
        </label>
        <input
          type="number"
          value={metricValue}
          onChange={(e) => setMetricValue(e.target.value)}
          placeholder="0 = kein Schmerz, 10 = maximaler Schmerz"
          min="0"
          max="10"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-400"
          step="0.5"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Notizen (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Wie hat sich das angefühlt? Besser, gleich, schlechter?"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-400 resize-none"
          rows="2"
        />
      </div>

      <Button
        type="submit"
        disabled={!metricValue.trim() || isSubmitting}
        className="w-full bg-orange-500/30 text-orange-400 hover:bg-orange-500/40 disabled:opacity-50"
      >
        <Check className="w-4 h-4 mr-2" />
        Fortschritt speichern
      </Button>
    </form>
  );
}