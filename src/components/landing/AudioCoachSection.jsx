import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Eye, Target, Waves } from 'lucide-react';

const AUDIO_DEMO = {
  text: '"Schließe die Augen. Atme tief ein. Beim Ausatmen lasse deine Schultern aktiv fallen. Spüre den Raum zwischen Ohr und Schulter. Halte — und atme dreimal weiter."',
  label: 'Schulter-Release · Demo-Cue',
  duration: '15 Sek.',
};

const BENEFITS = [
  { Icon: Eye, title: 'Eyes-Free Training', text: 'Kein Bildschirm-Starren — volle Konzentration auf deinen Körper.' },
  { Icon: Target, title: 'Echtzeit-Korrektur', text: 'Präzise Cues zu Atmung und Spannung, genau dann, wenn du sie brauchst.' },
  { Icon: Waves, title: 'Tiefer Flow-Zustand', text: 'Kein Unterbrechen. Kein Nachschauen. Nur Bewegung.' },
];

export default function AudioCoachSection({ onCtaClick }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) setTimeout(() => setIsPlaying(false), 15000);
  };

  return (
    <section className="py-24 px-6 bg-slate-950">
      <div className="max-w-3xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-4">Audio-Coaching</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
            Dein Trainer im Ohr.<br />
            <span className="text-cyan-400">Dein Gehirn am Steuer.</span>
          </h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Keine Videos. Keine Imitation. Nur du, die Stimme — und dein Körper.
          </p>
        </motion.div>

        {/* Sound Check Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 mb-8 relative overflow-hidden"
        >
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center gap-0.5 opacity-5 pointer-events-none">
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full"
                  animate={{ height: [6, Math.random() * 50 + 8, 6] }}
                  transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.3, delay: i * 0.04 }}
                />
              ))}
            </div>
          )}

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{AUDIO_DEMO.label}</span>
              <span className="text-[10px] text-slate-500 ml-auto">{AUDIO_DEMO.duration}</span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-4 mb-5 border border-slate-700/40">
              <p className="text-slate-300 text-sm italic leading-relaxed">{AUDIO_DEMO.text}</p>
            </div>

            <button
              onClick={handlePlay}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-wide ${
                isPlaying
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                  : 'bg-white hover:bg-cyan-50 text-black hover:scale-105'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Läuft...' : 'Demo-Cue anhören'}
            </button>
          </div>
        </motion.div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2.5"
            >
              <b.Icon className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">{b.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{b.text}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}