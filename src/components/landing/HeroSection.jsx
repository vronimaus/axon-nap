import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import MagneticButton from './MagneticButton';

export default function HeroSection({ onCtaClick }) {
  return (
    <header className="relative min-h-[88vh] md:min-h-[92vh] flex items-end overflow-hidden" id="vision">
      {/* Full-bleed background image */}
      <img
        src="https://media.base44.com/images/public/69790ebfa6f94c6c3f1450bc/7a88677be_generated_image.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Cinematic gradient overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(11,15,15,0.97) 0%, rgba(11,15,15,0.6) 40%, rgba(11,15,15,0.3) 70%, rgba(11,15,15,0.5) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(11,15,15,0.7) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12 md:pb-20 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-5 backdrop-blur-sm">
            Neuro-Athletic Protocol
          </div>

          <h1 className="text-3xl md:text-6xl font-black mb-4 md:mb-5 leading-[1.05] text-white">
            Finde die Ursache.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500">
              Löse sie in 5 Minuten.
            </span>
          </h1>

          <p className="text-slate-200 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed max-w-xl">
            AXON lokalisiert den Druckpunkt hinter deiner Blockade und führt dich
            durch ein 3-Schritt-Protokoll — Faszien-Release, Neuro-Drill,
            Integration. Per Audio-Coach.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <MagneticButton
              onClick={onCtaClick}
              className="inline-flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black px-6 md:px-8 py-4 md:py-6 rounded-2xl font-black text-xs md:text-base uppercase tracking-wide transition-colors shadow-[0_0_30px_rgba(6,224,226,0.3)] hover:shadow-[0_0_50px_rgba(6,224,226,0.5)] whitespace-nowrap"
            >
              7 Tage kostenlos testen
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <div className="flex items-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10">
              <span className="text-xs text-slate-300 font-medium">
                Danach 59€ einmalig · Kein Abo
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden md:block"
      >
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />
      </motion.div>
    </header>
  );
}