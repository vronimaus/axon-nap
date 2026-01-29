import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export default function TrialCountdown({ trialStartDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const updateCountdown = () => {
      if (!trialStartDate) return;

      const start = new Date(trialStartDate);
      const now = new Date();
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const diffMs = end - now;
      
      if (diffMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, expired: true });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, expired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [trialStartDate]);

  if (!timeLeft || timeLeft.expired) return null;

  const isLastDay = timeLeft.days === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-lg p-4 flex items-center gap-3
        ${isLastDay 
          ? 'bg-red-500/10 border border-red-500/30' 
          : 'bg-cyan-500/10 border border-cyan-500/30'
        }
      `}
    >
      <Clock className={`w-5 h-5 flex-shrink-0 ${isLastDay ? 'text-red-400' : 'text-cyan-400'}`} />
      <div>
        <p className={`text-sm font-semibold ${isLastDay ? 'text-red-400' : 'text-cyan-400'}`}>
          Test läuft noch {timeLeft.days}d {timeLeft.hours}h
        </p>
        <p className="text-xs text-slate-400">
          Danach: einmalig 59€ oder Zugriff endet
        </p>
      </div>
    </motion.div>
  );
}