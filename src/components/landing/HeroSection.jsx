import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function HeroSection({ onCtaClick }) {
  return (
    <header className="pt-32 pb-20 px-6 overflow-hidden relative" id="vision">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Text Content */}
        <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
            Early Stage Access • Lifetime Deal
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] text-white">
            Dein Körper<br />braucht kein Abo.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Er braucht ein System.</span>
          </h1>
          <p className="text-slate-400 text-base mb-10 leading-relaxed max-w-sm">
            MFR · Neuro-Drills · Funktionelle Bewegung — als Antwort auf das, was dein Körper gerade braucht.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
                onClick={onCtaClick}
                className="bg-white hover:bg-cyan-50 text-black px-8 py-6 rounded-2xl font-black text-base uppercase tracking-wide transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
                Persönlichen Plan erstellen — kostenlos
            </Button>
            <div className="flex items-center space-x-3 px-4 py-2 bg-slate-900/50 rounded-2xl border border-white/5">
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-700 to-slate-800" />
                    </div>
                 ))}
              </div>
              <span className="text-xs text-slate-400 font-bold">+400 Early Adopters</span>
            </div>
          </div>
        </motion.div>

        {/* App Mockup */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
        >
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 bg-slate-900 border-[8px] border-slate-800 rounded-[2.5rem] shadow-2xl shadow-cyan-900/20 max-w-[320px] mx-auto overflow-hidden aspect-[9/18.5] flex flex-col">
            
            {/* Mockup Header */}
            <div className="bg-slate-950 p-6 pb-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-[10px] font-bold text-slate-400 tracking-widest">AXON · Dein Plan heute</div>
                    <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                        <div className="w-3 h-1.5 rounded-full bg-cyan-500"></div>
                    </div>
                </div>
                <div className="bg-slate-800/60 border border-white/5 p-3 rounded-2xl">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Ziel · Schulter-Mobilität</div>
                    <div className="flex gap-2">
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">MFR</span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">Functional</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">Neuro</span>
                    </div>
                </div>
            </div>

            {/* Mockup Body — 3 steps */}
            <div className="flex-1 bg-slate-900 p-4 pt-2 overflow-hidden flex flex-col gap-2">
                
                {/* Step 1: MFR */}
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-emerald-500/20 flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-emerald-400">1</span>
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Faszien · MFR</div>
                        <div className="text-[11px] font-bold text-white leading-tight">Pectoralis Minor lösen</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">90 Sek. · Druckpunkt N8</div>
                    </div>
                </div>

                {/* Step 2: Functional */}
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-blue-500/20 flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-blue-400">2</span>
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Functional</div>
                        <div className="text-[11px] font-bold text-white leading-tight">Wall Slides · 3×10</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Skapula-Kontrolle aktivieren</div>
                    </div>
                </div>

                {/* Step 3: Neuro */}
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-purple-500/20 flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-purple-400">3</span>
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Neuro · Verankerung</div>
                        <div className="text-[11px] font-bold text-white leading-tight">Horizontale Sakkaden</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">30 Sek. · Bewegungsmuster festigen</div>
                    </div>
                </div>

                <div className="mt-auto pt-1">
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "66%" }}
                            transition={{ duration: 2, delay: 1 }}
                            className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 h-full rounded-full"
                        />
                    </div>
                    <div className="text-[9px] text-slate-500 text-right mt-1">2 / 3 abgeschlossen</div>
                </div>
            </div>

            {/* Mockup Footer */}
            <div className="bg-slate-950 p-4 border-t border-white/5">
                <div className="flex justify-around text-slate-600 items-center">
                    <div className="text-lg hover:text-white transition-colors cursor-pointer">⊞</div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                    </div>
                    <div className="text-lg hover:text-white transition-colors cursor-pointer">↑</div>
                </div>
            </div>

          </div>
        </motion.div>
      </div>
    </header>
  );
}