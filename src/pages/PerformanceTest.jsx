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
      instruction: 'Stelle dich hin, Füße etwa schulterbreit auseinander. Gehe langsam nach unten in die Hocke, so tief wie möglich – ohne in den Schmerz zu gehen. Deine Fersen sollten am Boden bleiben, Oberkörper aufrecht. Gehe nur so tief, wie es schmerzfrei möglich ist. Schätze die Tiefe (0% = überhaupt nicht runter, 100% = volle Tiefe mit Oberschenkeln parallel zum Boden).',
      unit: '%',
      expected: '60%+',
      icon: '🦵'
    },
    {
      name: 'Shoulder Reach Test',
      description: 'Wie gut ist deine Schulter-Mobilität?',
      instruction: 'Stelle dich aufrecht hin. Bring einen Arm über den Kopf und beuge ihn, sodass deine Hand zwischen deine Schulterblätter zeigt. Bring den anderen Arm nach unten hinter deinen Rücken und versuche, mit dieser Hand ebenfalls zwischen deine Schulterblätter zu greifen. Versuche, deine Finger zu berühren oder zu greifen. Notiere den Abstand zwischen den Fingerspitzen in cm (0 = Finger berühren sich, negativ = Lücke dazwischen, positiv = Überlappung).',
      unit: 'cm',
      expected: '0cm oder näher',
      icon: '💪'
    }
  ],
  build_strength: [
    {
      name: 'Max Pull-ups',
      description: 'Wie viele saubere Klimmzüge schaffst du?',
      instruction: 'Hänge dich mit gestreckten Armen an eine Stange (Grip schulterbreit, Handflächen zeigen weg). Ziehe dich hoch, bis dein Kinn über der Stange ist. Gehe kontrolliert wieder runter. Zähle nur saubere Wiederholungen – dein Körper sollte gerade sein, keine wild wippenden Bewegungen.',
      unit: 'reps',
      expected: '3+',
      icon: '📈'
    },
    {
      name: 'Max Push-ups',
      description: 'Wie viele saubere Liegestütze schaffst du?',
      instruction: 'Starte in Plank-Position: Hände schulterbreit unter deinen Schultern, Körper gerade von Kopf bis Ferse. Senke deinen Körper ab, bis deine Brust knapp über dem Boden ist. Drücke dich wieder hoch. Zähle nur saubere Reps – dein Körper bleibt die ganze Zeit angespannt und gerade.',
      unit: 'reps',
      expected: '10+',
      icon: '💪'
    }
  ],
  improve_mobility: [
    {
      name: 'Forward Fold Test',
      description: 'Wie nah kommst du mit den Händen an deine Zehen?',
      instruction: 'Stelle dich aufrecht hin, Beine gerade und entspannt. Beuge dich langsam nach vorne, lasse deine Arme hängen. Gehe nur so weit, wie es sich angenehm anfühlt – ohne in den Schmerz zu gehen. Notiere, wie viele cm deine Fingerspitzen von deinen Zehen entfernt sind (0 = du berührst die Zehen, negativ = deine Hände sind über den Zehen).',
      unit: 'cm',
      expected: '0cm oder näher',
      icon: '🤸'
    },
    {
      name: 'Shoulder Flexibility',
      description: 'Wie beweglich sind deine Schultern?',
      instruction: 'Stelle dich aufrecht hin. Hebe einen Arm über den Kopf und beuge ihn im Ellenbogen, sodass deine Hand zum Rücken zeigt und zwischen deine Schulterblätter zeigt. Bring den anderen Arm hinter deinen Rücken nach oben. Versuche, deine Fingerspitzen zu berühren oder zu greifen. Notiere den Abstand in cm (0 = Finger berühren, negativ = Lücke, positiv = Überlappung). Mache das Test auf beiden Seiten.',
      unit: 'cm',
      expected: '0cm oder näher',
      icon: '🧘'
    }
  ],
  improve_performance: [
    {
      name: 'Vertical Jump',
      description: 'Wie hoch kannst du springen?',
      instruction: 'Stelle dich mit beiden Füßen etwa schulterbreit hin. Kreuze deine Arme vor der Brust. Mache eine kleine Hocke (Gegenbewegung) und springe dann explosiv so hoch wie möglich in die Luft. Versuche, mit der Hand so hoch wie möglich an die Wand zu tippen (oder stellt euch eine imaginäre Höhe vor). Notiere die maximale Sprunghöhe in cm von der Ausgangsposition.',
      unit: 'cm',
      expected: '40cm+',
      icon: '🚀'
    },
    {
      name: 'Plank Hold',
      description: 'Wie lange kannst du einen Plank halten?',
      instruction: 'Starte in Unterarmstütz: Unterarme auf dem Boden, Ellenbogen unter den Schultern, Körper gerade von Kopf bis Ferse. Deine Core sollte angespannt sein, damit dein Rücken nicht hängt. Halte diese Position so lange wie möglich, bis zur Erschöpfung. Notiere die Zeit in Sekunden.',
      unit: 'seconds',
      expected: '60+',
      icon: '⏱️'
    }
  ]
};

const getBaselineLevel = (testName, value, unit) => {
  const mappings = {
    'Deep Squat Test': [
      { min: 0, max: 60, level: 'beginner' },
      { min: 60, max: 80, level: 'intermediate' },
      { min: 80, max: 100, level: 'advanced' }
    ],
    'Shoulder Reach Test': [
      { min: -100, max: -5, level: 'beginner' },
      { min: -5, max: 0, level: 'intermediate' },
      { min: 0, max: 100, level: 'advanced' }
    ],
    'Max Pull-ups': [
      { min: 0, max: 3, level: 'beginner' },
      { min: 3, max: 8, level: 'intermediate' },
      { min: 8, max: 100, level: 'advanced' }
    ],
    'Max Push-ups': [
      { min: 0, max: 10, level: 'beginner' },
      { min: 10, max: 25, level: 'intermediate' },
      { min: 25, max: 100, level: 'advanced' }
    ],
    'Forward Fold Test': [
      { min: -100, max: -10, level: 'beginner' },
      { min: -10, max: 0, level: 'intermediate' },
      { min: 0, max: 100, level: 'advanced' }
    ],
    'Shoulder Flexibility': [
      { min: -100, max: -10, level: 'beginner' },
      { min: -10, max: 0, level: 'intermediate' },
      { min: 0, max: 100, level: 'advanced' }
    ],
    'Vertical Jump': [
      { min: 0, max: 30, level: 'beginner' },
      { min: 30, max: 50, level: 'intermediate' },
      { min: 50, max: 100, level: 'advanced' }
    ],
    'Plank Hold': [
      { min: 0, max: 45, level: 'beginner' },
      { min: 45, max: 90, level: 'intermediate' },
      { min: 90, max: 10000, level: 'advanced' }
    ]
  };

  const thresholds = mappings[testName];
  if (!thresholds) return 'intermediate';

  for (const threshold of thresholds) {
    if (value >= threshold.min && value < threshold.max) {
      return threshold.level;
    }
  }
  
  return 'advanced';
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