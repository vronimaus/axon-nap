import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Zap, MapPin, Shield, Activity, ArrowRight } from 'lucide-react';

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: Zap,
      title: '⚡ Willkommen bei AXON',
      description: 'Wir trainieren nicht nur deine Muskeln – wir hacken deine Software, um deine Hardware zu befreien.',
      color: 'from-cyan-500 to-purple-600'
    },
    {
      icon: Activity,
      title: '1. Wähle dein Schicksal',
      description: '🟢 REHAB: Etwas zwickt? Wir finden den "Neural Slack", um den Schmerz zu löschen.\n\n🔵 PERFORMANCE: Du bist fit? Wir suchen die Bremsen, um deine 12 Meilensteine freizuschalten.',
      color: 'from-emerald-500 to-cyan-500'
    },
    {
      icon: MapPin,
      title: '2. Detective Mode',
      description: 'Öffne die Body-Map. Markiere mit einem Fingerstreich genau den Bereich, der dich heute limitiert.\n\nTipp: Sei präzise! Ein Strich entlang des Nackens sagt AXON mehr als ein dicker Punkt.',
      color: 'from-purple-500 to-blue-500'
    },
    {
      icon: Shield,
      title: '3. Gatekeeper-Check',
      description: 'Bevor wir Gewichte bewegen, prüfen wir die Erlaubnis deines Gehirns. Bestehe den Level 1 (Mobilität) oder Level 2 (Stabilität) Test.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: '4. Flash-Drill & Training',
      description: 'AXON schlägt dir einen 30-sekündigen Neuro-Hack vor (Augen, Zunge oder Atmung). Mach den Drill, spüre den Unterschied und starte dann erst in dein Training.',
      color: 'from-emerald-500 to-blue-500'
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg"
      >
        <div className="glass rounded-3xl border border-cyan-500/30 p-8 relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentStep.color} opacity-5`} />

          {/* Content */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center mx-auto neuro-glow`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-cyan-400">
                  {currentStep.title}
                </h2>

                {/* Description */}
                <div className="text-slate-300 text-center whitespace-pre-line leading-relaxed">
                  {currentStep.description}
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 pt-4">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === step
                          ? 'bg-cyan-400 w-8'
                          : idx < step
                          ? 'bg-cyan-600'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  {step > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="flex-1"
                    >
                      Zurück
                    </Button>
                  )}
                  {step < steps.length - 1 ? (
                    <Button
                      onClick={() => setStep(step + 1)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    >
                      Weiter
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={onClose}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    >
                      Los geht's!
                      <Zap className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}