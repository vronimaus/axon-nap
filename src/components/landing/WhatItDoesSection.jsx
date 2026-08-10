import { motion } from 'framer-motion';
import { Search, Wrench, Repeat, BookOpen } from 'lucide-react';

const FEATURES = [
  {
    icon: Search,
    color: 'cyan',
    title: 'Körperkarte',
    description: 'Schmerzpunkt auf der Körperkarte markieren. AXON erkennt die Ursache und die betroffene Faszienkette.',
  },
  {
    icon: Wrench,
    color: 'emerald',
    title: 'Tune-Up',
    description: '3-Schritt-Protokoll: Faszien-Release → Neuro-Drill → Integration. Akute Verspannungen in 5 Minuten lösen.',
  },
  {
    icon: Repeat,
    color: 'purple',
    title: 'Routinen',
    description: '5–15 Min. täglich: Mobility, Atemarbeit, neurologische Aktivierung. Basierend auf deinem Tageszustand.',
  },
  {
    icon: BookOpen,
    color: 'amber',
    title: 'Wissen',
    description: 'Faszien, Neurologie, Regeneration — verständlich erklärt. Nur Mechanismen, die funktionieren.',
  },
];

const colorMap = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export default function WhatItDoesSection() {
  return (
    <section className="py-16 px-6 bg-slate-950 border-t border-white/5">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Was AXON kann</p>
          <h2 className="text-xl md:text-3xl font-black text-white leading-tight">
            Ein System. Vier Funktionen.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-4"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[f.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white mb-0.5">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}