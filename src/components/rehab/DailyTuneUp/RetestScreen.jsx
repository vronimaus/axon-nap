import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, ChevronRight } from 'lucide-react';

export default function RetestScreen({ onComplete, screenId = 2 }) {
  const [retestValue, setRetestValue] = useState(null);
  const [fineTuning, setFineTuning] = useState(0);
  const pretestValue = 3;

  const improvement = pretestValue - (retestValue || 0);

  const getImprovementMessage = () => {
    if (improvement > 2) return 'Große Verbesserung';
    if (improvement > 0) return 'Kleine Verbesserung';
    if (improvement === 0) return 'Keine Veränderung';
    return 'Verschlechtert';
  };

  const handleComplete = () => {
    onComplete(screenId, { pretestValue, retestValue, improvement, fineTuning });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="w-full max-w-sm mx-auto px-4 space-y-6 max-h-[80vh] overflow-y-auto"
    >
      {/* Question */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-6 text-center">
        <h3 className="text-lg sm:text-xl font-bold text-white">Wie fühlst du dich jetzt?</h3>
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Vorher */}
        <div className="rounded-2xl border-2 border-red-500/50 bg-red-500/10 p-5 text-center space-y-3">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Vorher</p>
          <p className="text-xs text-red-300 leading-relaxed">So hast du dich gefühlt</p>
          <p className="text-5xl font-black text-red-400">{pretestValue}</p>
        </div>

        {/* Nachher */}
        <div className="rounded-2xl border-2 border-cyan-500/50 bg-cyan-500/10 p-5 text-center space-y-3">
          <div>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Nachher</p>
            <p className="text-xs text-cyan-300 leading-relaxed">Wie beweglich bist du jetzt?</p>
          </div>
          <div>
            {retestValue !== null ? (
              <p className="text-5xl font-black text-cyan-400">{retestValue}</p>
            ) : (
              <div className="space-y-2 mt-2">
                {[1, 2, 3, 4, 5].map(val => (
                  <motion.button
                    key={val}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setRetestValue(val)}
                    className="w-full py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 transition-all text-sm font-semibold"
                  >
                    {val}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Improvement Box */}
      {retestValue !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <p className="text-3xl font-black text-emerald-400">{improvement > 0 ? '+' : ''}{improvement}</p>
          </div>
          <p className="text-sm text-emerald-300 font-semibold">{getImprovementMessage()}</p>
        </motion.div>
      )}

      {/* Fine Tuning Slider */}
      {retestValue !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feinabstimmung</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Relaxed</span>
            <input
              type="range"
              min="-5"
              max="5"
              value={fineTuning}
              onChange={(e) => setFineTuning(parseInt(e.target.value))}
              className="flex-1 h-2 rounded-lg bg-slate-700 appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs text-cyan-400 uppercase tracking-wider font-bold">Locker</span>
          </div>
        </motion.div>
      )}

      {/* Continue Button */}
      {retestValue !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4"
        >
          <Button
            onClick={handleComplete}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
          >
            <span>Weiter</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}