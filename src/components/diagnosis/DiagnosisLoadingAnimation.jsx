import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, Sparkles, Zap } from 'lucide-react';

const facts = [
  "Faszien speichern 10x mehr sensorische Informationen als Muskeln",
  "Dein Nervensystem entscheidet, wie viel Bewegungsfreiheit es dir gibt",
  "Schmerz entsteht im Gehirn, nicht im Gewebe",
  "Myofasziale Ketten verbinden deinen ganzen Körper wie ein 3D-Netz",
  "Neuro-Drills können Bewegungsfreiheit in Sekunden freischalten",
  "80% aller Rückenschmerzen haben keine strukturelle Ursache"
];

export default function DiagnosisLoadingAnimation({ message = "Analysiere dein Problem..." }) {
   const [currentFact, setCurrentFact] = useState(0);

   useEffect(() => {
     const interval = setInterval(() => {
       setCurrentFact((prev) => (prev + 1) % facts.length);
     }, 4000);
     return () => clearInterval(interval);
   }, []);

   // Disable GPU acceleration for heavy animations
   const animationConfig = {
     duration: 2,
     repeat: Infinity,
     ease: "easeInOut",
     // Reduce repaints
     shouldResetOrigin: false
   };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center py-12 px-4">
      {/* Animated Icons */}
      <div className="relative w-32 h-32 mb-8">
        {/* Central Brain Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Brain className="w-10 h-10 text-cyan-400" />
          </div>
        </motion.div>

        {/* Orbiting Icons - Simplified */}
        {[0].map((_, idx) => (
          <motion.div
            key={idx}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animated Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h3 className="text-xl font-bold text-white mb-2">{message}</h3>
        
        {/* Animated Dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 rounded-full bg-cyan-400"
            />
          ))}
        </div>

        {/* Process Steps - Simplified */}
         <div className="mt-6 space-y-2">
           {[
             { icon: Brain, text: "Analysiere Symptome" },
             { icon: Activity, text: "Identifiziere Ketten" },
             { icon: Sparkles, text: "Erstelle Protokoll" }
           ].map((step, idx) => (
             <div
               key={idx}
               className="flex items-center gap-3 text-slate-400 text-sm"
             >
               <step.icon className="w-4 h-4 text-cyan-400" />
               <span>{step.text}</span>
             </div>
           ))}
         </div>

        {/* Did You Know? Facts */}
        <div className="mt-8 px-6 py-4 rounded-xl glass border border-cyan-500/40 max-w-md mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <p className="text-[10px] font-bold text-cyan-400 mb-2 uppercase tracking-widest font-mono">Wusstest du?</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentFact}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-sm text-slate-300 leading-relaxed"
            >
              {facts[currentFact]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}