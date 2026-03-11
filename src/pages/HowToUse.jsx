import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, Activity, Target, Brain, Wrench, CheckCircle2, Search, Wind, Layers, ArrowRight, UserCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

const steps = [
  {
    id: 1,
    icon: Zap,
    title: 'Willkommen bei AXON',
    subtitle: 'Neuro-Athletic-Protocol',
    description: 'AXON ist kein klassisches Fitnesstraining. Es kombiniert Neurowissenschaft, Bewegungsforschung und Faszientherapie – und passt sich täglich deinem Körperzustand an.',
    visual: (
      <div className="flex flex-col items-center gap-3 py-4">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png"
          alt="AXON"
          className="h-10 object-contain"
        />
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase font-mono">Hack Your Software. Free Your Hardware.</p>
        <div className="mt-2 grid grid-cols-3 gap-2 w-full">
          {[
            { color: 'border-blue-500/40 text-blue-400', label: 'GOALS', sub: 'Skills freischalten' },
            { color: 'border-emerald-500/40 text-emerald-400', label: 'REHAB', sub: 'Schmerz lösen' },
            { color: 'border-purple-500/40 text-purple-400', label: 'FLOW', sub: 'Täglich pflegen' },
          ].map(({ color, label, sub }) => (
            <div key={label} className={`bg-slate-900 rounded-xl border ${color} px-2 py-2 text-center`}>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${color.split(' ')[1]}`}>{label}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        {/* Medical Disclaimer */}
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-start gap-2">
          <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5 font-bold">!</span>
          <p className="text-[9px] text-amber-200/70 leading-relaxed">
            <strong className="text-amber-400">Medizinischer Hinweis:</strong> AXON ersetzt keine ärztliche Diagnose oder Behandlung. Bei akuten oder starken Beschwerden wende dich an einen Arzt. Nutze die App eigenverantwortlich.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 2,
    icon: UserCircle2,
    title: 'Wie sollen wir dich nennen?',
    subtitle: 'Personalisierung · 10 Sekunden',
    description: 'Dein Name wird verwendet, um dich persönlich anzusprechen – in Empfehlungen, Coaching-Hinweisen und Fortschrittsmeldungen.',
    isNameInput: true,
    visual: null
  },
  {
    id: 3,
    icon: Wrench,
    title: 'Bio-Sync: Tägliche Kalibrierung',
    subtitle: 'Schritt 1 · 30 Sekunden',
    description: 'Jeden Tag startest du mit dem Bio-Sync Check. Du bewertest drei Parameter – das ist die Basis für alle Empfehlungen, die danach kommen. Verhindert Überlastung und verhindert, dass du an schlechten Tagen zu viel pushst.',
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
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${value * 10}%` }} />
              </div>
              <span className="text-sm font-bold font-mono text-white">{value}<span className="text-[9px] text-slate-600">/10</span></span>
            </div>
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
    description: 'AXON berechnet aus deinen drei Werten einen Tages-Status und passt alle Empfehlungen automatisch an – kein Raten, kein Überschätzen.',
    visual: (
      <div className="space-y-2 py-2">
        {[
          { border: 'border-emerald-500/30', dot: 'bg-emerald-400', label: 'GRÜN', title: 'Volles Training', desc: 'Alle Zonen aktiv – maximale Performance möglich.' },
          { border: 'border-amber-500/30', dot: 'bg-amber-400', label: 'GELB', title: 'Modifiziertes Training', desc: 'Technik & Mobilität priorisieren, Intensität reduziert.' },
          { border: 'border-red-500/30', dot: 'bg-red-400', label: 'ROT', title: 'Aktive Regeneration', desc: 'Nur FLOW & MFR – heute erholen, nicht kämpfen.' },
        ].map(({ border, dot, label, title, desc }) => (
          <div key={label} className={`flex items-start gap-3 bg-slate-900/60 rounded-xl border ${border} px-3 py-2`}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${dot}`} />
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-200 uppercase">{label} – {title}</p>
              <p className="text-[9px] text-slate-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 4,
    icon: Zap,
    title: 'GOALS: Skills freischalten',
    subtitle: 'Performance Training · Sessions statt Wochen',
    description: 'Gib dein Ziel ein – "10 Klimmzüge", "Handstand", "Middle Split" – und AXON erstellt einen personalisierten Trainingsplan. Du arbeitest in Phasen und kannst jederzeit zwischen Basic- und Advanced-Variante wählen.',
    visual: (
      <div className="space-y-2 py-2">
        <div className="bg-slate-900/60 rounded-xl border border-blue-500/30 px-3 py-2">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Beispiel: 10 Klimmzüge</p>
          <div className="space-y-1.5">
            {[
              { phase: 'Phase 1', title: 'Grundkraft aufbauen', done: true },
              { phase: 'Phase 2', title: 'Negative Klimmzüge', done: false, active: true },
              { phase: 'Phase 3', title: 'Voller Klimmzug', done: false },
            ].map(({ phase, title, done, active }) => (
              <div key={phase} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${active ? 'bg-blue-500/10 border border-blue-500/30' : done ? 'bg-slate-800/30' : 'bg-slate-900/30'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                  {done ? '✓' : active ? '▶' : '○'}
                </div>
                <div className="flex-1">
                  <span className="text-[9px] text-slate-500">{phase} · </span>
                  <span className={`text-[10px] font-medium ${active ? 'text-white' : done ? 'text-slate-400' : 'text-slate-600'}`}>{title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-900/60 rounded-lg border border-slate-700 px-2 py-1.5 text-center">
            <p className="text-[9px] text-slate-500">Basic</p>
            <p className="text-[10px] text-slate-300 font-medium">Leichtere Variante</p>
          </div>
          <div className="flex-1 bg-blue-500/10 rounded-lg border border-blue-500/30 px-2 py-1.5 text-center">
            <p className="text-[9px] text-blue-400">Advanced</p>
            <p className="text-[10px] text-white font-medium">Schwieriger</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    icon: Search,
    title: 'REHAB: Detective-Diagnose',
    subtitle: 'Root Cause finden · Ouch!-Button · Live-Anpassung',
    description: 'Hast du Schmerzen? AXON startet eine Diagnose: Body-Map → Hardware-Tests → Neuro-Drills → Reha-Plan. Der "Ouch!"-Button pausiert jederzeit und passt den Plan in Echtzeit an.',
    visual: (
      <div className="space-y-2 py-2">
        <div className="space-y-1.5">
          {[
            { step: '1', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Body-Map', desc: 'Punkt setzen oder Linie entlang des Schmerzes zeichnen' },
            { step: '2', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Hardware-Test', desc: 'AXON testet Mobilität & Bewegungsfreiheit der Kette' },
            { step: '3', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Neuro-Drill', desc: 'Nervensystem-Check → Root Cause Analyse' },
            { step: '4', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Reha-Plan', desc: 'Phasierter Plan: MFR → Kraft → Neuro-Integration' },
          ].map(({ step, color, label, desc }) => (
            <div key={step} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${color}`}>
              <span className="text-xs font-bold font-mono flex-shrink-0">{step}.</span>
              <div>
                <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">{label}</p>
                <p className="text-[9px] text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-red-500/10 rounded-xl border border-red-500/30 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[9px] font-bold">!</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-400">Ouch!-Button</p>
            <p className="text-[9px] text-slate-500">Schmerz während Übung → App pausiert & passt Plan sofort an</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    icon: Activity,
    title: 'FLOW: Tägliche Systempflege',
    subtitle: '5–30 Min · Neuro · MFR · Mobility · Atem',
    description: 'FLOW ist dein tägliches Pflege-Protokoll. Kurze Routinen für das Nervensystem, die Faszien, Mobilität und Atemarbeit – empfohlen basierend auf deinem Tages-Status.',
    visual: (
      <div className="space-y-2 py-2">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Zap, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', label: 'Neuro-Drills', desc: 'Nervensystem aktivieren & kalibrieren' },
            { icon: Layers, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', label: 'Faszien (MFR)', desc: '12 Nodes · Timer · Stecco-Technik' },
            { icon: Activity, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', label: 'Mobility', desc: 'Gelenke & Beweglichkeit erhalten' },
            { icon: Wind, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', label: 'Atemarbeit', desc: 'Vagus-Reset & Regeneration' },
          ].map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className={`rounded-xl border px-2 py-2 ${color}`}>
              <Icon className="w-4 h-4 mb-1" />
              <p className="text-[10px] font-bold text-slate-200">{label}</p>
              <p className="text-[9px] text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-700 px-3 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <p className="text-[10px] text-slate-400">AXON empfiehlt täglich passende Routinen basierend auf deinem Status</p>
        </div>
      </div>
    )
  },
  {
    id: 7,
    icon: Target,
    title: 'Das Zusammenspiel',
    subtitle: 'Ein integriertes System',
    description: 'GOALS, REHAB und FLOW greifen ineinander. Wer Schmerzen hat, startet mit REHAB. Wer fit ist, arbeitet an GOALS. FLOW ist die tägliche Pflege, die alles am Laufen hält.',
    visual: (
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-red-400">Schmerz?</p>
            <p className="text-[9px] text-slate-500">Symptom da</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
          <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-emerald-400">REHAB</p>
            <p className="text-[9px] text-slate-500">Root Cause lösen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-emerald-400">Erholt</p>
            <p className="text-[9px] text-slate-500">Problem gelöst</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
          <div className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-blue-400">GOALS</p>
            <p className="text-[9px] text-slate-500">Skills erarbeiten</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-blue-400">Täglich</p>
            <p className="text-[9px] text-slate-500">Neben allem</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
          <div className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-purple-400">FLOW</p>
            <p className="text-[9px] text-slate-500">System pflegen</p>
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-xl border border-slate-700 px-3 py-2 text-center">
          <p className="text-[10px] text-slate-400 italic">Rehab-Ergebnisse beeinflussen Performance. Performance-Pläne empfehlen FLOW. Alles ist verbunden.</p>
        </div>
      </div>
    )
  },
  {
    id: 8,
    icon: UserCircle2,
    title: 'Wähle deinen Coach',
    subtitle: 'Dein persönlicher Trainingsbegleiter',
    description: 'Wähle den Avatar, mit dem du am liebsten trainierst. Du kannst ihn jederzeit im Profil ändern.',
    isCoachSelection: true,
    visual: null
  },
  {
    id: 9,
    icon: CheckCircle2,
    title: 'Du bist bereit.',
    subtitle: 'Starte deinen ersten Bio-Sync',
    description: 'AXON wird mit der Zeit immer genauer. Je öfter du den Bio-Sync machst, desto besser versteht das System dich. Konsistenz schlägt Intensität – täglich 5 Min ist besser als einmal 2 Stunden.',
    visual: (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="w-full space-y-2">
          {[
            { icon: '🎯', text: 'Täglicher Bio-Sync → passende Empfehlungen' },
            { icon: '⚡', text: 'GOALS → dein Skill-Progressionsplan' },
            { icon: '🔧', text: 'REHAB → bei Schmerz sofort starten' },
            { icon: '🌊', text: 'FLOW → 5-30 Min täglich Pflege' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-slate-900/60 rounded-xl border border-slate-800 px-3 py-2">
              <span className="text-base flex-shrink-0">{icon}</span>
              <p className="text-[10px] text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }
];

const coaches = [
  {
    value: 'male',
    label: 'Max',
    subtitle: 'Direkt & fokussiert',
    avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/3031e6f06_TechnicalSystemsArchitectAXON-nap.jpg',
    color: 'border-blue-500/50 bg-blue-500/10 text-blue-400'
  },
  {
    value: 'female',
    label: 'Lena',
    subtitle: 'Präzise & motivierend',
    avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/a7949b2c4_EmpatheticGuideAXON-nap.jpg',
    color: 'border-pink-500/50 bg-pink-500/10 text-pink-400'
  },
  {
    value: 'neuro',
    label: 'AXON AI',
    subtitle: 'Analytisch & präzise',
    avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/2df3d8dc0_NeuralGuideAXON-nap.jpg',
    color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
  },
];

export default function HowToUse() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCoach, setSelectedCoach] = useState('male');
  const [userName, setUserName] = useState('');
  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const saveAndFinish = async () => {
    localStorage.setItem('axon_howto_seen', 'true');
    try {
      const user = await base44.auth.me();
      if (user) {
        if (userName.trim()) {
          await base44.auth.updateMe({ full_name: userName.trim() });
        }
        const profiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          await base44.entities.UserNeuroProfile.update(profiles[0].id, { preferred_coach: selectedCoach });
        } else {
          await base44.entities.UserNeuroProfile.create({ user_email: user.email, preferred_coach: selectedCoach });
        }
      }
    } catch (e) {
      // Speichern im localStorage als Fallback
      localStorage.setItem('axon_preferred_coach', selectedCoach);
    }
    window.location.href = createPageUrl('Dashboard');
  };

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

            {step.isNameInput ? (
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-3 bg-slate-800/60 rounded-xl border border-slate-700 px-4 py-3">
                  <span className="text-2xl">👋</span>
                  <p className="text-sm text-slate-300">Hey! Wie heißt du?</p>
                </div>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setCurrentStep(s => s + 1)}
                  placeholder="Dein Vorname..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 text-base"
                />
                {userName.trim() && (
                  <div className="flex items-center gap-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 px-4 py-3">
                    <span className="text-2xl">🧠</span>
                    <p className="text-sm text-cyan-300">Willkommen, <strong>{userName}</strong>! Bereit für dein neuro-athletisches System?</p>
                  </div>
                )}
              </div>
            ) : step.isCoachSelection ? (
              <div className="space-y-3 py-2">
                {coaches.map((coach) => (
                  <button
                    key={coach.value}
                    onClick={() => setSelectedCoach(coach.value)}
                    className={`w-full flex items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all ${
                      selectedCoach === coach.value
                        ? coach.color + ' shadow-lg scale-[1.02]'
                        : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <img src={coach.avatar} alt={coach.label} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-sm text-white">{coach.label}</p>
                      <p className="text-[10px] text-slate-400">{coach.subtitle}</p>
                    </div>
                    {selectedCoach === coach.value && (
                      <CheckCircle2 className="w-5 h-5 ml-auto text-current" />
                    )}
                  </button>
                ))}
              </div>
            ) : step.visual}

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
                saveAndFinish();
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
            onClick={() => saveAndFinish()}
            className="w-full text-center text-[10px] text-slate-600 hover:text-slate-400 transition-colors mt-4 py-2"
          >
            Überspringen
          </button>
        )}
      </div>
    </div>
  );
}