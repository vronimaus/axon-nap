import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Wrench, Brain, Zap, Activity, Target, Waves, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

const steps = [
  {
    id: 1,
    icon: Zap,
    color: 'cyan',
    title: 'Willkommen bei AXON',
    subtitle: 'Dein Neuro-Athletic-Protocol',
    description: 'AXON kombiniert Neurowissenschaft, Faszientherapie und Bewegungsforschung in einem täglichen Protokoll. Keine Fitness-App – ein intelligentes Körpersystem.',
    visual: (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png"
            alt="AXON"
            className="h-8 object-contain"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {['Faszien', 'Neuro', 'Kraft'].map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-800 border border-slate-700 text-cyan-400">
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 2,
    icon: Wrench,
    color: 'cyan',
    title: 'Schritt 1: Bio-Sync',
    subtitle: 'Täglich · 30 Sekunden',
    description: 'Jeden Tag startest du mit dem Bio-Sync Check. Du bewertest dein Hardware (Körpergefühl), Software (Fokus) und deine Batterie (Energie) auf einer Skala von 1–10.',
    visual: (
      <div className="space-y-3 py-2">
        {[
          { icon: Wrench, label: 'HARDWARE', desc: 'Körpergefühl', value: 7 },
          { icon: Brain, label: 'SOFTWARE', desc: 'Fokus & Kognition', value: 8 },
          { icon: Zap, label: 'BATTERIE', desc: 'Energielevel', value: 6 },
        ].map(({ icon: Icon, label, desc, value }) => (
          <div key={label} className="flex items-center gap-3 bg-slate-900/60 rounded-xl border border-slate-800 px-3 py-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-widest text-slate-200 uppercase">{label}</p>
              <p className="text-[9px] text-slate-500">{desc}</p>
            </div>
            <span className="text-sm font-bold font-mono text-white">{value}<span className="text-xs text-slate-600">/10</span></span>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 3,
    icon: Activity,
    color: 'cyan',
    title: 'Schritt 2: System-Status',
    subtitle: 'Grün · Gelb · Rot',
    description: 'AXON berechnet daraus deinen Status. Grün = Vollgas. Gelb = modifiziertes Training. Rot = Regeneration & MFR. Das System passt dein Training automatisch an.',
    visual: (
      <div className="space-y-2 py-2">
        {[
          { color: 'bg-emerald-500', border: 'border-emerald-500/30', label: 'GRÜN', desc: 'Volles Training – push it', dot: 'bg-emerald-400' },
          { color: 'bg-cyan-500', border: 'border-cyan-500/30', label: 'GELB', desc: 'Modifiziert – achtsam trainieren', dot: 'bg-cyan-400' },
          { color: 'bg-red-500', border: 'border-red-500/30', label: 'ROT', desc: 'Regeneration – MFR & Atem', dot: 'bg-red-400' },
        ].map(({ border, label, desc, dot }) => (
          <div key={label} className={`flex items-center gap-3 bg-slate-900/60 rounded-xl border ${border} px-3 py-2`}>
            <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-200 uppercase">{label}</p>
              <p className="text-[9px] text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 4,
    icon: Target,
    color: 'cyan',
    title: 'Schritt 3: Training oder Rehab',
    subtitle: 'Dein Weg, dein Tempo',
    description: 'Im Dashboard wählst du deinen Modus. Performance für Kraft & Ziele. Rehab für Schmerzfreiheit. Flow für geführte Routinen. AXON führt dich durch den richtigen Weg.',
    visual: (
      <div className="space-y-2 py-2">
        {[
          { icon: Target, label: 'PERFORMANCE', desc: 'Kraft & Ziele erreichen', color: 'text-cyan-400' },
          { icon: Activity, label: 'REHAB', desc: 'Schmerz verstehen & lösen', color: 'text-purple-400' },
          { icon: Waves, label: 'FLOW', desc: 'Geführte Routinen & MFR', color: 'text-emerald-400' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="flex items-center gap-3 bg-slate-900/60 rounded-xl border border-slate-800 px-3 py-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-200 uppercase">{label}</p>
              <p className="text-[9px] text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 5,
    icon: Waves,
    color: 'cyan',
    title: 'Schritt 4: MFR & Faszienarbeit',
    subtitle: 'Die Basis von allem',
    description: 'MFR (Myofasziale Release) ist das Herzstück von AXON. Druckpunkte lösen Verspannungen auf neuronaler Ebene. Nutze die Body-Map um gezielt Problemzonen zu bearbeiten.',
    visual: (
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="grid grid-cols-3 gap-2">
          {['N1', 'N4', 'N7', 'N10', 'N11', 'N12'].map((node) => (
            <div key={node} className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
              <span className="text-[9px] font-bold text-slate-400 font-mono">{node}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-1">12 MFR-Nodes · Body-Map gesteuert</p>
      </div>
    )
  },
  {
    id: 6,
    icon: CheckCircle2,
    color: 'emerald',
    title: 'Du bist bereit!',
    subtitle: 'Starte dein erstes Bio-Sync',
    description: 'Öffne AXON täglich für deinen Bio-Sync Check. Das System lernt dich kennen und wird mit der Zeit immer genauer. Dein Körper hat eine Sprache – AXON übersetzt sie.',
    visual: (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-emerald-400 tracking-widest uppercase">System bereit</p>
          <p className="text-[10px] text-slate-500">Konsistenz schlägt Intensität</p>
        </div>
      </div>
    )
  }
];

export default function HowToUse() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Onboarding</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">{currentStep + 1} / {steps.length}</span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-cyan-500' : 'bg-slate-800'}`}
            />
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5"
          >
            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{step.title}</h2>
                <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">{step.subtitle}</p>
              </div>
            </div>

            {/* Visual */}
            {step.visual}

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed mt-3 border-t border-slate-800 pt-3">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3">
          {!isFirst && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(s => s - 1)}
              className="flex-1 h-11 bg-transparent border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Zurück
            </Button>
          )}
          <Button
            onClick={() => {
              if (isLast) {
                window.location.href = createPageUrl('Dashboard');
              } else {
                setCurrentStep(s => s + 1);
              }
            }}
            className={`flex-1 h-11 font-bold tracking-widest text-xs uppercase transition-all ${
              isLast
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
            }`}
          >
            {isLast ? '▶  Los geht\'s' : 'Weiter'} {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="w-full text-center text-[10px] text-slate-600 hover:text-slate-400 transition-colors mt-4 py-2"
          >
            Überspringen
          </button>
        )}
      </div>
    </div>
  );
}