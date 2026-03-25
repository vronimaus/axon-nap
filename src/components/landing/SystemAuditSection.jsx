import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const BODY_REGIONS = [
  { id: 'nacken', label: 'Nacken', x: '50%', y: '8%',
    diagnosis: 'Nackensteifigkeit ist oft eine Schutzreaktion des Gehirns auf Unsicherheit in der BWS — nicht das eigentliche Problem.',
    solution: 'AXON testet die myofasziale Kette entlang Schulter-Nacken-Schädelbasis und gibt dir einen präzisen Release-Plan.' },
  { id: 'schulter', label: 'Schulter', x: '26%', y: '19%',
    diagnosis: 'Schulterprobleme entstehen meist durch blockierte Skapula-Dynamik — der Arm ist nur das Symptom.',
    solution: 'AXON identifiziert den spezifischen Druckpunkt (z.B. Pectoralis Minor) und gibt dir ein Hardware+Software Protokoll.' },
  { id: 'ruecken', label: 'Rücken', x: '50%', y: '36%',
    diagnosis: 'LWS-Schmerzen entstehen zu 80% durch eingeschränkte Hüftmobilität. Die LWS übernimmt Arbeit, die die Hüfte leisten sollte.',
    solution: 'AXON findet die Root Cause und erstellt ein Protokoll aus Psoas-Release, Gluteus-Aktivierung und neurologischer Verankerung.' },
  { id: 'hueft', label: 'Hüfte', x: '50%', y: '53%',
    diagnosis: 'Einschränkungen in der Hüfte verursachen Kaskaden: LWS-Schmerz oben, Knieschmerz unten.',
    solution: 'AXON prüft alle 6 Rotationsebenen und erstellt einen gezielten Mobilisierungsplan für deine spezifische Einschränkung.' },
  { id: 'knie', label: 'Knie', x: '35%', y: '68%',
    diagnosis: 'Knieschmerzen sind fast immer ein Hinweis auf Dysbalancen darüber (Hüfte) oder darunter (Sprunggelenk).',
    solution: 'AXON analysiert die gesamte untere Kette und erstellt ein Protokoll, das an der Ursache ansetzt.' },
  { id: 'sprunggelenk', label: 'Sprunggelenk', x: '40%', y: '88%',
    diagnosis: 'Eingeschränkte Dorsalflexion blockiert die gesamte Bewegungskette nach oben — bis zur Hüfte.',
    solution: 'AXON testet die Dorsalflexion und gibt dir einen gezielten Soleus/Achilles-Release mit Neuro-Integration.' },
];

// Dot colors per region
const DOT_COLORS = {
  nacken: 'bg-cyan-400 shadow-cyan-400/60',
  schulter: 'bg-purple-400 shadow-purple-400/60',
  ruecken: 'bg-blue-400 shadow-blue-400/60',
  hueft: 'bg-emerald-400 shadow-emerald-400/60',
  knie: 'bg-amber-400 shadow-amber-400/60',
  sprunggelenk: 'bg-rose-400 shadow-rose-400/60',
};

const LABEL_COLORS = {
  nacken: 'text-cyan-400 border-cyan-400/40',
  schulter: 'text-purple-400 border-purple-400/40',
  ruecken: 'text-blue-400 border-blue-400/40',
  hueft: 'text-emerald-400 border-emerald-400/40',
  knie: 'text-amber-400 border-amber-400/40',
  sprunggelenk: 'text-rose-400 border-rose-400/40',
};

export default function SystemAuditSection({ onCtaClick }) {
  const [selected, setSelected] = useState(null);

  const region = BODY_REGIONS.find(r => r.id === selected);

  return (
    <section id="audit" className="py-24 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400 mb-4">System-Audit</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
            Dein Schmerzpunkt verrät dir<br />
            <span className="text-slate-500">nicht die Ursache.</span>
          </h2>
          <p className="text-slate-400 max-w-xs mx-auto text-sm">
            Tippe auf die Stelle, die dir zu schaffen macht.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-10 items-start justify-center">

          {/* Body Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mx-auto flex-shrink-0"
            style={{ width: 200, height: 440 }}
          >
            {/* Real anatomy image - front */}
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png"
              alt="Körper Anatomie"
              className="w-full h-full object-contain opacity-70"
              draggable={false}
            />

            {/* Clickable region dots */}
            {BODY_REGIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(selected === r.id ? null : r.id)}
                style={{ left: r.x, top: r.y, transform: 'translate(-50%, -50%)' }}
                className={`absolute z-10 transition-all duration-200 rounded-full ${
                  selected === r.id
                    ? `w-5 h-5 ${DOT_COLORS[r.id]} shadow-[0_0_14px_4px] scale-125`
                    : `w-4 h-4 ${DOT_COLORS[r.id]} opacity-70 hover:opacity-100 hover:scale-110 shadow-md`
                }`}
              />
            ))}
          </motion.div>

          {/* Info Panel */}
          <div className="flex-1 w-full md:max-w-sm">
            <AnimatePresence mode="wait">
              {!region ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-start justify-start pt-4"
                >
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Wähle eine Körperregion — AXON zeigt dir, was wirklich dahinter steckt.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BODY_REGIONS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                        className={`text-xs border rounded-full px-3 py-1.5 font-medium transition-colors ${LABEL_COLORS[r.id]} hover:bg-white/5`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={region.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="space-y-4"
                >
                  <h3 className={`text-lg font-black uppercase tracking-wide ${LABEL_COLORS[region.id].split(' ')[0]}`}>
                    {region.label}
                  </h3>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Was wirklich dahinter steckt</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{region.diagnosis}</p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">Die AXON Lösung</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{region.solution}</p>
                  </div>

                  <button
                    onClick={onCtaClick}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-cyan-50 text-black font-black text-sm px-6 py-4 rounded-2xl transition-all hover:scale-[1.02] uppercase tracking-wide"
                  >
                    Mein {region.label}-Protokoll starten
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