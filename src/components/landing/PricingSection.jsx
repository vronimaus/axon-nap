import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  "Lebenslanger Zugriff — einmal zahlen, nie wieder",
  "Personalisierter Rehab-Plan per KI in 60 Sekunden",
  "226 AXON Exercise-Codes mit Neuro-Protokoll",
  "Alle zukünftigen Updates inklusive",
];

export default function PricingSection({ onCtaClick }) {
  return (
    <section id="pricing" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-3xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[3rem] p-8 md:p-12 text-center shadow-2xl shadow-cyan-500/20 border border-white/10"
        >
          {/* Headline */}
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70 mb-3">Besitze deine Gesundheit</p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            In 15 Minuten spürst du den Unterschied —<br />
            <span className="text-cyan-200">oder du bekommst dein Geld zurück.</span>
          </h2>
          <p className="text-cyan-100/80 text-base mb-10 max-w-lg mx-auto leading-relaxed">
            Nur für kurze Zeit als Lifetime-Deal. Unterstütze die Entwicklung als Early Adopter und zahle nie wieder monatliche Gebühren.
          </p>

          {/* Price Box */}
          <div className="bg-slate-950/30 backdrop-blur-md inline-flex flex-col p-8 rounded-3xl border border-white/20 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-200 mb-2">Early Bird Preis</span>
            <span className="text-6xl md:text-7xl font-black text-white tracking-tight">59,90 €</span>
            <span className="text-sm text-cyan-200/60 line-through mt-2 font-medium">Später 179,00 €</span>
            <span className="text-xs text-cyan-200/60 mt-1">Einmalzahlung. Kein Abo.</span>
          </div>

          {/* Features */}
          <ul className="text-left space-y-3 text-white font-semibold text-sm md:text-base mb-10 max-w-md mx-auto">
            {FEATURES.map((item, i) => (
              <li key={i} className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-white text-cyan-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" strokeWidth={4} />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button
            onClick={() => onCtaClick('direct')}
            className="w-full max-w-sm bg-white hover:bg-cyan-50 text-black py-8 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-cyan-900/20 uppercase tracking-wide"
          >
            Jetzt kaufen
          </Button>

          {/* Trust Line */}
          <div className="flex items-center justify-center gap-2 mt-6 text-cyan-200/70 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>30-Tage Geld-zurück-Garantie. Keine Fragen gestellt. Sicherer Checkout via Stripe.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}