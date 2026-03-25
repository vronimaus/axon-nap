import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const PROOF_POINTS = [
  { number: '9+', label: 'Jahre Praxiserfahrung' },
  { number: '3', label: 'Wissenschaftliche Systeme vereint' },
  { number: '226', label: 'AXON Exercise-Codes' },
];

const SCIENCE_BASES = ['Stecco Faszientherapie', 'Gray Cook FMS', 'Z-Health Neuroathletik', 'McGill Protokoll', 'Pavel Strength'];

export default function FounderStorySection({ onCtaClick }) {
  return (
    <section className="py-24 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start"
        >
          {/* Story */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-4">Warum AXON existiert</p>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-5">
              Ich wollte das Protokoll,<br />
              <span className="text-cyan-400">das Physios anwenden —</span><br />
              zum selbst machen.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Das Wissen ist da. Es ist nur nicht zugänglich. AXON übersetzt peer-reviewed Methoden in 5–15 Minuten Protokolle — täglich anwendbar, ohne Therapeuten.
            </p>

            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 text-cyan-400 font-bold text-xs hover:text-cyan-300 transition-colors group uppercase tracking-widest"
            >
              System-Audit starten
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Proof Points + Science */}
          <div className="space-y-3">
            {PROOF_POINTS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-4"
              >
                <span className="text-2xl font-black text-cyan-400 tabular-nums w-14 text-right shrink-0">{p.number}</span>
                <p className="text-slate-300 text-sm">{p.label}</p>
              </motion.div>
            ))}

            <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 mt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Basiert auf</p>
              <div className="flex flex-wrap gap-2">
                {SCIENCE_BASES.map(s => (
                  <span key={s} className="text-[10px] text-slate-400 border border-slate-700 rounded-full px-2.5 py-1">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}