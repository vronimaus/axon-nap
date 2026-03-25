import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const PAINS = [
  { tag: 'HWS', text: 'Nacken ist schon wieder steif – und du weißt selbst, es liegt am Schreibtisch.' },
  { tag: 'LWS', text: 'Rücken zieht nach dem Workout. Du streckst dich, hilft kurz, ist morgen wieder da.' },
  { tag: 'SHD', text: 'Schulter macht komische Geräusche. Nicht schlimm genug für den Arzt – aber nervig genug.' },
  { tag: 'SYS', text: 'Physio kostet 80 € die Stunde. Für "mach das 3x täglich" – kannst du auch selbst.' },
];

export default function PainAgitationSection({ onFunnelClick }) {
  return (
    <section className="py-20 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        
        {/* Hook */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Kennst du das?</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Nicht krank genug für den Arzt.<br />
            <span className="text-slate-500">Aber täglich präsent.</span>
          </h2>
        </motion.div>

        {/* Pain Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {PAINS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
            >
              <span className="text-[10px] font-black text-cyan-500 tracking-widest uppercase bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg shrink-0 mt-0.5">{p.tag}</span>
              <p className="text-slate-300 text-sm leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Bridge to solution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-5"
        >
          <p className="text-slate-300 text-lg font-medium">
            Das Problem ist nicht dein Körper.<br />
            <span className="text-white font-bold">Es ist, dass du nie das richtige Protokoll hattest.</span>
          </p>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            AXON kombiniert myofasziale Druckpunkte, funktionelle Bewegung und neurologische Verankerung — 
            zu einem System, das du selbst anwendest. In 5–15 Minuten.
          </p>

          {/* CTA */}
          <button
            onClick={onFunnelClick}
            className="mt-4 inline-flex items-center gap-3 bg-white hover:bg-cyan-50 text-black font-black text-sm px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.08)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300 hover:scale-105 uppercase tracking-wide"
          >
            Beschwerden analysieren
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-slate-400">Kostenlos · Kein Account · 60 Sekunden</p>
        </motion.div>

      </div>
    </section>
  );
}