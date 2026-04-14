import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lightbulb } from 'lucide-react';

export default function ExpertNotesSection({ phase }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!phase.nms_shift_explanation && !phase.synergy_highlight) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-5"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">Warum diese Phase?</h4>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-3 border-t border-white/[0.04] pt-4"
          >
            {phase.nms_shift_explanation && (
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Neurologischer Shift</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{phase.nms_shift_explanation}</p>
              </div>
            )}

            {phase.synergy_highlight && (
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Synergische Wirkung</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{phase.synergy_highlight}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}