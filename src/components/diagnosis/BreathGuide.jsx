import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BreathGuide({ isActive = true }) {
  const [phase, setPhase] = useState(0); // 0: inhale, 1: hold, 2: exhale, 3: hold
  const [count, setCount] = useState(0);
  
  const phases = ['Einatmen', 'Halten', 'Ausatmen', 'Halten'];
  const duration = 4;
  
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev >= duration) {
          setPhase(p => (p + 1) % 4);
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  const scale = phase === 0 ? 1 + (count / duration) * 0.4 : 
                phase === 2 ? 1.4 - (count / duration) * 0.4 : 1.4;
  
  if (!isActive) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div
        animate={{ scale }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Outer glow */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.6) 0%, transparent 70%)'
          }}
        />
        
        {/* Main circle */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-slate-900/90 flex flex-col items-center justify-center backdrop-blur-sm">
            <p className="text-cyan-400 text-[10px] font-semibold">{phases[phase]}</p>
            <p className="text-white text-lg font-bold">{Math.ceil(duration - count)}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Info tooltip */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute bottom-full right-0 mb-3 bg-slate-900/95 text-slate-300 text-xs px-3 py-2 rounded-lg whitespace-nowrap backdrop-blur-sm border border-cyan-500/30"
      >
        🫁 Atme im Rhythmus mit
      </motion.div>
    </div>
  );
}