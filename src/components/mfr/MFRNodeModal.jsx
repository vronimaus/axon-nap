import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MFRNodeModal({ node, onClose }) {
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(node.compression_time_max || 90);
  const [completed, setCompleted] = useState(false);

  // Timer logic
  React.useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startTimer = () => {
    setTimeLeft(node.compression_time_max || 90);
    setCompleted(false);
    setTimerActive(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl border border-cyan-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-cyan-500/20 p-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400">{node.node_id}</h2>
              <p className="text-slate-300 mt-1">{node.name_de}</p>
              <p className="text-sm text-slate-500 mt-2">{node.body_area}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Target Chain */}
            <div>
              <h3 className="font-semibold text-white mb-2">Zielkette</h3>
              <p className="text-slate-300 bg-slate-800 rounded-lg p-3">{node.target_chain}</p>
            </div>

            {/* Localization */}
            <div>
              <h3 className="font-semibold text-white mb-3">Genaue Lokalisation</h3>
              <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-cyan-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Position</p>
                    <p className="text-slate-400 text-sm">{node.body_area}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compression Rules */}
            <div>
              <h3 className="font-semibold text-white mb-3">Druck-Regeln</h3>
              <div className="space-y-2">
                {node.pressure_rule_burning && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <div className="flex gap-2 items-start">
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-orange-300 font-medium text-sm">Wenn es brennt</p>
                        <p className="text-orange-200/70 text-sm">{node.pressure_rule_burning}</p>
                      </div>
                    </div>
                  </div>
                )}
                {node.pressure_rule_depth && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex gap-2 items-start">
                      <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-purple-300 font-medium text-sm">Tiefe Punkte</p>
                        <p className="text-purple-200/70 text-sm">{node.pressure_rule_depth}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Section */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-6">
              <div className="text-center">
                <p className="text-slate-300 mb-4">Kompressionszeit</p>
                <div className="text-5xl font-bold text-cyan-400 font-mono mb-6 tracking-widest">
                  {formatTime(timeLeft)}
                </div>
                <div className="flex gap-3 justify-center">
                  {!timerActive && !completed && (
                    <Button
                      onClick={startTimer}
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-8"
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      Timer starten
                    </Button>
                  )}
                  {timerActive && (
                    <Button
                      onClick={() => setTimerActive(false)}
                      variant="outline"
                      className="border-cyan-500 text-cyan-400 px-8"
                    >
                      Pausieren
                    </Button>
                  )}
                  {completed && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 text-green-400"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="font-semibold">Fertig!</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Compression Time Range */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-xs text-slate-400 text-center">
                  Empfohlene Kompressionszeit: {node.compression_time_min}–{node.compression_time_max} Sekunden
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="font-semibold text-white mb-3">Anleitung</h3>
              <ol className="space-y-3 text-slate-300">
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-400 flex-shrink-0">1.</span>
                  <span>Finde den Druckpunkt an {node.body_area.toLowerCase()}</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-400 flex-shrink-0">2.</span>
                  <span>Übe stetigen, sanften Druck aus (kein Schmerz, aber spürbar)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-400 flex-shrink-0">3.</span>
                  <span>Atme tief durch die Nase ein und aus</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-400 flex-shrink-0">4.</span>
                  <span>Halte den Druck für {node.compression_time_max || 90} Sekunden</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-400 flex-shrink-0">5.</span>
                  <span>Nach dem Timer: Teste die ursprüngliche Bewegung erneut</span>
                </li>
              </ol>
            </div>

            {/* Neuro Explanation */}
            <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-purple-300">🧠 Neuro-Logik:</span> Nach {node.compression_time_max || 90} Sekunden stetigen Drucks sagen deine Mechanorezeptoren dem Gehirn: "Diese Spannung ist falsch-positiv. Lass los." Das ist kein Placebo – das ist Biologie.
              </p>
            </div>

            {/* Close Button */}
            <Button
              onClick={onClose}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              Fertig
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}