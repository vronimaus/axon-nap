import { motion } from 'framer-motion';

const PAINS = [
  { emoji: '😤', text: 'Nacken ist schon wieder steif – und du weißt selbst, es liegt am Schreibtisch.' },
  { emoji: '😩', text: 'Rücken zieht nach dem Workout. Du streckst dich, hilft kurz, ist morgen wieder da.' },
  { emoji: '🤦', text: 'Schulter macht komische Geräusche. Nicht schlimm genug für den Arzt – aber nervig genug.' },
  { emoji: '💸', text: 'Physio kostet 80€ die Stunde. Für "mach das 3x täglich" – kannst du auch selbst.' },
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
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-4">Kennst du das?</p>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Nicht krank genug für den Arzt.<br />
            <span className="text-slate-400">Aber schmerzhaft genug um zu stören.</span>
          </h2>
          <p className="text-slate-400 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
            Du willst dir selbst helfen. Nicht warten. Nicht erklären. Einfach <strong className="text-white">den Hebel finden und drehen.</strong>
          </p>
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
              <span className="text-2xl shrink-0 mt-0.5">{p.emoji}</span>
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
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            AXON kombiniert myofasziale Druckpunkte, Neuro-Drills und gezielte Bewegung – 
            zu einem System, das du selbst anwendest. In 5–15 Minuten. Ohne Gerät. Ohne Physio.
          </p>

          {/* Inline CTA */}
          <button
            onClick={onFunnelClick}
            className="mt-4 inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-black text-sm px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.25)] transition-all duration-300 hover:scale-105"
          >
            🩺 Meinen Schmerzpunkt markieren →
          </button>
          <p className="text-xs text-slate-600">Kostenlos · Kein Account · 60 Sekunden</p>
        </motion.div>

      </div>
    </section>
  );
}