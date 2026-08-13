import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Brain, Zap, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Brain,
    title: '1. Mach den Test',
    desc: 'Markiere deinen Spannungspunkt auf der Body-Map. 30 Sekunden.',
  },
  {
    icon: Zap,
    title: '2. Plan in 60 Sek.',
    desc: 'AXON baut dein persönliches 3-Schritt-Protokoll — sofort.',
  },
  {
    icon: Smartphone,
    title: '3. Starte den Coach',
    desc: 'Audio-Anleitung läuft. Augen zu, Körper spüren, fertig.',
  },
];

export default function AppMockupSection({ onCtaClick }) {
  return (
    <section id="product" className="py-16 md:py-24 px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0e1414 0%, #0b0f0f 100%)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            Dein Personalisierter Plan
          </div>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight mb-3 text-white">
            Von der Blockade zur Session
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500">in unter 2 Minuten</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Kein standardisierter Plan. AXON analysiert deinen Körper und baut ein
            Protokoll, das genau zu deiner Spannung passt.
          </p>
        </motion.div>

        {/* Content: Phone + Steps */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative mx-auto max-w-[280px]"
          >
            <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full" />
            <img
              src="https://media.base44.com/images/public/69790ebfa6f94c6c3f1450bc/b52ebf271_generated_image.png"
              alt="AXON App auf dem Smartphone"
              className="relative w-full rounded-3xl shadow-2xl shadow-cyan-500/10"
              loading="lazy"
            />
          </motion.div>

          {/* 3-step flow */}
          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06]"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm mb-1">{step.title}</h3>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}

            <motion.button
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              onClick={onCtaClick}
              className="inline-flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wide transition-colors shadow-[0_0_30px_rgba(6,224,226,0.3)] mt-2"
            >
              Jetzt testen
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}