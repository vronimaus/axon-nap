import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BULLETS = [
  'Einmalzahlung — nie wieder Abo',
  'Alle zukünftigen Updates inklusive',
  'Personalisierter KI-Plan in 60 Sek.',
];

export default function FairnessSection({ onCtaClick }) {
  return (
    <section id="pricing" className="py-16 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-sm mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl p-7 text-center border border-white/10 shadow-2xl shadow-cyan-500/20"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200/70 mb-3">Kein Abo. Einmalig.</p>

          <div className="mb-1">
            <span className="text-5xl font-black text-white tracking-tight">59,90 €</span>
          </div>
          <p className="text-xs text-cyan-200/50 line-through mb-5">Später 179,00 €</p>

          <ul className="text-left space-y-2 mb-7">
            {BULLETS.map((b, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-white/90 font-medium">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                {b}
              </li>
            ))}
          </ul>

          <Button
            onClick={() => onCtaClick('direct')}
            className="w-full bg-white hover:bg-cyan-50 text-black py-5 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl uppercase tracking-wide"
          >
            Jetzt kaufen
          </Button>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-cyan-200/60 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>30-Tage Geld-zurück-Garantie</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}