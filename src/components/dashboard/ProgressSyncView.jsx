import React from 'react';
import { motion } from 'framer-motion';
import { X, Brain, Activity, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export default function ProgressSyncView({ dashboardData, sessionDecision, onClose }) {
  const mcs = dashboardData?.mcs || sessionDecision?.mcs || 0;
  const history = dashboardData?.historical_data || [];
  const nodes = dashboardData?.heatmap_nodes || [];

  const NODE_NAMES = {
    N1: "Kopf & Nacken",
    N2: "Brust & Schulter",
    N3: "Oberer Rücken",
    N4: "Arme & Ellbogen",
    N5: "Rippen & Flanke",
    N6: "Bauchraum",
    N7: "Lendenwirbel",
    N8: "Hüfte & Becken",
    N9: "Gesäß",
    N10: "Oberschenkel",
    N11: "Knie & Schienbein",
    N12: "Wade & Fuß"
  };

  const getStatusColor = (status) => {
    if (status === 'green') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (status === 'yellow') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (status === 'orange') return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass rounded-2xl border border-cyan-500/30 p-4 sm:p-6 w-full relative z-20 shadow-2xl overflow-hidden bg-slate-900/90"
    >
      <div className="absolute top-4 right-4 z-30">
        <button onClick={onClose} className="p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center mb-6 sm:mb-8 relative flex flex-col items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">Fortschritt & Sync</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Deep Data Analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Neuro-Resilience Score */}
        <div className="glass rounded-xl border border-slate-700 p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />
           <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mb-3 sm:mb-4" />
           <h3 className="text-xs sm:text-sm text-slate-400 mb-2 z-10">Neuro-Resilience Score</h3>
           <div className="relative z-10">
             <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
               <circle cx="50%" cy="50%" r="42%" className="stroke-slate-800" strokeWidth="8" fill="none" />
               <circle 
                 cx="50%" cy="50%" r="42%" 
                 className="stroke-cyan-400 transition-all duration-1000 ease-out" 
                 strokeWidth="8" fill="none" 
                 strokeDasharray="264" 
                 strokeDashoffset={264 - (264 * mcs) / 100} 
                 strokeLinecap="round"
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-2xl sm:text-3xl font-bold text-white">{mcs}%</span>
               <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-cyan-400 font-bold mt-0.5 sm:mt-1">
                 {mcs >= 80 ? 'Stabil' : mcs >= 40 ? 'Flow' : 'Recovery'}
               </span>
             </div>
           </div>
        </div>

        {/* Heatmap (Stecco-Status) */}
        <div className="glass rounded-xl border border-slate-700 p-4 sm:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <h3 className="text-xs sm:text-sm text-slate-300 font-medium">Körper-Heatmap (Stecco-Status)</h3>
          </div>
          {nodes.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-grow">
                {nodes.map(node => (
                  <div key={node.node_id} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${getStatusColor(node.status)} text-center`}>
                    <span className="text-[10px] sm:text-xs font-bold leading-tight mb-0.5">{NODE_NAMES[node.node_id] || node.node_id}</span>
                    <div className="flex items-center gap-1 opacity-80">
                      <span className="text-[8px] font-mono">{node.node_id}</span>
                      <span className="text-[8px]">•</span>
                      <span className="text-[8px] uppercase tracking-wider">{node.sling.substring(0,3)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Actionable Insight Box */}
              {nodes.some(n => n.status === 'red' || n.status === 'orange') ? (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-200">
                  <span className="font-bold text-red-400 block mb-1">System-Hinweis:</span>
                  Erhöhte Gewebespannung erkannt. AXON berücksichtigt diese Zonen automatisch in deinem nächsten Trainingsplan. Eine <strong className="text-white">FLOW-Routine</strong> hilft zusätzlich, das System zu lockern.
                </div>
              ) : nodes.some(n => n.status === 'yellow') ? (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200">
                  <span className="font-bold text-yellow-400 block mb-1">Empfehlung:</span>
                  Leichte Verspannungen vorhanden. Eine <strong className="text-white">FLOW-Routine</strong> hilft dir heute, dein System wieder optimal geschmeidig zu machen.
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                  <span className="font-bold text-emerald-400 block mb-1">System Check:</span>
                  Dein Körper ist im optimalen Zustand! Du bist perfekt vorbereitet für <strong className="text-white">PERFORMANCE-Training</strong>.
                </div>
              )}
            </>
          ) : (
             <div className="flex flex-col h-24 sm:h-32 items-center justify-center gap-2 text-center">
               <span className="text-2xl">🧬</span>
               <p className="text-xs text-slate-500">Noch keine Rehab-Daten vorhanden.</p>
               <p className="text-[10px] text-slate-600">Starte eine Diagnose oder absolviere deinen ersten Rehab-Plan.</p>
             </div>
          )}
        </div>

        {/* Sync-History */}
        <div className="glass rounded-xl border border-slate-700 p-4 sm:p-6 md:col-span-2">
          <div className="flex flex-col mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <h3 className="text-xs sm:text-sm text-slate-300 font-medium">Sync-History (letzte 30 Tage)</h3>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 pl-6 sm:pl-7">
              Zeigt das Zusammenspiel von Körper, Fokus und Energie. Hohe Werte = Peak Performance, niedrige = Recovery-Bedarf.
            </p>
          </div>
          <div className="h-40 sm:h-48 w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <defs>
                    <linearGradient id="colorSync" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#22d3ee' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overall_readiness" 
                    name="Sync Score"
                    stroke="url(#colorSync)" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#1e293b', stroke: '#22d3ee', strokeWidth: 2 }} 
                    activeDot={{ r: 5, fill: '#22d3ee' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col h-full items-center justify-center gap-2 text-center">
                <span className="text-2xl">📊</span>
                <p className="text-xs text-slate-500">Noch keine Verlaufsdaten vorhanden.</p>
                <p className="text-[10px] text-slate-600">Starte deinen ersten Bio-Sync, um die Kurve zu aktivieren.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}