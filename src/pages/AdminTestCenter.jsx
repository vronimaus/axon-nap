import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, AlertCircle, CheckCircle2, Loader2, RefreshCw, ClipboardList, Bug } from 'lucide-react';
import { toast } from 'sonner';

// ── System-Testmatrix ──────────────────────────────────────────────
const TEST_MATRIX = [
  {
    path: 'PFAD 1: Neuer User',
    color: 'border-purple-500/30',
    headerColor: 'text-purple-400',
    tests: [
      { id: '1.1', label: 'App öffnen ohne Login', expected: 'Weiterleitung zur Landing Page' },
      { id: '1.2', label: 'Login durchführen (kein Profil)', expected: 'Weiterleitung zu HowToUse' },
      { id: '1.3', label: 'HowToUse abschließen', expected: 'Weiterleitung zum Dashboard' },
    ]
  },
  {
    path: 'PFAD 2: Dashboard & Bio-Sync',
    color: 'border-cyan-500/30',
    headerColor: 'text-cyan-400',
    tests: [
      { id: '2.1', label: 'Dashboard öffnen (Tag-Erstbesuch)', expected: 'Bio-Sync Modal erscheint automatisch' },
      { id: '2.2', label: 'Alle 3 Slider ausfüllen & absenden', expected: 'Ergebnis-Karte mit Status grün/gelb/rot' },
      { id: '2.3', label: 'Dashboard erneut öffnen (gleicher Tag)', expected: 'Kein Bio-Sync Modal mehr' },
      { id: '2.4', label: 'Sliders auf 1–4 → Bio-Sync', expected: 'Status ROT — empfiehlt Ruhe-Routinen' },
      { id: '2.5', label: 'Sliders auf 5–7 → Bio-Sync', expected: 'Status GELB — empfiehlt sanfte Routinen' },
      { id: '2.6', label: 'Sliders auf 8–10 → Bio-Sync', expected: 'Status GRÜN — empfiehlt intensive Routinen' },
    ]
  },
  {
    path: 'PFAD 3: Tune-Up / RehabPlan',
    color: 'border-emerald-500/30',
    headerColor: 'text-emerald-400',
    tests: [
      { id: '3.1', label: 'RehabPlan ohne bestehenden Plan öffnen', expected: '"Noch kein Reha-Plan" + Button zur Diagnose' },
      { id: '3.2', label: 'RehabPlan mit Plan öffnen', expected: 'Plan lädt direkt, NMS-Tags (Input→Output) im Header' },
      { id: '3.3', label: '"Tune-Up starten" klicken', expected: 'DailyTuneUp-Modal öffnet sich' },
      { id: '3.4', label: 'Tune-Up vollständig durchführen', expected: 'Alle 4 Phasen: MFR → Neuro → Retest → Integration' },
      { id: '3.5', label: 'Phase als abgeschlossen markieren', expected: 'Fortschritt erhöht sich, Toast erscheint' },
      { id: '3.6', label: 'Letzte Phase abschließen', expected: 'Status "completed", "Bereit für die nächste Stufe?" erscheint' },
    ]
  },
  {
    path: 'PFAD 4: Flow Routinen',
    color: 'border-blue-500/30',
    headerColor: 'text-blue-400',
    tests: [
      { id: '4.1', label: 'FlowRoutines öffnen', expected: 'AXON-Banner + tageszeit-basierte Routinen oben' },
      { id: '4.2', label: 'Kategorie-Filter wechseln', expected: 'Desktop: Pills / Mobile: Bottom Sheet — filtert korrekt' },
      { id: '4.3', label: 'Routine antippen', expected: 'Flow-Seite öffnet sich mit korrekter Routine' },
      { id: '4.4', label: 'Start drücken', expected: 'Timer läuft, automatischer Weitersprung zum nächsten Schritt' },
      { id: '4.5', label: 'Alle Schritte abschließen', expected: 'Completion-Screen mit Feedback-Sternen' },
      { id: '4.6', label: '⭐-Feedback geben', expected: 'In RoutineHistory gespeichert, nächster Besuch: "Erledigt"' },
      { id: '4.7', label: 'Routine öffnen bei ROT-Status', expected: 'Warnung "Dein System braucht heute Ruhe" im Banner' },
    ]
  },
  {
    path: 'PFAD 5: NMS-Konsistenz (kritisch!)',
    color: 'border-red-500/30',
    headerColor: 'text-red-400',
    tests: [
      { id: '5.1', label: 'Bio-Sync ROT → FlowRoutines öffnen', expected: 'Triage-Banner zeigt "Aktive Regeneration" + Ruhe-Routinen' },
      { id: '5.2', label: 'Bio-Sync GRÜN → FlowRoutines öffnen', expected: 'Triage-Banner zeigt Training-Empfehlung' },
      { id: '5.3', label: 'FitnessSnacks nach ROT-Status', expected: 'Snacks mit readiness_gate: green nicht priorisiert' },
      { id: '5.4', label: 'Session Generator prüfen', expected: 'sessionDecision im Dashboard stimmt mit Bio-Sync überein' },
    ]
  },
  {
    path: 'PFAD 6: Sackgassen-Check',
    color: 'border-amber-500/30',
    headerColor: 'text-amber-400',
    tests: [
      { id: '6.1', label: 'Diagnose ohne Beschreibung starten', expected: 'Validierung verhindert leeres Absenden' },
      { id: '6.2', label: 'RehabPlan ohne Plan öffnen', expected: 'CTA-Button führt direkt zur Diagnose' },
      { id: '6.3', label: 'Flow öffnen ohne routine_id in URL', expected: '🐛 Lücke: sollte auf FlowRoutines zurückleiten', isBug: true },
      { id: '6.4', label: 'Logout → /RehabPlan direkt aufrufen', expected: 'Weiterleitung zur Landing Page' },
      { id: '6.5', label: 'Abgeschl. Plan → "Performance freischalten"', expected: 'Weiterleitung zum Dashboard' },
    ]
  },
];

function SystemTestsTab() {
  const STORAGE_KEY = 'axon_test_matrix_results';
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axon_test_notes') || '{}'); } catch { return {}; }
  });
  const [editingNote, setEditingNote] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  const toggle = (id, status) => {
    const next = { ...checked, [id]: checked[id] === status ? null : status };
    setChecked(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const saveNote = (id) => {
    const next = { ...notes, [id]: noteInput };
    setNotes(next);
    localStorage.setItem('axon_test_notes', JSON.stringify(next));
    setEditingNote(null);
    setNoteInput('');
  };

  const totalTests = TEST_MATRIX.flatMap(p => p.tests).length;
  const passed = Object.values(checked).filter(v => v === 'pass').length;
  const failed = Object.values(checked).filter(v => v === 'fail').length;
  const progress = Math.round((passed / totalTests) * 100);

  const resetAll = () => {
    setChecked({});
    setNotes({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('axon_test_notes');
    toast.success('Alle Tests zurückgesetzt');
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-800/60 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalTests}</div>
          <div className="text-xs text-slate-400 mt-1">Gesamt</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{passed}</div>
          <div className="text-xs text-slate-400 mt-1">Bestanden</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{failed}</div>
          <div className="text-xs text-slate-400 mt-1">Fehlgeschlagen</div>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{progress}%</div>
          <div className="text-xs text-slate-400 mt-1">Abgedeckt</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex justify-end">
        <Button onClick={resetAll} variant="ghost" size="sm" className="text-slate-500 hover:text-red-400 text-xs gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Alle zurücksetzen
        </Button>
      </div>

      {/* Test Paths */}
      {TEST_MATRIX.map((path) => (
        <div key={path.path} className={`rounded-xl border ${path.color} bg-slate-900/50 overflow-hidden`}>
          <div className={`px-5 py-3 border-b ${path.color}`}>
            <h3 className={`font-bold text-sm ${path.headerColor}`}>{path.path}</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {path.tests.map((test) => {
              const status = checked[test.id];
              return (
                <div key={test.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] font-mono text-slate-600 mt-1 w-6 flex-shrink-0">{test.id}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${test.isBug ? 'text-amber-300' : 'text-slate-200'}`}>
                          {test.isBug && <Bug className="w-3.5 h-3.5 inline mr-1 text-amber-400" />}
                          {test.label}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{test.expected}</p>
                      {notes[test.id] && (
                        <p className="text-xs text-amber-300/80 mt-1 italic">📝 {notes[test.id]}</p>
                      )}
                      {editingNote === test.id && (
                        <div className="flex gap-2 mt-2">
                          <input
                            autoFocus
                            value={noteInput}
                            onChange={e => setNoteInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveNote(test.id)}
                            placeholder="Notiz eingeben..."
                            className="flex-1 text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-500 outline-none"
                          />
                          <button onClick={() => saveNote(test.id)} className="text-xs text-cyan-400 hover:text-cyan-300 px-2">OK</button>
                          <button onClick={() => setEditingNote(null)} className="text-xs text-slate-500 px-1">✕</button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setEditingNote(test.id); setNoteInput(notes[test.id] || ''); }}
                        className="text-[10px] text-slate-600 hover:text-slate-400 px-1"
                        title="Notiz"
                      >✏️</button>
                      <button
                        onClick={() => toggle(test.id, 'pass')}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${status === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-green-500/20 hover:text-green-400'}`}
                        title="Bestanden"
                      >✓</button>
                      <button
                        onClick={() => toggle(test.id, 'fail')}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${status === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-red-500/20 hover:text-red-400'}`}
                        title="Fehlgeschlagen"
                      >✗</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminTestCenter() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('systemtests');
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
        <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
          {[
            { id: 'systemtests', label: '🧪 System-Tests' },
            { id: 'exercises',   label: '🏋️ Exercises' },
            { id: 'plans',       label: '📋 Plan Generator' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'systemtests' && (
            <motion.div
              key="systemtests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SystemTestsTab />
            </motion.div>
          )}

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