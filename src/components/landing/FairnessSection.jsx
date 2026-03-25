import React from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COMPARISON = [
  { label: 'Monatliche Gebühren', axon: false, other: true },
  { label: 'Alle zukünftigen Updates', axon: true, other: false },
  { label: 'Audio-geführte Protokolle', axon: true, other: false },
  { label: 'Wissenschaftlich fundiert', axon: true, other: '50/50' },
  { label: 'Personalisierter KI-Plan', axon: true, other: false },
  { label: 'Einmalzahlung für immer', axon: true, other: false },
];

export default function FairnessSection({ onCtaClick }) {
  return (
    <section id="pricing" className="py-20 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Das Fairness-Angebot</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Subscription Fatigue?<br />
            <span className="text-cyan-400">Kein Abo. Nie wieder.</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base">
            In einer Welt voller monatlicher Abbuchungen bieten wir dir ein Werkzeug, das du besitzt.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden mb-10"
        >
          {/* Header */}
          <div className="grid grid-cols-3 text-center border-b border-slate-800">
            <div className="p-4 text-left">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Feature</p>
            </div>
            <div className="p-4 bg-cyan-500/10 border-x border-cyan-500/20">
              <p className="text-xs font-black text-cyan-400 uppercase tracking-widest">AXON</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Andere Apps</p>
            </div>
          </div>

          {COMPARISON.map((row, i) => (
            <div key={i} className={`grid grid-cols-3 border-b border-slate-800/50 last:border-b-0 ${i % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
              <div className="p-4 flex items-center">
                <p className="text-sm text-slate-300">{row.label}</p>
              </div>
              <div className="p-4 flex items-center justify-center bg-cyan-500/5">
                {row.axon === true
                  ? <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-cyan-400" strokeWidth={3} /></div>
                  : <X className="w-4 h-4 text-red-400" />}
              </div>
              <div className="p-4 flex items-center justify-center">
                {row.other === true
                  ? <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} /></div>
                  : row.other === '50/50'
                  ? <span className="text-xs text-slate-500">teils</span>
                  : <X className="w-4 h-4 text-red-400/60" />}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Price Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl p-8 text-center border border-white/10 shadow-2xl shadow-cyan-500/20"
        >
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70 mb-2">Early Bird Preis</p>
          <div className="mb-2">
            <span className="text-5xl md:text-6xl font-black text-white tracking-tight">59,90 €</span>
          </div>
          <p className="text-sm text-cyan-200/60 line-through mb-1">Später 179,00 €</p>
          <p className="text-xs text-cyan-200/60 mb-6">Einmalzahlung · Kein Abo · Alle Updates inklusive</p>

          <Button
            onClick={() => onCtaClick('direct')}
            className="w-full max-w-xs bg-white hover:bg-cyan-50 text-black py-6 rounded-2xl font-black text-base hover:scale-105 transition-all shadow-xl uppercase tracking-wide"
          >
            Jetzt kaufen
          </Button>

          <div className="flex items-center justify-center gap-2 mt-5 text-cyan-200/70 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>30-Tage Geld-zurück-Garantie · Sicherer Checkout via Stripe</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}