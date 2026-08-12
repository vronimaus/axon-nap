import { motion } from 'framer-motion';
import { Wrench, Zap, Target, Volume2, ArrowRight, Play, Pause } from 'lucide-react';
import { useState } from 'react';

const STEPS = [
  { num: '1', label: 'Faszien-Release', desc: 'Druckpunkt lösen', color: 'emerald' },
  { num: '2', label: 'Neuro-Drill', desc: 'Nervensystem kalibrieren', color: 'blue' },
  { num: '3', label: 'Integration', desc: 'Bewegung verankern', color: 'purple' },
];

const STAGES = [
  { tag: '01', label: 'Soforthilfe', desc: 'Akute Blockade in 5 Min', color: 'emerald' },
  { tag: '02', label: 'Flow', desc: 'Tägliche 5–15 Min. Routinen', color: 'purple' },
  { tag: '03', label: 'Goals', desc: 'Progression zu deinem Ziel', color: 'blue' },
];

const colorClasses = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

const DEMO_CUE = '"Schließe die Augen. Atme tief ein. Beim Ausatmen lasse die Schultern nach unten fallen. Spüre, wie sich der Raum zwischen Ohr und Schulter vergrößert."';

export default function BentoSection({ onCtaClick }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) setTimeout(() => setIsPlaying(false), 15000);
  };

  return (
    <section id="system" className="py-12 md:py-16 px-6 bg-slate-950 border-t border-white/5">
      <div className="max-w-5xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Wie AXON funktioniert</p>
          <h2 className="text-xl md:text-3xl font-black text-white leading-tight">
            Ein Protokoll. Drei Stufen. <span className="text-cyan-400">Ein Audio-Coach.</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Tile 1: Das 3-Schritt-Protokoll */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="font-bold text-sm text-white">Das Protokoll</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Jede Session folgt demselben Ablauf — drei Schritte, die aufeinander aufbauen.
            </p>
            <div className="space-y-2 flex-1">
              {STEPS.map((s) => {
                const c = colorClasses[s.color];
                return (
                  <div key={s.num} className={`flex items-center gap-3 ${c.bg} border ${c.border} rounded-xl p-2.5`}>
                    <div className={`w-6 h-6 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                      <span className={`text-[10px] font-black ${c.text}`}>{s.num}</span>
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold ${c.text}`}>{s.label}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Tile 2: Drei Stufen */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="md:col-span-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-bold text-sm text-white">Drei Stufen</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Vom akuten Problem zur langfristigen Performance — jede Stufe baut auf der vorigen auf.
            </p>
            <div className="space-y-2 flex-1">
              {STAGES.map((s) => {
                const c = colorClasses[s.color];
                return (
                  <div key={s.tag} className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded-xl p-2.5">
                    <span className={`text-[10px] font-black ${c.text}`}>{s.tag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white">{s.label}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] text-emerald-400 font-bold">Soforthilfe</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
              <span className="text-[10px] text-purple-400 font-bold">Flow</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
              <span className="text-[10px] text-blue-400 font-bold">Goals</span>
            </div>
          </motion.div>

          {/* Tile 3: Audio-Coach */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-900/40 border border-cyan-500/20 rounded-2xl p-5 flex flex-col relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-2 mb-3 relative">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="font-bold text-sm text-white">Audio-Coach</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4 relative">
              Kein Video-Starren. Präzise Cues führen dich durch jede Übung — deine Aufmerksamkeit bleibt im Körper.
            </p>

            <div className="bg-slate-800/50 rounded-xl p-3 mb-3 border border-slate-700/50 relative flex-1">
              <p className="text-slate-300 text-[11px] italic leading-relaxed">{DEMO_CUE}</p>
            </div>

            <button
              onClick={handlePlay}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all relative ${
                isPlaying
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                  : 'bg-white hover:bg-cyan-50 text-black hover:scale-105'
              } uppercase tracking-wide`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Läuft…' : 'Demo-Cue hören'}
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}