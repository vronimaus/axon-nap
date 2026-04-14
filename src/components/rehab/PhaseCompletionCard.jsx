import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PhaseCompletionCard({ currentPhase, nextPhase, isLastPhase, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.6 }}
        className="inline-block mb-4"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>
      
      <h3 className="text-xl font-bold text-white mb-2">
        Phase {currentPhase} abgeschlossen! 🎯
      </h3>
      
      {!isLastPhase ? (
        <>
          <p className="text-sm text-zinc-400 mb-4">
            Glückwunsch! Du machst großartige Fortschritte.
          </p>
          <div className="bg-zinc-900/60 rounded-lg p-4 mb-5 border border-white/[0.06]">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Nächste Phase</p>
            <p className="text-sm font-semibold text-white">{nextPhase?.title || `Phase ${currentPhase + 1}`}</p>
            {nextPhase?.nms_shift_explanation && (
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{nextPhase.nms_shift_explanation}</p>
            )}
          </div>
          <Button
            onClick={onNext}
            className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/40 font-bold"
          >
            Zur nächsten Phase
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-400 mb-4">
            Du hast dein Rehabilitations-Ziel erreicht! Dein Körper ist jetzt bereit für die nächste Stufe.
          </p>
          <div className="bg-zinc-900/60 rounded-lg p-4 mb-5 border border-white/[0.06]">
            <p className="text-xs text-zinc-300 font-semibold">Nächster Schritt: Performance-Training</p>
            <p className="text-[10px] text-zinc-500 mt-2">
              Nutze deine neue Mobilität und Kraft um konkrete Performance-Ziele zu erreichen.
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}