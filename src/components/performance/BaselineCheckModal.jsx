import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BaselineCheckModal({ goalName, onComplete, onCancel }) {
  const [baselines, setBaselines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [noChangesConfirmed, setNoChangesConfirmed] = useState(false);

  // Relevante Tests basierend auf dem Ziel
  const relevantTests = {
    'klimmzug': ['Max Pull-ups', 'Dead Hang', 'Max Push-ups', 'Plank Hold'],
    'pull': ['Max Pull-ups', 'Dead Hang', 'Max Push-ups', 'Plank Hold'],
    'push': ['Max Push-ups', 'Max Pull-ups', 'Plank Hold', 'Shoulder Flexibility'],
    'squat': ['Deep Squat Test', 'Forward Fold Test', 'Single Leg Balance'],
    'pistol': ['Deep Squat Test', 'Single Leg Balance', 'Forward Fold Test'],
    'handstand': ['Handstand Hold', 'Shoulder Flexibility', 'Max Push-ups', 'Plank Hold'],
    'default': ['Deep Squat Test', 'Max Pull-ups', 'Max Push-ups', 'Plank Hold', 'Forward Fold Test']
  };

  // Bestimme relevante Tests für das Ziel
  const getRelevantTestsForGoal = () => {
    const goalLower = goalName.toLowerCase();
    for (const [key, tests] of Object.entries(relevantTests)) {
      if (goalLower.includes(key)) {
        return tests;
      }
    }
    return relevantTests.default;
  };

  useEffect(() => {
    const loadBaselines = async () => {
      try {
        const user = await base44.auth.me();
        const data = await base44.entities.PerformanceBaseline.filter({
          user_email: user.email
        });

        const relevantTestNames = getRelevantTestsForGoal();
        
        // Filtere nur relevante Tests
        let relevantBaselines = data.filter(b => relevantTestNames.includes(b.test_name));

        // Falls keine Baselines vorhanden, erstelle Template
        if (relevantBaselines.length === 0) {
          relevantBaselines = relevantTestNames.slice(0, 4).map(testName => ({
            test_name: testName,
            result_value: '',
            result_unit: getDefaultUnit(testName),
            baseline_level: 'beginner',
            isNew: true
          }));
        }

        setBaselines(relevantBaselines);
      } catch (error) {
        console.error('Error loading baselines:', error);
        toast.error('Fehler beim Laden der Baselines');
      } finally {
        setIsLoading(false);
      }
    };

    loadBaselines();
  }, [goalName]);

  const getDefaultUnit = (testName) => {
    if (testName.includes('Hold') || testName.includes('Plank')) return 'Sekunden';
    if (testName.includes('Jump')) return 'cm';
    if (testName.includes('Fold') || testName.includes('Reach')) return 'cm';
    return 'Reps';
  };

  const handleValueChange = (index, value) => {
    const updated = [...baselines];
    updated[index].result_value = value;
    setBaselines(updated);
    setHasChanges(true);
    setNoChangesConfirmed(false);
  };

  const handleNoChanges = () => {
    setNoChangesConfirmed(true);
    setHasChanges(false);
  };

  const handleSaveAndContinue = async () => {
    // Validierung: Entweder wurden Werte aktualisiert oder "Keine Änderungen" bestätigt
    if (!hasChanges && !noChangesConfirmed) {
      toast.error('Bitte aktualisiere deine Werte oder bestätige, dass sich nichts geändert hat.');
      return;
    }

    setIsSaving(true);

    try {
      const user = await base44.auth.me();

      // Speichere nur geänderte Baselines
      if (hasChanges) {
        for (const baseline of baselines) {
          if (baseline.result_value && baseline.result_value !== '') {
            if (baseline.isNew || !baseline.id) {
              // Erstelle neue Baseline
              await base44.entities.PerformanceBaseline.create({
                user_email: user.email,
                test_name: baseline.test_name,
                test_category: 'functional_movement',
                result_value: parseFloat(baseline.result_value),
                result_unit: baseline.result_unit,
                baseline_level: baseline.baseline_level || 'intermediate',
                test_date: new Date().toISOString().split('T')[0],
                fitness_goal_aligned: 'improve_performance'
              });
            } else {
              // Update bestehende Baseline
              await base44.entities.PerformanceBaseline.update(baseline.id, {
                result_value: parseFloat(baseline.result_value),
                test_date: new Date().toISOString().split('T')[0]
              });
            }
          }
        }
        toast.success('Baselines erfolgreich aktualisiert!');
      }

      // Weiter zum nächsten Schritt
      onComplete();
    } catch (error) {
      console.error('Error saving baselines:', error);
      toast.error('Fehler beim Speichern der Baselines');
      setIsSaving(false);
    }
  };

  const getTestLabel = (testName) => {
    const labels = {
      'Deep Squat Test': 'Tiefe Kniebeuge',
      'Shoulder Reach Test': 'Schulterreichweite',
      'Max Pull-ups': 'Max Klimmzüge',
      'Max Push-ups': 'Max Liegestütze',
      'Forward Fold Test': 'Vorwärtsbeuge',
      'Shoulder Flexibility': 'Schulterbeweglichkeit',
      'Vertical Jump': 'Vertikalsprung',
      'Plank Hold': 'Planke halten',
      'Dead Hang': 'Dead Hang',
      'Handstand Hold': 'Handstand halten',
      'Single Leg Balance': 'Einbeinstand'
    };
    return labels[testName] || testName;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl glass rounded-2xl border border-cyan-500/30 my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-cyan-400">Performance-Check</h2>
          </div>
          <p className="text-sm text-slate-300">
            Bevor wir deinen neuen Trainingsplan erstellen, aktualisiere bitte deine aktuellen Leistungswerte.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Wichtig:</strong> Ein realistischer Trainingsplan basiert auf aktuellen Daten. 
                Bitte nimm dir einen Moment Zeit, deine Werte zu überprüfen.
              </span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-200 text-sm">
                  Relevante Tests für dein Ziel: <span className="text-cyan-400">{goalName}</span>
                </h3>

                {baselines.map((baseline, index) => (
                  <div key={index} className="glass rounded-lg p-4 border border-slate-700">
                    <Label className="text-slate-300 text-sm mb-2 block">
                      {getTestLabel(baseline.test_name)}
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Wert eingeben"
                        value={baseline.result_value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        className="flex-1 bg-slate-800/50 border-slate-700 text-white"
                      />
                      <div className="flex items-center px-3 glass rounded-lg border border-slate-700 text-slate-400 text-sm min-w-[100px] justify-center">
                        {baseline.result_unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* No Changes Button */}
              <div className="pt-4 border-t border-slate-700">
                <Button
                  onClick={handleNoChanges}
                  className={`w-full ${
                    noChangesConfirmed 
                      ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {noChangesConfirmed ? 'Bestätigt: Keine Änderungen' : 'Alles ist gleich geblieben'}
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={onCancel}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSaveAndContinue}
                  disabled={isSaving || (!hasChanges && !noChangesConfirmed)}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      Speichern & Fortfahren
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}