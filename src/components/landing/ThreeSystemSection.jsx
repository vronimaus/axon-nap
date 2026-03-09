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
  amber: {
    border: 'border-amber-500/30 hover:border-amber-500/60',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    tag: 'bg-amber-500/10 text-amber-400',
  },
  purple: {
    border: 'border-purple-500/30 hover:border-purple-500/60',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    tag: 'bg-purple-500/10 text-purple-400',
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
          className="text-center mb-16"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-4">Das System</p>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Drei Module. Ein Körper.<br />
            <span className="text-cyan-400">Alles arbeitet zusammen.</span>
          </h2>
          <p className="text-slate-400 mt-5 text-base max-w-2xl mx-auto leading-relaxed">
            Rehab löst den Schmerz. Flow hält dich geschmeidig. Goals trainieren das System.
            Kein Modul funktioniert isoliert – genau wie dein Körper.
          </p>
        </motion.div>

        {/* Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PILLARS.map((p, i) => {
            const c = colorMap[p.color];
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-slate-900/60 border ${c.border} rounded-[1.5rem] p-7 flex flex-col gap-5 transition-all duration-300`}
              >
                {/* Tag */}
                <span className={`self-start text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${c.tag}`}>
                  {p.tag}
                </span>

                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-white mb-2">{p.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{p.description}</p>
                </div>

                {/* SEO keyword chips */}
                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  {p.keywords.map((k) => (
                    <span key={k} className="text-[10px] text-slate-500 border border-slate-700 rounded-full px-2 py-0.5">
                      {k}
                    </span>
                  ))}
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
            <span className="text-amber-400 font-bold">Flow</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-purple-400 font-bold">Goals</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-300 font-bold">Du · verletzungsfrei · stärker</span>
          </p>
        </motion.div>

      </div>
    </section>
  );
}