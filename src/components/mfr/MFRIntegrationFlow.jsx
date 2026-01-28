import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MFRWorkflow from './MFRWorkflow';

const PHASES = [
  { phase: 1, name: 'ASSESSMENT', icon: '🔎', desc: 'Schmerzanalyse mit Detective Chat', status: 'active' },
  { phase: 2, name: 'HARDWARE (MFR)', icon: '🔧', desc: '12-Node-Release-Protokoll', status: 'pending' },
  { phase: 3, name: 'SOFTWARE', icon: '🧠', desc: 'Neuro-Drills & Reset', status: 'pending' },
  { phase: 4, name: 'VALIDATION', icon: '✅', desc: 'Re-Test & Integration', status: 'pending' }
];

export default function MFRIntegrationFlow({ diagnosisSessionId, onPhaseComplete = () => {} }) {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [completedPhases, setCompletedPhases] = useState([]);

  const { data: session } = useQuery({
    queryKey: ['diagnosisSession', diagnosisSessionId],
    queryFn: () => base44.entities.DiagnosisSession.filter({ id: diagnosisSessionId })
      .then(sessions => sessions[0] || null)
  });

  const { data: mfrSession } = useQuery({
    queryKey: ['mfrSession', diagnosisSessionId],
    queryFn: () => base44.entities.MFRSession.filter({ diagnosis_session_id: diagnosisSessionId })
      .then(sessions => sessions[0] || null)
  });

  const handleMFRComplete = async () => {
    setCompletedPhases(prev => [...new Set([...prev, 2])]);
    setCurrentPhase(3);
    onPhaseComplete(2);
  };

  const getPhaseStatus = (phaseNum) => {
    if (currentPhase === phaseNum) return 'active';
    if (completedPhases.includes(phaseNum)) return 'completed';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Phase Progress Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
            ⚡ 4-Phasen MFR-Integration
          </h1>

          {/* Phase Indicators */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {PHASES.map((p, idx) => (
              <div key={p.phase} className="flex items-center gap-3 flex-shrink-0">
                <motion.button
                  onClick={() => {
                    if (completedPhases.includes(p.phase)) {
                      setCurrentPhase(p.phase);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    getPhaseStatus(p.phase) === 'active'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                      : getPhaseStatus(p.phase) === 'completed'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className="mr-2">{p.icon}</span>
                  {p.name}
                </motion.button>

                {idx < PHASES.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentPhase === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="phase-1"
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🔎</div>
              <h2 className="text-3xl font-bold text-white mb-3">Assessment Phase</h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                Der Detective Chat hat deine Schmerzregion analysiert. 
                Basierend darauf wurden die relevanten MFR-Nodes identifiziert.
              </p>

              {session && (
                <div className="bg-slate-800/50 rounded-xl border border-cyan-500/30 p-6 max-w-2xl mx-auto mb-8 text-left">
                  <h3 className="font-bold text-cyan-400 mb-3">Deine Diagnose:</h3>
                  <ul className="text-slate-300 space-y-2">
                    <li><strong>Region:</strong> {session.symptom_location}</li>
                    <li><strong>Symptom:</strong> {session.symptom_description}</li>
                    <li><strong>Typ:</strong> {session.diagnosis_type}</li>
                  </ul>
                </div>
              )}

              <Button
                onClick={() => setCurrentPhase(2)}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600"
              >
                Zum Hardware-Release (MFR)
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {currentPhase === 2 && (
            <MFRWorkflow
              sessionId={diagnosisSessionId}
              onComplete={handleMFRComplete}
            />
          )}

          {currentPhase === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="phase-3"
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🧠</div>
              <h2 className="text-3xl font-bold text-white mb-3">Software Phase</h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                Hardware ist freigegeben. Jetzt aktivieren wir dein Nervensystem 
                mit gezielten Neuro-Drills, um das neue Signal zu etablieren.
              </p>
              <Button
                onClick={() => setCurrentPhase(4)}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-600"
              >
                Zu Integration & Validation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {currentPhase === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="phase-4"
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-white mb-3">Validation & Integration</h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                Teste deine neue Mobilität. Wiederhole die Ursprungsbewegung 
                und vergleiche mit der Pre-Test Situation.
              </p>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 p-6 max-w-2xl mx-auto mb-8">
                <h3 className="font-bold text-green-400 mb-3 text-left">Re-Test Protokoll:</h3>
                <ul className="text-slate-300 space-y-2 text-left">
                  <li>✓ Führe deine ursprüngliche Problembewegung durch</li>
                  <li>✓ Bewerte Bewegungsqualität (leichter/freier?)</li>
                  <li>✓ Prüfe auf Schmerz-Reduktion (wie viel %?)</li>
                  <li>✓ Speichere die Session ab</li>
                </ul>
              </div>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600"
              >
                Zurück zum Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}