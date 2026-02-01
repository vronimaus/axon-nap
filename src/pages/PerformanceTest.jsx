import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, ChevronRight, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

const TEST_SUITE = {
  reduce_pain: [
    {
      name: 'Deep Squat Test',
      description: 'Wie tief kannst du schmerzfrei in die Hocke gehen?',
      instruction: 'Füße schulterbreit, gehe langsam so tief wie möglich. Notiere die maximale Tiefe (0-100%, 0=keine Tiefe, 100=volle Tiefe)',
      unit: '%',
      expected: '60%+',
      icon: '🦵'
    },
    {
      name: 'Shoulder Reach Test',
      description: 'Wie gut ist deine Schulter-Mobilität?',
      instruction: 'Hände hinter dem Rücken, versuche die Hände zu berühren. Notiere den Abstand in cm (0=berühren, negativ=Lücke)',
      unit: 'cm',
      expected: '0cm oder näher',
      icon: '💪'
    }
  ],
  build_strength: [
    {
      name: 'Max Pull-ups',
      description: 'Wie viele klimmzüge schaffst du?',
      instruction: 'Starte mit Armen gestreckt, pull-up bis Kinn über der Stange. Zähle nur saubere Wiederholungen.',
      unit: 'reps',
      expected: '3+',
      icon: '📈'
    },
    {
      name: 'Max Push-ups',
      description: 'Wie viele Liegestütze schaffst du?',
      instruction: 'Standardposition, gehe runter bis Brust knapp über dem Boden, push zurück hoch. Nur saubere Reps zählen.',
      unit: 'reps',
      expected: '10+',
      icon: '💪'
    }
  ],
  improve_mobility: [
    {
      name: 'Forward Fold Test',
      description: 'Wie nah kommst du mit den Händen an deine Zehen?',
      instruction: 'Stehe aufrecht, beuge dich nach vorne. Notiere wie viele cm deine Hände von den Zehen entfernt sind (0=berühren, negativ=über den Zehen)',
      unit: 'cm',
      expected: '0cm oder näher',
      icon: '🤸'
    },
    {
      name: 'Shoulder Flexibility',
      description: 'Wie beweglich sind deine Schultern?',
      instruction: 'Arme über den Kopf, versuche die Hände hinter dem Kopf zu berühren. Notiere den Abstand in cm.',
      unit: 'cm',
      expected: '0cm oder näher',
      icon: '🧘'
    }
  ],
  improve_performance: [
    {
      name: 'Vertical Jump',
      description: 'Wie hoch kannst du springen?',
      instruction: 'Stelle dich mit beiden Füßen hin, kreuze die Arme und springe so hoch wie möglich. Notiere die Höhe in cm.',
      unit: 'cm',
      expected: '40cm+',
      icon: '🚀'
    },
    {
      name: 'Plank Hold',
      description: 'Wie lange kannst du einen Plank halten?',
      instruction: 'Unterarmstütz, Körper gerade. Halten bis zur Erschöpfung. Notiere Zeit in Sekunden.',
      unit: 'seconds',
      expected: '60+',
      icon: '⏱️'
    }
  ]
};

const getBaselineLevel = (testName, value, unit) => {
  const mappings = {
    'Deep Squat Test': { 60: 'beginner', 80: 'intermediate', 100: 'advanced' },
    'Shoulder Reach Test': { -5: 'beginner', 0: 'intermediate', 5: 'advanced' },
    'Max Pull-ups': { 1: 'beginner', 5: 'intermediate', 10: 'advanced' },
    'Max Push-ups': { 5: 'beginner', 15: 'intermediate', 30: 'advanced' },
    'Forward Fold Test': { -10: 'beginner', 0: 'intermediate', 10: 'advanced' },
    'Shoulder Flexibility': { -10: 'beginner', 0: 'intermediate', 10: 'advanced' },
    'Vertical Jump': { 20: 'beginner', 40: 'intermediate', 60: 'advanced' },
    'Plank Hold': { 30: 'beginner', 60: 'intermediate', 120: 'advanced' }
  };

  const thresholds = mappings[testName];
  if (!thresholds) return 'intermediate';

  const sorted = Object.entries(thresholds).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
  
  for (const [threshold, level] of sorted) {
    if (value >= parseFloat(threshold)) {
      return level;
    }
  }
  
  return 'beginner';
};

export default function PerformanceTest() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [currentTestIdx, setCurrentTestIdx] = useState(0);
  const [testResults, setTestResults] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    checkAuth();
  }, []);

  // Fetch user profile to get fitness goals
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userNeuroProfile', user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const profiles = await base44.entities.UserNeuroProfile.filter({
        user_email: user.email
      });
      return profiles[0] || null;
    }
  });

  // Determine tests based on goals
  const testsToShow = profile?.fitness_goals 
    ? profile.fitness_goals.flatMap(goal => TEST_SUITE[goal] || [])
    : [];

  // Save results mutation
  const saveMutation = useMutation({
    mutationFn: async (results) => {
      const promises = Object.entries(results).map(([testName, value]) => {
        const test = testsToShow.find(t => t.name === testName);
        return base44.entities.PerformanceBaseline.create({
          user_email: user.email,
          test_name: testName,
          test_category: 'functional_movement',
          result_value: parseFloat(value),
          result_unit: test?.unit || '',
          fitness_goal_aligned: profile?.fitness_goals?.[0] || '',
          baseline_level: getBaselineLevel(testName, parseFloat(value), test?.unit || ''),
          test_date: new Date().toISOString().split('T')[0]
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Tests gespeichert! 🎉');
      queryClient.invalidateQueries({ queryKey: ['userNeuroProfile'] });
      setIsCompleted(true);
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  });

  const handleSubmitResult = (value) => {
    const currentTest = testsToShow[currentTestIdx];
    const newResults = { ...testResults, [currentTest.name]: value };
    setTestResults(newResults);

    if (currentTestIdx < testsToShow.length - 1) {
      setCurrentTestIdx(currentTestIdx + 1);
    } else {
      // All tests completed
      saveMutation.mutate(newResults);
    }
  };

  const handleSkip = () => {
    if (currentTestIdx < testsToShow.length - 1) {
      setCurrentTestIdx(currentTestIdx + 1);
    } else {
      saveMutation.mutate(testResults);
    }
  };

  if (profileLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Tests abgeschlossen! 🚀</h1>
          <p className="text-slate-300 mb-8">
            Deine Baselines sind gespeichert. Das System passt sich jetzt an deine Stärken und Schwächen an.
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            size="lg"
          >
            Zum Dashboard →
          </Button>
        </motion.div>
      </div>
    );
  }

  if (testsToShow.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-red-500/30 p-8 text-center max-w-md">
          <p className="text-slate-300 mb-4">Es scheinen keine Ziele in deinem Profil gesetzt zu sein.</p>
          <Button
            onClick={() => window.location.href = createPageUrl('Profile')}
            variant="outline"
            className="w-full"
          >
            Zum Profil →
          </Button>
        </Card>
      </div>
    );
  }

  const currentTest = testsToShow[currentTestIdx];
  const progress = ((currentTestIdx + 1) / testsToShow.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Performance Baseline</h1>
          <p className="text-slate-400">
            Zeige uns was du drauf hast – das System lernt von dir
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">
              Test {currentTestIdx + 1} / {testsToShow.length}
            </span>
            <span className="text-sm text-cyan-400 font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Test Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTest.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl border border-cyan-500/30 p-8 mb-6"
          >
            <div className="flex items-start gap-4 mb-6">
              <span className="text-5xl">{currentTest.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{currentTest.name}</h2>
                <p className="text-slate-300 text-lg">{currentTest.description}</p>
              </div>
            </div>

            {/* Instruction */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
              <p className="text-cyan-300 text-sm leading-relaxed">
                {currentTest.instruction}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-slate-700/30 rounded-lg p-3 mb-6 text-sm text-slate-300">
              <p>💡 <strong>Erwartet:</strong> {currentTest.expected}</p>
            </div>

            {/* Input Field */}
            <TestInput
              unit={currentTest.unit}
              onSubmit={handleSubmitResult}
            />

            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="mt-6 w-full text-slate-400 hover:text-slate-300 text-sm py-2 transition-colors"
            >
              Überspringen →
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Completed Tests Summary */}
        {Object.keys(testResults).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-green-500/30 p-6"
          >
            <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Bereits gemacht:
            </h3>
            <div className="space-y-2">
              {Object.entries(testResults).map(([testName, value]) => {
                const test = testsToShow.find(t => t.name === testName);
                return (
                  <div key={testName} className="flex justify-between text-sm text-slate-300">
                    <span>{testName}</span>
                    <span className="font-semibold text-green-400">
                      {value} {test?.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function TestInput({ unit, onSubmit }) {
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(false);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
      setValue('');
    }
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm text-slate-300 mb-2 block">Dein Ergebnis</span>
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="0"
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            autoFocus
          />
          <div className="px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 min-w-max flex items-center">
            {unit}
          </div>
        </div>
      </label>
      <Button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:opacity-50 gap-2"
      >
        <Play className="w-4 h-4" />
        Nächster Test →
      </Button>
    </div>
  );
}