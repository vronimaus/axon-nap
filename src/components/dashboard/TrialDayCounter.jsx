import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function TrialDayCounter({ trialStartDate }) {
  const [currentDay, setCurrentDay] = useState(null);

  useEffect(() => {
    if (!trialStartDate) return;

    const start = new Date(trialStartDate);
    const now = new Date();
    const daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    const day = Math.min(daysElapsed, 7);
    
    setCurrentDay(day);
  }, [trialStartDate]);

  if (!currentDay || currentDay > 7) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-cyan-500/30 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/20">
          <Calendar className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Testphase</p>
          <p className="text-lg font-bold text-cyan-400">
            Tag {currentDay} von 7
          </p>
        </div>
      </div>
    </motion.div>
  );
}