import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function PainCheckIn({ chain, onComplete, onContinue, isLoading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-cyan rounded-2xl border border-cyan-500/30 p-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Schmerz-Status Check</h2>
        <p className="text-slate-400 mb-8">
          <span className="font-semibold">{chain.name_de}</span> wurde bearbeitet
        </p>

        <p className="text-lg text-slate-300 mb-8 font-semibold">
          Ist der Schmerz JETZT vollständig weg?
        </p>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete(true)}
            disabled={isLoading}
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border-2 border-green-500/50 text-green-400 font-bold hover:border-green-400 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5" />
            Ja, komplett weg ✅
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onContinue()}
            disabled={isLoading}
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-2 border-amber-500/50 text-amber-400 font-bold hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            Nein, noch besser aber da 🟡
          </motion.button>
        </div>

        <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-500">
            💡 <span className="text-slate-400">Wenn komplett weg: Diagnose wird gespeichert und wir analysieren die Ergebnisse im Chat</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}