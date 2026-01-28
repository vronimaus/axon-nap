import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Check, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MFRBodyMap from './MFRBodyMap';
import PressureRules from './PressureRules';

const STEPS = [
  { key: 'identify', label: 'IDENTIFY', icon: '🎯', desc: 'Schmerzpunkt markieren' },
  { key: 'prepare', label: 'PREPARE', icon: '💪', desc: 'Hardware-Release (MFR)' },
  { key: 'program', label: 'PROGRAM', icon: '🧠', desc: 'Software-Drill' },
  { key: 'perform', label: 'PERFORM', icon: '⚡', desc: 'Integration' }
];

export default function MFRWorkflow({ sessionId, onComplete = () => {} }) {
  const [step, setStep] = useState('identify');
  const [selectedNode, setSelectedNode] = useState(null);
  const [showPressureRules, setShowPressureRules] = useState(false);
  const [position, setPosition] = useState('back');
  const [completedNodes, setCompletedNodes] = useState([]);

  const { data: mfrSession } = useQuery({
    queryKey: ['mfrSession', sessionId],
    queryFn: () => base44.entities.MFRSession.filter({ diagnosis_session_id: sessionId })
      .then(sessions => sessions[0] || null)
  });

  const { data: mfrNodes = [] } = useQuery({
    queryKey: ['allMfrNodes'],
    queryFn: () => base44.entities.MFRNode.list()
  });

  useEffect(() => {
    if (mfrSession) {
      setStep(mfrSession.step);
      setCompletedNodes(mfrSession.completed_nodes || []);
    }
  }, [mfrSession]);

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    if (step === 'prepare') {
      setShowPressureRules(true);
    }
  };

  const handlePressureRuleClose = async () => {
    setShowPressureRules(false);
    // Mark node as completed
    if (selectedNode) {
      setCompletedNodes(prev => [...new Set([...prev, selectedNode.node_id])]);
      
      // Update session
      await base44.entities.MFRSession.update(mfrSession?.id || sessionId, {
        completed_nodes: [...new Set([...completedNodes, selectedNode.node_id])],
        current_node_id: selectedNode.node_id
      });
    }
  };

  const handleStepComplete = async () => {
    const nextStepIdx = STEPS.findIndex(s => s.key === step) + 1;
    if (nextStepIdx < STEPS.length) {
      const nextStep = STEPS[nextStepIdx].key;
      setStep(nextStep);
      
      // Update session
      if (mfrSession?.id) {
        await base44.entities.MFRSession.update(mfrSession.id, {
          step: nextStep
        });
      }
    } else {
      // Workflow complete
      if (mfrSession?.id) {
        await base44.entities.MFRSession.update(mfrSession.id, {
          is_completed: true
        });
      }
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Progress Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Hardware Release (MFR)
            </h1>
            <div className="text-sm text-slate-400">
              {completedNodes.length} / {mfrNodes.length} Nodes
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.key} className="flex items-center">
                <motion.button
                  onClick={() => {
                    const targetIdx = STEPS.findIndex(st => st.key === step);
                    if (idx <= targetIdx) setStep(s.key);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                    step === s.key
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                      : idx < STEPS.findIndex(st => st.key === step)
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className="mr-2">{s.icon}</span>
                  {s.label}
                </motion.button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'identify' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Schmerzpunkt identifizieren</h2>
                <p className="text-slate-400">Wähle die Region aus, die dir am meisten Probleme macht</p>
              </div>

              <div className="flex gap-4 justify-center mb-8">
                {['back', 'front', 'side'].map(pos => (
                  <Button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    variant={position === pos ? 'default' : 'outline'}
                    className={`capitalize ${
                      position === pos
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600'
                        : 'border-cyan-500/30'
                    }`}
                  >
                    {pos === 'back' ? '🔄 Hinten' : pos === 'front' ? '🔃 Vorne' : '↔️ Seite'}
                  </Button>
                ))}
              </div>

              <div className="flex justify-center mb-8">
                <MFRBodyMap 
                  position={position}
                  completedNodes={completedNodes}
                />
              </div>

              <div className="text-center">
                <Button
                  onClick={handleStepComplete}
                  disabled={!selectedNode}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  Weiter zur Vorbereitung
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'prepare' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Hardware Release durchführen</h2>
                <p className="text-slate-400">Bearbeite die Trigger-Points nacheinander</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {['back', 'front'].map(pos => (
                  <div key={pos} className="flex justify-center">
                    <MFRBodyMap
                      position={pos}
                      selectedNode={selectedNode}
                      onNodeSelect={handleNodeSelect}
                      completedNodes={completedNodes}
                    />
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  onClick={handleStepComplete}
                  disabled={completedNodes.length < 6}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  {completedNodes.length >= 6 ? 'Zum nächsten Schritt' : `Mindestens 6 Nodes (${completedNodes.length}/6)`}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'program' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="text-6xl mb-4">🧠</div>
              <h2 className="text-3xl font-bold text-white mb-2">Software Drill</h2>
              <p className="text-slate-400 mb-8">
                Jetzt aktivieren wir dein Nervensystem mit gezielten neuro-athletischen Drills
              </p>
              <Button
                onClick={handleStepComplete}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-600"
              >
                Zum Integrations-Schritt
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 'perform' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-3xl font-bold text-white mb-2">Integration</h2>
              <p className="text-slate-400 mb-8">
                Speichere die neue Bewegungsfreiheit durch aktive Kontrolle
              </p>
              <Button
                onClick={() => {
                  handleStepComplete();
                  onComplete();
                }}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600"
              >
                <Check className="w-5 h-5 mr-2" />
                MFR-Phase abgeschlossen
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pressure Rules Modal */}
      {showPressureRules && (
        <PressureRules 
          node={selectedNode}
          onClose={handlePressureRuleClose}
        />
      )}
    </div>
  );
}