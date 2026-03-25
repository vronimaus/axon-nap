import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const SCIENCE_BADGES = [
  'Stecco Faszientherapie',
  'Gray Cook FMS',
  'Z-Health Neuroathletik',
  'McGill Rückenprotokoll',
  'Pavel Strength',
];

export default function FounderStorySection({ onCtaClick }) {
  return (
    <section className="py-16 px-6 bg-slate-950">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">Warum AXON existiert</p>

          <h2 className="text-xl md:text-2xl font-black text-white leading-snug">
            Das Wissen der Physios —<br />
            <span className="text-cyan-400">endlich selbst anwendbar.</span>
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed">
            Myofasziale Ketten, neurologische Verankerung, funktionelle Bewegungsmuster — peer-reviewed, wirksam, aber hinter Fachbüchern versteckt.
            AXON übersetzt dieses Wissen in 5–15 Minuten Protokolle. Nicht als Ersatz für den Therapeuten, sondern als das tägliche Werkzeug, das bisher niemand gebaut hat.
          </p>

          {/* Science Badges */}
          <div className="pt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Wissenschaftliche Grundlage</p>
            <div className="flex flex-wrap gap-2">
              {SCIENCE_BADGES.map(s => (
                <span key={s} className="text-[11px] text-slate-400 border border-slate-700/80 rounded-full px-3 py-1 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 text-cyan-400 font-bold text-xs hover:text-cyan-300 transition-colors duration-150 group uppercase tracking-widest pt-1"
          >
            System-Audit starten
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}