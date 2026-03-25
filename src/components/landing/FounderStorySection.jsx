import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const PROOF_POINTS = [
  { number: '9+', label: 'Jahre Praxiserfahrung' },
  { number: '3', label: 'Wissenschaftliche Systeme vereint' },
  { number: '226', label: 'AXON Exercise-Codes' },
];

export default function FounderStorySection({ onCtaClick }) {
  return (
    <section className="py-20 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
        >
          {/* Story */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Warum AXON existiert</p>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-5">
              Ich wollte das Protokoll,<br />
              <span className="text-cyan-400">das Physios anwenden —</span><br />
              zum selbst machen.
            </h2>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <p>
                Nach Jahren auf der Matte und hunderten Klienten wurde mir klar: 
                <strong className="text-white"> Das Wissen ist da. Es ist nur nicht zugänglich.</strong> 
                Myofasziale Ketten, neurologische Verankerung, funktionelle Bewegungsmuster — alles 
                peer-reviewed, alles wirksam, alles hinter Fachbüchern versteckt.
              </p>
              <p>
                AXON übersetzt dieses Wissen in 5–15 Minuten Protokolle. 
                Nicht als Ersatz für den Therapeuten — sondern als das Werkzeug, 
                das du täglich brauchst, das aber niemand bisher gebaut hat.
              </p>
            </div>

            <button
              onClick={onCtaClick}
              className="mt-6 inline-flex items-center gap-2 text-cyan-400 font-bold text-sm hover:text-cyan-300 transition-colors group uppercase tracking-widest"
            >
              Starte dein System-Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Proof Points */}
          <div className="space-y-4">
            {PROOF_POINTS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
              >
                <span className="text-3xl font-black text-cyan-400 tabular-nums w-16 text-right shrink-0">{p.number}</span>
                <p className="text-slate-300 text-sm font-medium">{p.label}</p>
              </motion.div>
            ))}

            {/* Science Badges */}
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Basiert auf</p>
              <div className="flex flex-wrap gap-2">
                {['Stecco Faszientherapie', 'Gray Cook FMS', 'Z-Health Neuroathletik', 'McGill Rückenprotokoll', 'Pavel Strength'].map(s => (
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