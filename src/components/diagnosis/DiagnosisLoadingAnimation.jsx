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
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
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
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center neuro-glow">
            <Brain className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Orbiting Icons */}
        {[0, 120, 240].map((rotation, idx) => (
          <motion.div
            key={idx}
            animate={{
              rotate: rotation + 360
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: idx * 0.5
              }}
              className="absolute top-0 left-1/2 -translate-x-1/2"
            >
              {idx === 0 && <Activity className="w-6 h-6 text-cyan-400" />}
              {idx === 1 && <Sparkles className="w-6 h-6 text-purple-400" />}
              {idx === 2 && <Zap className="w-6 h-6 text-amber-400" />}
            </motion.div>
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

        {/* Process Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-2"
        >
          {[
            { icon: Brain, text: "Analysiere Symptome", delay: 0 },
            { icon: Activity, text: "Identifiziere Ketten", delay: 0.3 },
            { icon: Sparkles, text: "Erstelle Protokoll", delay: 0.6 }
          ].map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              className="flex items-center gap-3 text-slate-400 text-sm"
            >
              <step.icon className="w-4 h-4 text-cyan-400" />
              <span>{step.text}</span>
              <motion.div
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, delay: step.delay }}
                className="flex-1 h-1 bg-gradient-to-r from-cyan-500/30 to-transparent rounded-full overflow-hidden"
              >
                <motion.div
                  animate={{ x: ["0%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-full w-1/3 bg-cyan-400 rounded-full"
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Did You Know? Facts */}
        <div className="mt-8 px-6 py-4 rounded-xl bg-slate-800/30 border border-cyan-500/20 max-w-md mx-auto">
          <p className="text-xs font-semibold text-cyan-400 mb-2">💡 Wusstest du?</p>
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