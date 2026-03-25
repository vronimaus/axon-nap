import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, ArrowRight } from 'lucide-react';

const AUDIO_DEMO = {
  // A short TTS-generated sample instruction (placeholder — swap with real URL)
  url: null,
  text: '"Schließe jetzt die Augen. Atme tief ein. Beim Ausatmen lasse deine Schultern aktiv nach unten fallen. Spüre, wie sich der Raum zwischen Ohr und Schulter vergrößert. Halte diese Position und atme dreimal ruhig weiter."',
  label: 'Schulter-Release · Demo-Cue',
  duration: '15 Sek.',
};

const BENEFITS = [
  { icon: 'Eye', title: 'Eyes-Free Training', text: 'Volle Konzentration auf Körperspositionen — kein Bildschirm-Starren.' },
  { icon: 'Target', title: 'Echtzeit-Korrektur', text: 'Präzise Cues zu Atmung und Spannung, genau dann, wenn du sie brauchst.' },
  { icon: 'Waves', title: 'Tiefer Flow-Zustand', text: 'Audio wirkt wie ein Metronom — kein Unterbrechen, kein Nachschauen.' },
];

export default function AudioCoachSection({ onCtaClick }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    setHasPlayed(true);
    // If real audio URL is set, play it
    // For now just toggle state as demo
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 15000);
    }
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Audio-Coaching</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Dein Trainer im Ohr.<br />
            <span className="text-cyan-400">Dein Gehirn am Steuer.</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            AXON führt dich mit präzisen Audio-Cues durch jede Übung. Kein Smartphone-Starren. 
            Kein Video-Nachahmen. Nur du, die Stimme — und dein Körper.
          </p>
        </motion.div>

        {/* Sound Check Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 md:p-8 mb-12 relative overflow-hidden"
        >
          {/* Background wave visual */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-10">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full"
                    animate={{ height: [8, Math.random() * 60 + 10, 8] }}
                    transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.4, delay: i * 0.05 }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Sound Check · {AUDIO_DEMO.label}</span>
              <span className="text-xs text-slate-500 ml-auto">{AUDIO_DEMO.duration}</span>
            </div>

            {/* Quote */}
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700/50">
              <p className="text-slate-300 text-sm italic leading-relaxed">{AUDIO_DEMO.text}</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handlePlay}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                  isPlaying
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                    : 'bg-white hover:bg-cyan-50 text-black hover:scale-105'
                } uppercase tracking-wide`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Höre einen Demo-Cue'}
              </button>
              {hasPlayed && !isPlaying && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-slate-400"
                >
                  Spürst du den Unterschied?
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <span className="text-2xl">{b.icon}</span>
              <h3 className="font-bold text-white text-sm">{b.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{b.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Neuro-Minimalismus Block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-6 md:p-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">Neuro-Minimalismus</p>
          <h3 className="text-xl md:text-2xl font-black text-white mb-4">
            Warum AXON keine Videos hat — und warum das kein Fehler ist.
          </h3>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              Videos zwingen dich zur <strong className="text-white">externen Imitation</strong> — du schaust nach, statt zu spüren. 
              Bei neuro-faszialen Übungen ist das kontraproduktiv: Dein Blick soll nicht auf dem Bildschirm sein, 
              wenn du Augenmobilität trainierst.
            </p>
            <p>
              Audio erzwingt <strong className="text-white">interne Ansteuerung</strong>. Dein Gehirn fokussiert auf das Gewebe, 
              nicht auf das Nachahmen einer Bewegung. Das ist der Unterschied zwischen Training und echtem neurologischem Lernen.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}