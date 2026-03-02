import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, Activity, Target, Brain, Wrench, CheckCircle2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

const steps = [
  {
    id: 1,
    icon: Zap,
    title: 'Willkommen bei AXON',
    subtitle: 'Neuro-Athletic-Protocol',
    description: 'AXON ist kein klassisches Fitnesstraining. Es kombiniert Neurowissenschaft, Bewegungsforschung und Faszientherapie – und passt sich täglich deinem Körperzustand an. Der erste Schritt: dein System kalibrieren.',
    visual: (
      <div className="flex flex-col items-center gap-3 py-4">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png"
          alt="AXON"
          className="h-10 object-contain"
        />
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase font-mono">Hack Your Software. Free Your Hardware.</p>
        <div className="mt-2 bg-slate-900 rounded-xl border border-slate-800 px-5 py-3 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            Der Körper hat eine Sprache.<br/>AXON übersetzt sie.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 2,
    icon: Wrench,
    title: 'Bio-Sync: Tägliche Kalibrierung',
    subtitle: 'Schritt 1 · 30 Sekunden',
    description: 'Jeden Tag startest du mit dem Bio-Sync Check. Du bewertest drei Parameter deines Systems – das ist die Basis für alles, was danach kommt.',
    visual: (
      <div className="space-y-2 py-2">
        {[
          { icon: Wrench, label: 'HARDWARE', desc: 'Wie fühlt sich dein Körper an?', low: 'Steif', high: 'Geschmeidig', value: 7 },
          { icon: Brain, label: 'SOFTWARE', desc: 'Wie ist dein Fokus & Kognition?', low: 'Tunnelblick', high: 'Hellwach', value: 8 },
          { icon: Zap, label: 'BATTERIE', desc: 'Wie ist dein Energielevel?', low: 'Leer', high: 'Volle Kraft', value: 6 },
        ].map(({ icon: Icon, label, desc, value }) => (
          <div key={label} className="flex items-center gap-3 bg-slate-900/60 rounded-xl border border-slate-800 px-3 py-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-widest text-slate-200 uppercase">{label}</p>
              <p className="text-[9px] text-slate-500 truncate">{desc}</p>
            </div>
            <span className="text-sm font-bold font-mono text-white flex-shrink-0">{value}<span className="text-xs text-slate-600">/10</span></span>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 3,
    icon: Activity,
    title: 'Dein Tages-Status',
    subtitle: 'Grün · Gelb · Rot',
    description: 'AXON berechnet aus deinen drei Werten einen Tages-Status. Das System empfiehlt dir dann automatisch, was heute Sinn macht – kein Raten, kein Überschätzen.',
    visual: (
      <div className="space-y-2 py-2">
        {[
          { border: 'border-emerald-500/30', dot: 'bg-emerald-400', label: 'GRÜN', title: 'Volles Training', desc: 'Alle Zonen aktiv – push it.' },
          { border: 'border-cyan-500/30', dot: 'bg-cyan-400', label: 'GELB', title: 'Modifiziertes Training', desc: 'Technik & Mobilität priorisieren.' },
          { border: 'border-red-500/30', dot: 'bg-red-400', label: 'ROT', title: 'Regeneration', desc: 'Heute erholen, nicht kämpfen.' },
        ].map(({ border, dot, label, title, desc }) => (
          <div key={label} className={`flex items-center gap-3 bg-slate-900/60 rounded-xl border ${border} px-3 py-2`}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-200 uppercase">{label} – {title}</p>
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
    title: 'Drei Wege zu deinem Ziel',
    subtitle: 'GOALS · REHAB · FLOW',
    description: 'Im Dashboard wählst du deinen Weg. AXON deckt den kompletten Lebenszyklus ab: Probleme lösen → Ziele erreichen → System täglich pflegen.',
    visual: (
      <div className="space-y-2 py-2">
        {[
          { color: 'text-blue-400', border: 'border-blue-500/30', icon: Zap, label: 'GOALS', desc: 'Skills freischalten: Klimmzüge, Handstand, Front Lever & mehr' },
          { color: 'text-emerald-400', border: 'border-emerald-500/30', icon: Target, label: 'REHAB', desc: 'Schmerz analysieren & mit einem phasierten Plan lösen' },
          { color: 'text-purple-400', border: 'border-purple-500/30', icon: Activity, label: 'FLOW', desc: 'Täglich: Faszien, Neuro-Drills, Mobility & Atemarbeit' },
        ].map(({ color, border, icon: Icon, label, desc }) => (
          <div key={label} className={`flex items-start gap-3 bg-slate-900/60 rounded-xl border ${border} px-3 py-2`}>
            <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${color}`}>{label}</p>
              <p className="text-[9px] text-slate-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 5,
    icon: Search,
    title: 'REHAB: Die Detective-Diagnose',
    subtitle: 'Root Cause finden – nicht nur Symptome behandeln',
    description: 'Hast du Schmerzen, startet AXON eine Diagnose-Session. Hardware-Tests prüfen die Mobilität, Neuro-Drills testen dein Nervensystem. So findet AXON die echte Ursache – nicht nur die Stelle, die wehtut.',
    visual: (
      <div className="space-y-2 py-2">
        {[
          { step: '1', color: 'text-emerald-400', label: 'Schmerz lokalisieren', desc: 'Body-Map: Punkt setzen oder Linie zeichnen' },
          { step: '2', color: 'text-emerald-400', label: 'Hardware-Test', desc: 'AXON testet Mobilität & Bewegungsfreiheit' },
          { step: '3', color: 'text-emerald-400', label: 'Neuro-Drill', desc: 'Nervensystem-Check zur Root-Cause-Analyse' },
          { step: '4', color: 'text-emerald-400', label: 'Rehab-Plan', desc: 'Phasierter Plan mit MFR, Kraft & Neuro' },
        ].map(({ step, color, label, desc }) => (
          <div key={step} className="flex items-center gap-3 bg-slate-900/60 rounded-xl border border-slate-800 px-3 py-2">
            <span className={`text-xs font-bold font-mono ${color} flex-shrink-0`}>{step}.</span>
            <div>
              <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">{label}</p>
              <p className="text-[9px] text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 6,
    icon: CheckCircle2,
    title: 'Du bist bereit.',
    subtitle: 'Starte deinen ersten Bio-Sync',
    description: 'AXON wird mit der Zeit immer genauer. Je öfter du den Bio-Sync machst, desto besser versteht das System dich. Öffne die App täglich – auch wenn es nur 5 Minuten sind.',
    visual: (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 w-full text-center space-y-1">
          <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">AXON Prinzip</p>
          <p className="text-xs text-slate-300">Konsistenz schlägt Intensität.</p>
          <p className="text-[10px] text-slate-500">Täglich 5 Min > einmal 2 Stunden</p>
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Onboarding</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">{currentStep + 1} / {steps.length}</span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-5">
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
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{step.title}</h2>
                <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase mt-0.5">{step.subtitle}</p>
              </div>
            </div>

            {step.visual}

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
            {isLast ? "▶  Los geht's" : <>Weiter <ChevronRight className="w-4 h-4 ml-1 inline" /></>}
          </Button>
        </div>

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