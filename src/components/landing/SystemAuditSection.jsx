import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

const BODY_REGIONS = [
  { id: 'nacken', label: 'Nacken', emoji: '🧠', x: '50%', y: '8%',
    diagnosis: 'Nackensteifigkeit ist oft eine Schutzreaktion des Gehirns auf Unsicherheit in der Brustwirbelsäule oder den Schulterblättern — nicht das eigentliche Problem.',
    solution: 'AXON testet die myofasziale Kette entlang der Schulter-Nacken-Schädelbasis und gibt dir einen präzisen Release-Plan mit Neuro-Verankerung.' },
  { id: 'schulter', label: 'Schulter', emoji: '💪', x: '28%', y: '18%',
    diagnosis: 'Schulterprobleme entstehen meistens durch eine blockierte Skapula-Dynamik oder einen eingeschränkten Brustkorb — der Arm ist nur das Symptom.',
    solution: 'AXON identifiziert den spezifischen Druckpunkt (z.B. Pectoralis Minor oder Serratus anterior) und gibt dir ein Hardware+Software Protokoll.' },
  { id: 'ruecken', label: 'Rücken', emoji: '🔧', x: '50%', y: '35%',
    diagnosis: 'LWS-Schmerzen entstehen zu 80% durch eingeschränkte Hüftmobilität oder überaktive Hüftbeuger. Die LWS übernimmt Arbeit, die die Hüfte leisten sollte.',
    solution: 'AXON findet die Root Cause über den Joint-by-Joint Test und erstellt ein Protokoll aus Psoas-Release, Gluteus-Aktivierung und neurologischer Verankerung.' },
  { id: 'hueft', label: 'Hüfte', emoji: '⚙️', x: '50%', y: '52%',
    diagnosis: 'Die Hüfte ist das Fundament des gesamten Systems. Einschränkungen hier verursachen Kaskaden: LWS-Schmerz oben, Knieschmerz unten.',
    solution: 'AXON prüft alle 6 Rotationsebenen der Hüfte und erstellt einen gezielten Mobilisierungsplan für deine spezifische Einschränkung.' },
  { id: 'knie', label: 'Knie', emoji: '🦵', x: '35%', y: '68%',
    diagnosis: 'Knieschmerzen sind fast immer ein Hinweis auf Dysbalancen darüber (Hüfte/Gluteus) oder darunter (Sprunggelenk). Das Knie ist das "Opfer".',
    solution: 'AXON analysiert die gesamte untere Kette und erstellt ein Protokoll, das an der Ursache ansetzt — nicht am Symptom.' },
  { id: 'sprunggelenk', label: 'Sprunggelenk', emoji: '🦶', x: '40%', y: '88%',
    diagnosis: 'Eingeschränkte Dorsalflexion des Sprunggelenks blockiert die gesamte Bewegungskette nach oben — bis zur LWS und Hüfte.',
    solution: 'AXON testet die Dorsalflexion und gibt dir einen gezielten Soleus/Achilles-Release mit Neuro-Integration.' },
];

export default function SystemAuditSection({ onCtaClick }) {
  const [selected, setSelected] = useState(null);

  const region = BODY_REGIONS.find(r => r.id === selected);

  return (
    <section id="audit" className="py-20 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 mb-4">System-Audit</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Dein Schmerzpunkt verrät dir<br />
            <span className="text-slate-400">nicht die Ursache.</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            Tippe auf die Körperstelle, die dir gerade zu schaffen macht — und erfahre, was AXON wirklich dahinter findet.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Body Silhouette */}
          <div className="relative mx-auto flex-shrink-0" style={{ width: 200, height: 380 }}>
            {/* Simple body outline */}
            <svg viewBox="0 0 200 380" className="w-full h-full opacity-20 absolute inset-0">
              {/* Head */}
              <ellipse cx="100" cy="30" rx="22" ry="26" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
              {/* Neck */}
              <rect x="90" y="54" width="20" height="16" rx="4" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
              {/* Torso */}
              <path d="M62 70 L138 70 L148 180 L52 180 Z" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
              {/* Left arm */}
              <path d="M62 75 L30 100 L22 170 L38 172 L46 110 L68 90" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
              {/* Right arm */}
              <path d="M138 75 L170 100 L178 170 L162 172 L154 110 L132 90" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
              {/* Left leg */}
              <path d="M80 180 L70 270 L66 340 L84 340 L90 280 L100 230" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
              {/* Right leg */}
              <path d="M120 180 L130 270 L134 340 L116 340 L110 280 L100 230" fill="none" stroke="#06b6d4" strokeWidth="1.5"/>
            </svg>

            {/* Clickable dots */}
            {BODY_REGIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(selected === r.id ? null : r.id)}
                style={{ left: r.x, top: r.y, transform: 'translate(-50%, -50%)' }}
                className={`absolute z-10 flex items-center justify-center transition-all duration-200 ${
                  selected === r.id
                    ? 'w-10 h-10 bg-cyan-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]'
                    : 'w-7 h-7 bg-slate-800 border-2 border-cyan-500/50 rounded-full hover:border-cyan-400 hover:bg-slate-700'
                }`}
              >
                <span className="text-xs">{r.emoji}</span>
              </button>
            ))}
          </div>

          {/* Info Panel */}
          <div className="flex-1 min-h-[200px]">
            <AnimatePresence mode="wait">
              {!region ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="text-4xl mb-4">👆</div>
                  <p className="text-slate-500 text-sm">Tippe auf eine Körperregion<br />um mehr zu erfahren</p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {BODY_REGIONS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                        className="text-xs text-slate-400 border border-slate-700 rounded-full px-3 py-1 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                      >
                        {r.emoji} {r.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{region.emoji}</span>
                    <h3 className="text-xl font-bold text-white">{region.label}</h3>
                  </div>

                  <div className="bg-slate-900/60 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Was dein System sagt</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{region.diagnosis}</p>
                  </div>

                  <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">Die AXON Lösung</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{region.solution}</p>
                  </div>

                  <button
                    onClick={onCtaClick}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-cyan-50 text-black font-black text-sm px-6 py-4 rounded-2xl transition-all hover:scale-105 uppercase tracking-wide"
                  >
                    Vollständiges Protokoll für {region.label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}