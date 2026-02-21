import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Brain, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';
import DiscoveryTest from '../components/discovery/DiscoveryTest.jsx';
import DiscoveryResults from '../components/discovery/DiscoveryResults.jsx';

// All available benchmark tests
const ALL_TESTS = {
  active_hang: {
    id: 'active_hang',
    name: 'Active Hang',
    category: 'endurance',
    question: 'Wie lange hältst du dich aktiv an der Stange (Schultern nach unten gezogen)?',
    unit: 'seconds',
    metric_label: 'Sekunden',
    hint: 'Schultern aktiv nach unten ziehen – nicht passiv hängen lassen.',
    icon: '🏋️',
    min: 0, max: 120,
    thresholds: { beginner: 10, intermediate: 30, advanced: 60, elite: 90 },
    related_goals: ['muscle_up', 'front_lever', 'one_arm_pullup'],
  },
  explosive_pullups: {
    id: 'explosive_pullups',
    name: 'Explosive Pull-ups',
    category: 'max_strength',
    question: 'Wie viele explosive Klimmzüge schaffst du (Brustbein zur Stange)?',
    unit: 'reps',
    metric_label: 'Wiederholungen',
    hint: 'Zähle nur Wiederholungen, bei denen das Brustbein die Stange berührt.',
    icon: '⚡',
    min: 0, max: 20,
    thresholds: { beginner: 1, intermediate: 4, advanced: 8, elite: 12 },
    related_goals: ['muscle_up'],
  },
  wall_handstand_hold: {
    id: 'wall_handstand_hold',
    name: 'Wall Handstand Hold',
    category: 'endurance',
    question: 'Wie lange hältst du den Handstand an der Wand?',
    unit: 'seconds',
    metric_label: 'Sekunden',
    hint: 'Bauch zur Wand, Körper gerade – kein Hohlkreuz.',
    icon: '🤸',
    min: 0, max: 120,
    thresholds: { beginner: 10, intermediate: 30, advanced: 60, elite: 90 },
    related_goals: ['handstand_pushup'],
  },
  pike_pushups: {
    id: 'pike_pushups',
    name: 'Pike Push-ups',
    category: 'max_strength',
    question: 'Wie viele saubere Pike Push-ups schaffst du?',
    unit: 'reps',
    metric_label: 'Wiederholungen',
    hint: 'Hüfte hoch, Kopf geht zwischen die Arme bis fast zum Boden.',
    icon: '💪',
    min: 0, max: 30,
    thresholds: { beginner: 3, intermediate: 8, advanced: 15, elite: 25 },
    related_goals: ['handstand_pushup'],
  },
  deep_squat_hold: {
    id: 'deep_squat_hold',
    name: 'Deep Squat Hold',
    category: 'mobility',
    question: 'Wie tief kommst du in eine tiefe Kniebeuge (Fersen bleiben am Boden)?',
    unit: 'level',
    metric_label: 'Level',
    hint: 'Level 1: Fersen heben sich. Level 2: 90°. Level 3: Volltiefe. Level 4: Volltiefe + Arme overhead.',
    icon: '🦵',
    min: 1, max: 4, step: 1,
    thresholds: { beginner: 1, intermediate: 2, advanced: 3, elite: 4 },
    labels: { 1: 'Fersen heben', 2: '90° Kniebeuge', 3: 'Volle Tiefe', 4: 'Overhead' },
    related_goals: ['pistol_squat'],
  },
  cossack_squats: {
    id: 'cossack_squats',
    name: 'Cossack Squats',
    category: 'max_strength',
    question: 'Wie viele Cossack Squats schaffst du pro Seite (kontrolliert)?',
    unit: 'reps',
    metric_label: 'Wiederholungen/Seite',
    hint: 'Bein bleibt gestreckt, Ferse bleibt am Boden, tief in die Hocke.',
    icon: '🦵',
    min: 0, max: 25,
    thresholds: { beginner: 3, intermediate: 8, advanced: 15, elite: 20 },
    related_goals: ['pistol_squat'],
  },
  hollow_body_hold: {
    id: 'hollow_body_hold',
    name: 'Hollow Body Hold',
    category: 'endurance',
    question: 'Wie lange hältst du eine saubere Hollow Body Position?',
    unit: 'seconds',
    metric_label: 'Sekunden',
    hint: 'Unterer Rücken am Boden, Beine gestreckt, Schultern leicht gehoben.',
    icon: '🧱',
    min: 0, max: 120,
    thresholds: { beginner: 10, intermediate: 30, advanced: 60, elite: 90 },
    related_goals: ['dragon_flag', 'front_lever', 'l_sit'],
  },
  leg_raises: {
    id: 'leg_raises',
    name: 'Straight Leg Raises',
    category: 'max_strength',
    question: 'Wie viele gestreckte Beinhebungen schaffst du (hängend oder liegend)?',
    unit: 'reps',
    metric_label: 'Wiederholungen',
    hint: 'Beine bleiben vollständig gestreckt, kontrollierte Bewegung.',
    icon: '🏋️',
    min: 0, max: 25,
    thresholds: { beginner: 3, intermediate: 8, advanced: 15, elite: 20 },
    related_goals: ['dragon_flag', 'l_sit'],
  },
  side_plank: {
    id: 'side_plank',
    name: 'Side Plank',
    category: 'endurance',
    question: 'Wie lange hältst du eine Side Plank pro Seite?',
    unit: 'seconds',
    metric_label: 'Sekunden',
    hint: 'Hüfte hoch, Körper gerade – keine Absenkung.',
    icon: '↔️',
    min: 0, max: 120,
    thresholds: { beginner: 10, intermediate: 30, advanced: 60, elite: 90 },
    related_goals: ['human_flag'],
  },
  push_capacity: {
    id: 'push_capacity',
    name: 'Liegestütze',
    category: 'max_strength',
    question: 'Wie viele saubere Liegestütze schaffst du am Stück?',
    unit: 'reps',
    metric_label: 'Wiederholungen',
    hint: 'Brust muss den Boden berühren, Körper bleibt gerade.',
    icon: '💪',
    min: 0, max: 60,
    thresholds: { beginner: 5, intermediate: 15, advanced: 30, elite: 50 },
    related_goals: ['one_arm_pushup', 'planche'],
  },
  planche_lean: {
    id: 'planche_lean',
    name: 'Planche Lean',
    category: 'endurance',
    question: 'Wie lange hältst du den Planche Lean (Schultern über die Hände vorgelehnt)?',
    unit: 'seconds',
    metric_label: 'Sekunden',
    hint: 'Körper gerade, Arme gestreckt, Schwerpunkt weit vor den Händen.',
    icon: '⚖️',
    min: 0, max: 60,
    thresholds: { beginner: 5, intermediate: 15, advanced: 30, elite: 45 },
    related_goals: ['planche'],
  },
};

// GOAL-DRIVEN MAPPING: Welche 2 Tests braucht welches Ziel?
const GOAL_BENCHMARK_MAP = {
  muscle_up:        { tests: ['active_hang', 'explosive_pullups'],    node: 'N10', sling: 'posterior', label: 'Muscle-Up' },
  handstand_pushup: { tests: ['wall_handstand_hold', 'pike_pushups'], node: 'N10', sling: 'anterior',  label: 'Handstand Push-up' },
  pistol_squat:     { tests: ['deep_squat_hold', 'cossack_squats'],   node: 'N12', sling: 'lateral',   label: 'Pistol Squat' },
  dragon_flag:      { tests: ['hollow_body_hold', 'leg_raises'],      node: 'N11', sling: 'anterior',  label: 'Dragon Flag' },
  front_lever:      { tests: ['active_hang', 'hollow_body_hold'],     node: 'N10', sling: 'posterior', label: 'Front Lever' },
  human_flag:       { tests: ['side_plank', 'active_hang'],           node: 'N10', sling: 'lateral',   label: 'Human Flag' },
  l_sit:            { tests: ['hollow_body_hold', 'leg_raises'],      node: 'N11', sling: 'anterior',  label: 'L-Sit / V-Sit' },
  planche:          { tests: ['planche_lean', 'push_capacity'],       node: 'N10', sling: 'anterior',  label: 'Planche' },
  one_arm_pushup:   { tests: ['push_capacity', 'side_plank'],         node: 'N10', sling: 'anterior',  label: 'One-Arm Push-up' },
  one_arm_pullup:   { tests: ['active_hang', 'explosive_pullups'],    node: 'N10', sling: 'posterior', label: 'One-Arm Pull-up' },
};

// Detect which goal keyword maps to a benchmark mapping
const detectGoalKey = (goalText) => {
  const lower = goalText.toLowerCase();
  if (lower.includes('muscle') || lower.includes('muscleup')) return 'muscle_up';
  if (lower.includes('handstand push') || lower.includes('hspu')) return 'handstand_pushup';
  if (lower.includes('pistol') || lower.includes('einbein')) return 'pistol_squat';
  if (lower.includes('dragon')) return 'dragon_flag';
  if (lower.includes('front lever')) return 'front_lever';
  if (lower.includes('human flag')) return 'human_flag';
  if (lower.includes('l-sit') || lower.includes('l sit') || lower.includes('v-sit')) return 'l_sit';
  if (lower.includes('planche')) return 'planche';
  if (lower.includes('one arm push') || lower.includes('einarmige')) return 'one_arm_pushup';
  if (lower.includes('one arm pull') || lower.includes('one-arm pull')) return 'one_arm_pullup';
  return null;
};

// Fallback general tests
const GENERAL_TESTS = [
  ALL_TESTS.active_hang,
  ALL_TESTS.push_capacity,
  ALL_TESTS.hollow_body_hold,
  ALL_TESTS.deep_squat_hold,
  ALL_TESTS.side_plank,
];

const getLevel = (value, thresholds) => {
  if (value >= thresholds.elite) return 'elite';
  if (value >= thresholds.advanced) return 'advanced';
  if (value >= thresholds.intermediate) return 'intermediate';
  return 'beginner';
};

export default function Discovery() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTestIdx, setCurrentTestIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState('intro');
  const [goalKey, setGoalKey] = useState(null);
  const [goalLabel, setGoalLabel] = useState(null);
  const [goalParam, setGoalParam] = useState(null);
  const [TESTS, setTESTS] = useState(GENERAL_TESTS);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        if (!u) { window.location.href = createPageUrl('Landing'); return; }
        setUser(u);

        // Check if coming from a specific goal
        const urlParams = new URLSearchParams(window.location.search);
        const gp = urlParams.get('goal');
        if (gp) {
          setGoalParam(gp);
          const detected = detectGoalKey(gp);
          if (detected && GOAL_BENCHMARK_MAP[detected]) {
            const mapping = GOAL_BENCHMARK_MAP[detected];
            setGoalKey(detected);
            setGoalLabel(mapping.label);
            setTESTS(mapping.tests.map(id => ALL_TESTS[id]));
          }
        }
      } catch {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleAnswer = (testId, value) => {
    setAnswers(prev => ({ ...prev, [testId]: value }));
  };

  // Seed default value when a new test is shown, so "not touched" = middle value, not 0
  useEffect(() => {
    const currentTest = TESTS[currentTestIdx];
    if (!currentTest) return;
    if (answers[currentTest.id] === undefined) {
      const defaultVal = currentTest.unit === 'level'
        ? currentTest.min
        : Math.round((currentTest.min + currentTest.max) / 2);
      setAnswers(prev => ({ ...prev, [currentTest.id]: defaultVal }));
    }
  }, [currentTestIdx, TESTS]);

  const handleNext = () => {
    if (currentTestIdx < TESTS.length - 1) {
      setCurrentTestIdx(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setPhase('saving');
    try {
      const today = new Date().toISOString().split('T')[0];
      const finalAnswers = { ...answers };
      TESTS.forEach(test => {
        if (finalAnswers[test.id] === undefined) {
          finalAnswers[test.id] = test.unit === 'level'
            ? test.min
            : Math.round((test.min + test.max) / 2);
        }
      });

      await Promise.all(
        TESTS.map(test => {
          const value = finalAnswers[test.id];
          const level = getLevel(value, test.thresholds);
          return base44.entities.PerformanceBaseline.create({
            user_email: user.email,
            test_name: test.name,
            test_category: test.category,
            result_value: value,
            result_unit: test.unit,
            baseline_level: level,
            fitness_goal_aligned: test.related_goals[0],
            test_date: today,
          });
        })
      );

      await base44.auth.updateMe({ baseline_completed: true, baseline_date: today });
      setAnswers(finalAnswers);
      setPhase('results');
      base44.analytics.track({ eventName: 'discovery_completed', properties: { user_email: user.email } });
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Speichern. Bitte versuche es erneut.');
      setPhase('testing');
    }
  };

  const handleContinue = async () => {
    // If we came from a goal, generate the training plan automatically
    if (goalParam) {
      setIsGeneratingPlan(true);
      try {
        const existingPlans = await base44.entities.TrainingPlan.filter({
          user_email: user.email,
          status: 'active'
        });
        for (const plan of existingPlans) {
          await base44.entities.TrainingPlan.update(plan.id, { status: 'paused' });
        }
        const response = await base44.functions.invoke('generateTrainingPlan', {
          goal_description: goalParam,
        });
        if (response.data?.plan_id) {
          base44.analytics.track({ eventName: 'training_plan_created', properties: { goal: goalParam } });
          window.location.href = createPageUrl('TrainingPlan');
        } else {
          throw new Error('Plan konnte nicht erstellt werden');
        }
      } catch (err) {
        console.error(err);
        toast.error('Fehler beim Erstellen des Plans. Bitte versuche es erneut.');
        setIsGeneratingPlan(false);
      }
    } else {
      window.location.href = createPageUrl('Dashboard');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 pb-20 md:pb-8">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg w-full text-center space-y-6"
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${goalKey ? 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/30' : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30'}`}>
              {goalKey ? <Target className="w-10 h-10 text-white" /> : <Brain className="w-10 h-10 text-white" />}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">AXON Discovery</h1>
              {goalKey ? (
                <div className="space-y-2">
                  <p className="text-amber-400 font-semibold text-lg">Ziel erkannt: {goalLabel}</p>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Für <strong className="text-white">{goalLabel}</strong> brauchen wir nur <strong className="text-amber-400">2 gezielte Tests</strong>. AXON kalibriert deinen Plan exakt auf die relevanten Schwachstellen.
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-base leading-relaxed">
                  {TESTS.length} kurze Tests. AXON scannt deine <strong className="text-amber-400">Baseline-Kapazitäten</strong> – und passt jeden Trainingsplan von Anfang an präzise auf dich an.
                </p>
              )}
            </div>

            {goalKey && (
              <div className="glass rounded-xl border border-amber-500/40 p-4 text-left bg-amber-500/5">
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2">Zielgerichtete Analyse</p>
                <p className="text-sm text-slate-300">
                  Wir testen nur, was für <strong className="text-white">{goalLabel}</strong> wirklich relevant ist – kein unnötiger Aufwand.
                </p>
              </div>
            )}

            <div className="glass rounded-xl border border-amber-500/30 p-5 text-left space-y-3">
              {TESTS.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-xl w-8 text-center">{t.icon}</span>
                  <div>
                    <strong className="text-white">{t.name}</strong>
                    {goalKey && <span className="ml-2 text-xs text-amber-400 font-mono">Test {i+1}</span>}
                    <span className="text-slate-500"> — {t.question.slice(0, 50)}…</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Dauer: ~{TESTS.length <= 2 ? '2' : '3-5'} Minuten • Kein Equipment nötig</p>
            <Button
              onClick={() => setPhase('testing')}
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-lg"
            >
              {goalKey ? `Baseline für ${goalLabel} messen →` : 'Assessment starten →'}
            </Button>
            <button
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Später machen
            </button>
          </motion.div>
        )}

        {phase === 'testing' && (
          <motion.div
            key="testing"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg w-full space-y-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => currentTestIdx > 0 ? setCurrentTestIdx(p => p - 1) : setPhase('intro')}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${((currentTestIdx + 1) / TESTS.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                {currentTestIdx + 1} / {TESTS.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <DiscoveryTest
                key={currentTestIdx}
                test={TESTS[currentTestIdx]}
                value={answers[TESTS[currentTestIdx].id]}
                onChange={(val) => handleAnswer(TESTS[currentTestIdx].id, val)}
              />
            </AnimatePresence>

            <Button
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold"
            >
              {currentTestIdx < TESTS.length - 1 ? (
                <span className="flex items-center gap-2">Weiter <ArrowRight className="w-4 h-4" /></span>
              ) : (
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Auswertung starten</span>
              )}
            </Button>
          </motion.div>
        )}

        {phase === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
            <p className="text-white font-semibold text-lg">AXON analysiert deine Baselines…</p>
            <p className="text-slate-400 text-sm">Dein neuronales Profil wird kalibriert.</p>
          </motion.div>
        )}

        {phase === 'results' && (
          <DiscoveryResults
            key="results"
            tests={TESTS}
            answers={answers}
            goalLabel={goalParam ? (goalLabel || goalParam) : null}
            isGeneratingPlan={isGeneratingPlan}
            onContinue={handleContinue}
          />
        )}
      </AnimatePresence>
    </div>
  );
}