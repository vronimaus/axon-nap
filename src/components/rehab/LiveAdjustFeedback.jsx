import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function LiveAdjustFeedback({ 
  exerciseId, 
  exerciseName, 
  rehabPlanId, 
  onAdjustmentReceived 
}) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [painScore, setPainScore] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustment, setAdjustment] = useState(null);

  const nodes = ['N1', 'N2', 'N5', 'N7', 'N10', 'N12'];

  const handleOuchSubmit = async () => {
    if (painScore === undefined) {
      toast.error('Bitte setze einen Schmerz-Score');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await base44.functions.invoke('liveAdjustAlgorithm', {
        rehabPlanId,
        exerciseId,
        nodeFeedback: selectedNode,
        painNrs: painScore
      });

      setAdjustment(data.adjustment);
      onAdjustmentReceived?.(data);
      
      toast.success(data.adjustment.recommendation);
      
      setTimeout(() => {
        setShowFeedbackModal(false);
        setPainScore(5);
        setSelectedNode(null);
      }, 2000);
    } catch (error) {
      toast.error('Fehler bei Live-Anpassung: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating "Ouch?" Button */}
      <motion.button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-24 md:bottom-8 right-6 z-40 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-full shadow-lg flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Schmerz oder Discomfort melden - Live-Anpassung aktivieren"
      >
        <AlertCircle className="w-5 h-5" />
        <span className="hidden xs:inline">Ouch!</span>
      </motion.button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass rounded-2xl border border-red-500/30 max-w-md w-full p-6 space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Schmerz-Feedback</h3>
                <p className="text-sm text-slate-400">
                  Übung: <span className="text-cyan-300">{exerciseName}</span>
                </p>
              </div>

              {/* Node Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300">Wo tut es weh? (Optional)</label>
                <div className="grid grid-cols-3 gap-2">
                  {nodes.map(node => (
                    <button
                      key={node}
                      onClick={() => setSelectedNode(selectedNode === node ? null : node)}
                      className={`py-2 px-3 rounded-lg font-mono text-sm transition-all ${
                        selectedNode === node
                          ? 'bg-red-500/30 border border-red-500 text-red-400'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-red-500'
                      }`}
                    >
                      {node}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Score Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-300">Schmerz-Intensität</label>
                  <span className={`text-2xl font-bold ${
                    painScore >= 7 ? 'text-red-500' :
                    painScore >= 5 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {painScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={painScore}
                  onChange={e => setPainScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Kein Schmerz</span>
                  <span>Maximaler Schmerz</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`rounded-lg p-3 ${
                painScore >= 8 ? 'bg-red-500/20 border border-red-500/50' :
                painScore >= 5 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                'bg-green-500/20 border border-green-500/50'
              }`}>
                <p className="text-sm font-semibold text-slate-300">
                  {painScore >= 8 ? '🔴 Kritisch - Sofortige Anpassung' :
                   painScore >= 5 ? '🟡 Moderat - Parametrische Anpassung' :
                   '🟢 Mild - Monitoring'}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleOuchSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600"
                >
                  {isSubmitting ? 'Analysiere...' : 'Feedback senden'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjustment Result Toast (inline) */}
      <AnimatePresence>
        {adjustment && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-50 glass rounded-2xl border border-cyan-500/30 p-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-cyan-400 mb-1">{adjustment.recommendation}</p>
                <p className="text-sm text-slate-400">{adjustment.reasoning}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}