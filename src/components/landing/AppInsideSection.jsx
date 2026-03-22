import React from 'react';
import SyncChart from './SyncChart';
import { motion } from 'framer-motion';

export default function AppInsideSection() {
  return (
    <section id="inside" className="py-24 bg-slate-950/50 relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none"></div>

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-center mb-20 uppercase tracking-tighter text-white"
        >
            Ein Blick in die <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Engine</span>
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Sync & Progress */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 font-bold group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
                    </div>
                    <h3 className="font-bold text-lg uppercase tracking-tight text-white">Sync & Progress</h3>
                </div>
                <div className="mb-8 p-4 bg-slate-950/50 rounded-3xl border border-white/5">
                    <SyncChart />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                    Analysiere deinen <strong>Neuro-Resilience Score</strong> und den myofaszialen Status deiner Faszienketten. AXON zeigt dir genau, wo dein Körper "blockiert", bevor du es spürst.
                </p>
            </motion.div>

            {/* Card 2: Agile Rehab */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3-1.09.9-2.2 1.7-3.21z"/></svg>
                    </div>
                    <h3 className="font-bold text-lg uppercase tracking-tight text-emerald-400">Rehabilitation</h3>
                </div>
                <div className="space-y-3 mb-8">
                    <div className="bg-slate-800 p-4 rounded-2xl flex justify-between items-center border-l-4 border-emerald-500 shadow-lg shadow-emerald-900/10">
                        <span className="text-xs font-bold text-white">Phase 1: Release</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wide">Active</span>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 opacity-60 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Phase 2: Load</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                    Verletzungen sind kein Stoppschild. AXON passt deinen Plan dynamisch an den Heilungsverlauf an. Von <strong>Release</strong> (Schmerzfreiheit) zu <strong>Load</strong> (Belastbarkeit).
                </p>
            </motion.div>

            {/* Card 3: Performance */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 hover:border-amber-500/30 transition-all duration-300 group"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    </div>
                    <h3 className="font-bold text-lg uppercase tracking-tight text-amber-400">Performance</h3>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl mb-8 relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>
                    <div className="text-[9px] text-amber-500 font-black uppercase mb-2 tracking-widest">Next Exercise</div>
                    <div className="text-sm font-black leading-tight text-white mb-4">SCHLINGEN-PISTOL SQUAT</div>
                    <div className="flex space-x-4 text-center">
                        <div className="flex-1 border-r border-white/10 pr-4">
                            <div className="text-lg font-black text-white">3</div>
                            <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wide">Sätze</div>
                        </div>
                        <div className="flex-1 pl-1">
                            <div className="text-lg font-black text-white">12</div>
                            <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wide">Reps</div>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                    Egal ob Kraft oder Skill-Mastery. AXON integriert Hardware-Training perfekt mit deiner aktuellen neuronalen Kapazität.
                </p>
            </motion.div>

        </div>
      </div>
    </section>
  );
}