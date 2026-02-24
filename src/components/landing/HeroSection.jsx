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
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] text-white">
            Dein Körper braucht kein Abo.<br /> 
            Er braucht ein <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Update.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed max-w-xl">
            Verabschiede dich von starren Trainingsplänen. AXON ist der erste intelligente Begleiter, der dein Nervensystem und deine Biomechanik in Echtzeit synchronisiert.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
                onClick={onCtaClick}
                className="bg-white hover:bg-cyan-50 text-black px-8 py-6 rounded-2xl font-black text-base uppercase tracking-wide transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
                Lifetime Zugriff 59,90€
            </Button>
            <div className="flex items-center space-x-3 px-4 py-2 bg-slate-900/50 rounded-2xl border border-white/5">
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] text-slate-400">
                        {/* Placeholder Avatar */}
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-700 to-slate-800" />
                    </div>
                 ))}
              </div>
              <span className="text-xs text-slate-400 font-bold">+400 Early Adopters</span>
            </div>
          </div>
        </motion.div>

        {/* App Mockup / Visual */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
        >
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          {/* Mockup Container */}
          <div className="relative z-10 bg-slate-900 border-[8px] border-slate-800 rounded-[2.5rem] shadow-2xl shadow-cyan-900/20 max-w-[320px] mx-auto overflow-hidden aspect-[9/18.5] flex flex-col">
            
            {/* Mockup Header */}
            <div className="bg-slate-950 p-6 pb-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-[10px] font-bold text-slate-400 tracking-widest">AXON OS</div>
                    <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                        <div className="w-3 h-1.5 rounded-full bg-cyan-500"></div>
                    </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide">Ready State: 98%</div>
                    </div>
                    <div className="text-[9px] text-slate-400 leading-tight">
                        Dein System ist bereit für explosive Varianten. Neuro-Check erfolgreich.
                    </div>
                </div>
            </div>

            {/* Mockup Body */}
            <div className="flex-1 bg-slate-900 p-6 pt-2 overflow-hidden flex flex-col">
                <h4 className="text-lg font-black text-white mb-1">Explosive Engine</h4>
                <p className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-wide">Reaktivität & Sehnensteifigkeit</p>
                
                <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "25%" }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                        className="bg-cyan-500 h-full rounded-full"
                    />
                </div>

                <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 flex-grow relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between text-[9px] uppercase font-bold text-blue-400 mb-3 tracking-widest">
                            <span>Software (Neuro)</span>
                            <span className="text-white">⏱ 0:30</span>
                        </div>
                        <div className="text-sm font-black text-white leading-tight mb-2">VESTIBULAR TILT &<br/>REACTIVE HOP</div>
                        <div className="flex gap-1 mt-2">
                             <div className="h-1 w-1 rounded-full bg-slate-600"></div>
                             <div className="h-1 w-8 rounded-full bg-slate-600"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mockup Footer */}
            <div className="bg-slate-950 p-4 border-t border-white/5">
                <div className="flex justify-around text-slate-600 items-center">
                    <div className="text-lg hover:text-white transition-colors cursor-pointer">⊞</div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                    </div>
                    <div className="text-lg hover:text-white transition-colors cursor-pointer">📈</div>
                </div>
            </div>

          </div>
        </motion.div>
      </div>
    </header>
  );
}