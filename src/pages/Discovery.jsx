import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';
import DiscoveryTest from '../components/discovery/DiscoveryTest.jsx';
import DiscoveryResults from '../components/discovery/DiscoveryResults.jsx';

const TESTS = [
  {
    id: 'pull_capacity',
    name: 'Zug-Kapazität',
    category: 'max_strength',
    question: 'Wie viele saubere Klimmzüge (oder negative Klimmzüge) schaffst du?',
    unit: 'reps',
    metric_label: 'Wiederholungen',
    hint: 'Falls 0: Kannst du dich 5 Sekunden oben halten (negativer Klimmzug)?',
    icon: '🏋️',
    min: 0,
    max: 30,
    thresholds: { beginner: 2, intermediate: 6, advanced: 12, elite: 20 },
    related_goals: ['pullup', 'muscle_up', 'front_lever'],
  },
  {
    id: 'push_capacity',
    name: 'Druck-Kapazität',
    category: 'max_strength',
    question: 'Wie viele saubere Liegestütze schaffst du am Stück?',
    unit: 'reps',
    metric_label: 'Wiederholungen',
    hint: 'Brust muss den Boden berühren, Körper bleibt gerade.',
    icon: '💪',
    min: 0,
    max: 60,
    thresholds: { beginner: 5, intermediate: 15, advanced: 30, elite: 50 },
    related_goals: ['handstand', 'planche', 'muscle_up'],
  },
  {
    id: 'core_stability',
    name: 'Core-Stabilität',
    category: 'endurance',
    question: 'Wie lange hältst du eine saubere Plank (Unterarm)?',
    unit: 'seconds',
    metric_label: 'Sekunden',
    hint: 'Hüfte nicht hängen lassen, Blick zum Boden.',
    icon: '🧱',
    min: 0,
    max: 300,
    thresholds: { beginner: 20, intermediate: 60, advanced: 120, elite: 180 },
    related_goals: ['front_lever', 'handstand', 'pistol_squat'],
  },
  {
    id: 'hip_mobility',
    name: 'Hüft-Mobilität',
    category: 'mobility',
    question: 'Wie tief kommst du in eine tiefe Kniebeuge (Fersen bleiben am Boden)?',
    unit: 'level',
    metric_label: 'Level',
    hint: 'Level 1: Fersen heben sich. Level 2: 90°. Level 3: Volltiefe. Level 4: Volltiefe + Arme overhead.',
    icon: '🦵',
    min: 1,
    max: 4,
    step: 1,
    thresholds: { beginner: 1, intermediate: 2, advanced: 3, elite: 4 },
    labels: { 1: 'Fersen heben', 2: '90° Kniebeuge', 3: 'Volle Tiefe', 4: 'Overhead Squat' },
    related_goals: ['pistol_squat', 'middle_split', 'squat'],
  },
  {
    id: 'grip_endurance',
    name: 'Grip-Ausdauer',
    category: 'endurance',
    question: 'Wie lange hältst du dich an einer Klimmzugstange (Dead Hang)?',
    unit: 'seconds',
    metric_label: 'Sekunden',
    hint: 'Schultern aktiv nach unten ziehen, nicht einfach hängen lassen.',
    icon: '🤜',
    min: 0,
    max: 120,
    thresholds: { beginner: 10, intermediate: 30, advanced: 60, elite: 90 },
    related_goals: ['pullup', 'front_lever', 'muscle_up'],
  },
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

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        if (!u) { window.location.href = createPageUrl('Landing'); return; }
        setUser(u);
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

  const handleNext = () => {
    const currentTest = TESTS[currentTestIdx];
    if (answers[currentTest.id] === undefined) {
      const defaultVal = currentTest.unit === 'level' ? currentTest.min : 0;
      setAnswers(prev => ({ ...prev, [currentTest.id]: defaultVal }));
    }
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
          finalAnswers[test.id] = test.unit === 'level' ? test.min : 0;
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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">AXON Discovery</h1>
              <p className="text-slate-400 text-base leading-relaxed">
                5 kurze Tests. AXON scannt deine <strong className="text-amber-400">Baseline-Kapazitäten</strong> – und passt jeden Trainingsplan von Anfang an präzise auf dich an.
              </p>
            </div>
            <div className="glass rounded-xl border border-amber-500/30 p-5 text-left space-y-3">
              {TESTS.map((t) => (
                <div key={t.id} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-xl w-8 text-center">{t.icon}</span>
                  <span><strong className="text-white">{t.name}</strong> — {t.question.slice(0, 50)}…</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Dauer: ~3 Minuten • Einmalig • Kein Equipment nötig</p>
            <Button
              onClick={() => setPhase('testing')}
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-lg"
            >
              Assessment starten →
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
            onContinue={() => window.location.href = createPageUrl('Dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}