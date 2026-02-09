import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ChevronDown, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RehabPlan() {
  const [user, setUser] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

      return { isLastPhase, updateData };
    },
    onSuccess: (result) => {
      if (!result) return;
      
      console.log('Success! Cache invalidating and refetching...');
      // Invalidate mit exact key match damit Cache gelöscht und neu gefetcht wird
      queryClient.invalidateQueries({ queryKey: ['rehabPlan', user?.email] });
      
      console.log('After invalidate, current plan should update in 1-2s');
      
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

  // Plan completed - show success screen
  if (rehabPlan.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
        <div className="max-w-md w-full glass rounded-2xl border border-green-500/30 p-8 text-center bg-gradient-to-br from-green-500/10 to-transparent">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Plan abgeschlossen!</h2>
          <p className="text-slate-300 mb-6">
            Glückwunsch! Du hast alle {rehabPlan.phases.length} Phasen erfolgreich durchlaufen.
            {getAveragePainLevel() !== null && (
              <span className="block mt-3 text-green-400 font-semibold">
                Finales Schmerzlevel: {getAveragePainLevel()} / 10
              </span>
            )}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
            >
              Zurück zum Command
            </Button>
            <Button
              onClick={() => window.location.href = createPageUrl('DiagnosisChat')}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Neuen Plan erstellen
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Exercises */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Deine Übungen für diese Phase</h3>
          
          {currentPhase.exercises.map((exercise, idx) => (
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
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white">{exercise.name}</h4>
                    <p className="text-sm text-slate-400">{exercise.sets_reps_tempo}</p>
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
                    {/* Instructions */}
                    <div className="mb-6">
                      <h5 className="font-semibold text-slate-200 mb-2">So geht's:</h5>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {exercise.instruction}
                      </p>
                    </div>

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
          ))}
        </div>

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