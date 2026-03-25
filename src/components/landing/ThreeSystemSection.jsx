import { motion } from 'framer-motion';
import { Activity, Zap, Target, ArrowRight } from 'lucide-react';

const PILLARS = [
  {
    icon: Activity,
    color: 'emerald',
    tag: '01 · Rehab',
    title: 'Schmerz lokalisieren & lösen',
    description:
      'Markiere deinen Schmerzpunkt auf der Body-Map. AXON identifiziert den myofaszialen Druckpunkt dahinter und gibt dir ein Protokoll: Kompression → Neuro-Drill → Integration. 5 Minuten. Sofortwirkung.',
    keywords: ['MFR-Druckpunkte', 'Neuro-Drills', 'Faszientherapie'],
  },
  {
    icon: Zap,
    color: 'purple',
    tag: '02 · Flow',
    title: 'Beweglichkeit täglich aufbauen',
    description:
      'Kuratierte 5–15 Min. Routinen aus Mobilisation, Atemarbeit und neuronaler Aktivierung. Kein Aufwärmen das dich nichts kostet – sondern gezielte Investitionen in dein Nervensystem.',
    keywords: ['Mobility Routinen', 'Atemarbeit', 'Neuro-Aktivierung'],
  },
  {
    icon: Target,
    color: 'blue',
    tag: '03 · Goals',
    title: 'Trainingsziele sicher erreichen',
    description:
      'Pull-up, Pistol Squat, Handstand – AXON baut deinen Progressionsplan auf Basis deiner Körperdaten. Kein Überlasten mehr. Kein Stillstand. Der nächste Schritt ist immer klar.',
    keywords: ['Trainingsplan KI', 'Progression', 'Verletzungsprävention'],
  },
];

const colorMap = {
  emerald: {
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    tag: 'bg-emerald-500/10 text-emerald-400',
  },
  purple: {
    border: 'border-purple-500/30 hover:border-purple-500/60',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    tag: 'bg-purple-500/10 text-purple-400',
  },
  blue: {
    border: 'border-blue-500/30 hover:border-blue-500/60',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    tag: 'bg-blue-500/10 text-blue-400',
  },
};

export default function ThreeSystemSection() {
  return (
    <section id="system" className="py-24 px-6 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-5xl mx-auto">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Das System</p>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
            Drei Module. <span className="text-cyan-400">Ein Körper.</span>
          </h2>
        </motion.div>

        {/* Pillar Cards — compact horizontal on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {PILLARS.map((p, i) => {
            const c = colorMap[p.color];
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative bg-slate-900/60 border ${c.border} rounded-2xl p-4 flex gap-4 items-start transition-all duration-300 md:flex-col md:gap-3`}
              >
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <div className="min-w-0">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${c.text} block mb-0.5`}>{p.tag}</span>
                  <h3 className="font-bold text-sm text-white leading-snug">{p.title}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Loop visual hint */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-slate-500 text-sm flex items-center justify-center gap-3">
            <span className="text-emerald-400 font-bold">Rehab</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-purple-400 font-bold">Flow</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-blue-400 font-bold">Goals</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-300 font-bold">Du · verletzungsfrei · stärker</span>
          </p>
        </motion.div>

      </div>
    </section>
  );
}