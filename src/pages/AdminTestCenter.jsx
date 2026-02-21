import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTestCenter() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exercises');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseStats, setExerciseStats] = useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await base44.auth.me();
        if (!u || u.role !== 'admin') {
          window.location.href = createPageUrl('Dashboard');
          return;
        }
        setUser(u);
      } catch {
        window.location.href = createPageUrl('Dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Test 1: Exercise Validation
  const testExerciseValidation = async () => {
    setIsRunning(true);
    setTestResults([]);
    try {
      const exercises = await base44.entities.Exercise.list('-created_date', 500);
      
      let totalCount = exercises.length;
      let withProgression = 0;
      let missingProgression = [];

      exercises.forEach(ex => {
        if (ex.progression_basic && ex.progression_advanced) {
          withProgression++;
        } else {
          missingProgression.push({
            exercise_id: ex.exercise_id,
            name: ex.name,
            missing: [],
          });
          if (!ex.progression_basic) missingProgression[missingProgression.length - 1].missing.push('progression_basic');
          if (!ex.progression_advanced) missingProgression[missingProgression.length - 1].missing.push('progression_advanced');
        }
      });

      setExerciseStats({
        total: totalCount,
        complete: withProgression,
        incomplete: missingProgression.length,
        percentage: Math.round((withProgression / totalCount) * 100)
      });

      setTestResults(
        missingProgression.slice(0, 20).map(ex => ({
          type: 'exercise',
          status: 'missing',
          exercise_id: ex.exercise_id,
          name: ex.name,
          missing: ex.missing.join(', ')
        }))
      );

      if (missingProgression.length > 20) {
        setTestResults(prev => [...prev, {
          type: 'info',
          message: `+${missingProgression.length - 20} weitere Übungen mit fehlenden Daten`
        }]);
      }

      toast.success(`Validierung abgeschlossen: ${withProgression}/${totalCount} komplett`);
    } catch (err) {
      console.error(err);
      toast.error('Fehler bei der Validierung');
    } finally {
      setIsRunning(false);
    }
  };

  // Test 2: Plan Generation
  const testPlanGeneration = async (goal) => {
    setIsRunning(true);
    setTestResults([]);
    try {
      const response = await base44.functions.invoke('generateTrainingPlan', {
        goal_description: goal,
      });

      if (response.data?.plan_id) {
        setTestResults([{
          type: 'plan',
          status: 'success',
          goal,
          plan_id: response.data.plan_id,
          exercises_count: response.data.exercises_count || '?',
          phases: response.data.phases || '?'
        }]);
        toast.success(`Plan für "${goal}" erstellt!`);
      } else {
        setTestResults([{
          type: 'plan',
          status: 'error',
          goal,
          error: response.data?.error || 'Unbekannter Fehler'
        }]);
        toast.error('Plan-Generierung fehlgeschlagen');
      }
    } catch (err) {
      console.error(err);
      setTestResults([{
        type: 'plan',
        status: 'error',
        goal,
        error: err.message || 'Fehler beim Testen'
      }]);
      toast.error('Fehler beim Plan-Test');
    } finally {
      setIsRunning(false);
    }
  };

  const GOAL_TESTS = [
    'Muscle-Up',
    'Handstand Push-up',
    'Pistol Squat',
    'Front Lever',
    'Dragon Flag',
    'Human Flag'
  ];

  if (isLoading) return <div className="min-h-screen bg-slate-950" />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => window.location.href = createPageUrl('AdminHub')}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-cyan-400">🧪 Test Center</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === 'exercises'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏋️ Exercises
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === 'plans'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Plan Generator
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'exercises' && (
            <motion.div
              key="exercises"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="glass rounded-xl border border-cyan-500/30 p-6">
                <h2 className="text-xl font-bold text-white mb-2">Exercise Validierung</h2>
                <p className="text-slate-400 text-sm mb-4">Prüft, wie viele Exercises progression_basic & progression_advanced haben</p>

                <Button
                  onClick={testExerciseValidation}
                  disabled={isRunning}
                  className="bg-cyan-500/30 text-cyan-400 hover:bg-cyan-500/50 font-bold gap-2"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Validierung starten
                </Button>

                {exerciseStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-cyan-400">{exerciseStats.complete}</div>
                        <div className="text-xs text-slate-400">Komplett</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-400">{exerciseStats.incomplete}</div>
                        <div className="text-xs text-slate-400">Unvollständig</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-400">{exerciseStats.percentage}%</div>
                        <div className="text-xs text-slate-400">Anteil</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Results */}
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-white">Fehlende Daten:</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {testResults.map((result, idx) => (
                      result.type === 'exercise' ? (
                        <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-semibold text-white">{result.exercise_id}</div>
                              <div className="text-slate-300">{result.name}</div>
                              <div className="text-xs text-red-400 mt-1">Fehlt: {result.missing}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400">
                          {result.message}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="glass rounded-xl border border-amber-500/30 p-6">
                <h2 className="text-xl font-bold text-white mb-2">Plan Generator Tester</h2>
                <p className="text-slate-400 text-sm mb-4">Testet generateTrainingPlan mit verschiedenen Goals</p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {GOAL_TESTS.map(goal => (
                    <Button
                      key={goal}
                      onClick={() => testPlanGeneration(goal)}
                      disabled={isRunning}
                      className="bg-amber-500/30 text-amber-400 hover:bg-amber-500/50 text-sm font-bold"
                    >
                      {isRunning ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                      {goal}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-white">Test Ergebnisse:</h3>
                  {testResults.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg p-4 border ${
                        result.status === 'success'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.status === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 text-sm">
                          <div className="font-bold text-white">{result.goal}</div>
                          {result.status === 'success' ? (
                            <div className="text-green-400 mt-1">
                              ✓ Plan ID: {result.plan_id.slice(0, 12)}... ({result.exercises_count} Übungen, {result.phases} Phasen)
                            </div>
                          ) : (
                            <div className="text-red-400 mt-1">✗ {result.error}</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}