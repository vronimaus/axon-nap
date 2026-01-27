import React from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, Minus, ThumbsDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExerciseFeedback({ exerciseName, onFeedback }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-cyan rounded-2xl p-6 border border-cyan-500/30"
    >
      <h4 className="text-lg font-semibold text-cyan-400 mb-3">
        📊 Feedback: {exerciseName}
      </h4>
      <p className="text-sm text-slate-300 mb-6">
        Hat die Übung geholfen? Dein Feedback bestimmt den nächsten Schritt.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={() => onFeedback('better')}
          className="flex-col h-24 bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/50 text-emerald-400"
        >
          <ThumbsUp className="w-6 h-6 mb-2" />
          <span className="text-xs font-semibold">Besser</span>
        </Button>

        <Button
          onClick={() => onFeedback('same')}
          className="flex-col h-24 bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/50 text-amber-400"
        >
          <Minus className="w-6 h-6 mb-2" />
          <span className="text-xs font-semibold">Gleich</span>
        </Button>

        <Button
          onClick={() => onFeedback('worse')}
          className="flex-col h-24 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-400"
        >
          <ThumbsDown className="w-6 h-6 mb-2" />
          <span className="text-xs font-semibold">Schlechter</span>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        <div className="glass rounded-xl p-3 border border-emerald-500/30">
          <div className="flex items-start gap-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-400 mb-1">BESSER</p>
              <p className="text-xs text-slate-400">
                → Pfad beibehalten. Kräftigung folgt, um Fortschritt zu speichern.
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-3 border border-amber-500/30">
          <div className="flex items-start gap-2">
            <Minus className="w-4 h-4 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-400 mb-1">GLEICH (High-Threat)</p>
              <p className="text-xs text-slate-400">
                → Ebenen-Wechsel. Remote Anchoring (z.B. Zungen-Gaumen oder Fuß-Drill).
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-3 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-400 mb-1">SCHLECHTER (Red Flag)</p>
              <p className="text-xs text-slate-400">
                → Sofortiger Stopp. Neural Slacking (Entlastung statt Zug).
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}