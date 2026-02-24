import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingSection({ onCtaClick }) {
  return (
    <section id="pricing" className="py-24 px-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[3rem] p-8 md:p-12 lg:p-16 text-center shadow-2xl shadow-cyan-500/20 border border-white/10"
        >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Besitze deine Gesundheit.</h2>
            <p className="text-cyan-100 text-lg md:text-xl mb-12 max-w-xl mx-auto font-medium leading-relaxed">
                Nur für kurze Zeit bieten wir AXON als Lifetime-Deal an. Unterstütze die Entwicklung als Early Adopter und zahle nie wieder monatliche Gebühren.
            </p>
            
            {/* Price Box */}
            <div className="bg-slate-950/30 backdrop-blur-md inline-flex flex-col p-8 md:p-10 rounded-3xl border border-white/20 mb-12 relative overflow-hidden group hover:border-white/40 transition-colors">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-200 mb-2">Early Bird Preis</span>
                <span className="text-6xl md:text-7xl font-black text-white tracking-tight">59,90 €</span>
                <span className="text-sm text-cyan-200/60 line-through mt-2 font-medium">Später 179,00 €</span>
            </div>

            <div className="flex justify-center mb-12">
                <ul className="text-left space-y-4 text-white font-semibold text-sm md:text-base">
                    {[
                        "Lebenslanger Zugriff auf die Plattform",
                        "Alle 226 AXON Exercise-Codes",
                        "KI-basierte Trainingsanpassung",
                        "Alle zukünftigen Updates inklusive"
                    ].map((item, i) => (
                        <li key={i} className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-white text-cyan-600 flex items-center justify-center shadow-sm">
                                <Check className="w-3.5 h-3.5" strokeWidth={4} />
                            </div>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <Button 
                onClick={onCtaClick}
                className="w-full max-w-md bg-white hover:bg-cyan-50 text-black py-8 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl shadow-cyan-900/20 uppercase tracking-wide"
            >
                JETZT ZUGRIFF SICHERN
            </Button>
            <p className="text-cyan-200/60 text-xs mt-6 font-medium">30 Tage Geld-zurück-Garantie. Kein Risiko.</p>
        </motion.div>
      </div>
    </section>
  );
}