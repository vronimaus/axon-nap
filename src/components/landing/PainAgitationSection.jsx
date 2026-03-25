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
    <section className="py-14 px-6 bg-slate-950">
      <div className="max-w-lg mx-auto">

        {/* Hook — short & punchy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">Kennst du das?</p>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
            Nicht krank genug für den Arzt.<br />
            <span className="text-slate-400">Aber nervig genug für jeden Tag.</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Du willst den <strong className="text-white">Hebel finden und drehen.</strong>
          </p>
        </motion.div>

        {/* Pain tags — compact chips instead of cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {PAINS.map((p, i) => (
            <span
              key={i}
              className="text-xs text-slate-300 bg-slate-800/80 border border-slate-700 rounded-full px-3 py-1.5 font-medium"
            >
              <span className="text-cyan-400 font-bold mr-1.5">{p.tag}</span>
              {p.short}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button
            onClick={onFunnelClick}
            className="inline-flex items-center gap-3 bg-white hover:bg-cyan-50 text-black font-black text-sm px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-105 uppercase tracking-wide"
          >
            Beschwerden analysieren
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-slate-500 mt-3">Kostenlos · Kein Account · 60 Sek.</p>
        </motion.div>

      </div>
    </section>
  );
}