import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, Zap } from 'lucide-react';
import MFRNodeModal from './MFRNodeModal';

export default function MFRNodeDisplay({ nodeId }) {
  const [nodeData, setNodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    const fetchNode = async () => {
      try {
        const { base44 } = await import('@/api/base44Client');
        const nodes = await base44.entities.MFRNode.filter({ node_id: nodeId });
        if (nodes.length > 0) {
          setNodeData(nodes[0]);
        }
      } catch (error) {
        console.error('Error fetching node:', error);
      } finally {
        setLoading(false);
      }
    };

    if (nodeId) {
      fetchNode();
    }
  }, [nodeId]);

  if (loading || !nodeData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-4 bg-slate-800/50 rounded-lg p-4 animate-pulse"
      >
        <div className="h-4 bg-slate-700 rounded w-1/4 mb-3" />
        <div className="h-40 bg-slate-700 rounded mb-3" />
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-cyan-500/20 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-cyan-400">{nodeData.node_id}</span>
            <span className="text-slate-400">•</span>
            <span className="text-white">{nodeData.name_de}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{nodeData.body_area}</p>
        </div>

        {/* Body Map - Anatomical SVG */}
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 aspect-[3/5] border-b border-cyan-500/20 overflow-hidden">
          <svg 
            viewBox="0 0 200 320" 
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="muscleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: nodeData.position === 'front' ? '#06b6d4' : '#a855f7', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: nodeData.position === 'front' ? '#0891b2' : '#7c3aed', stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            
            {nodeData.position === 'front' ? (
              // FRONT - Detailed Anatomy
              <>
                {/* Head */}
                <circle cx="100" cy="35" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400/60" />
                {/* Jaw line */}
                <path d="M 90 45 Q 100 50 110 45" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-400/40" />
                
                {/* Neck muscles */}
                <path d="M 95 50 L 95 65 M 105 50 L 105 65" stroke="currentColor" strokeWidth="1.2" className="text-cyan-400/50" />
                <ellipse cx="100" cy="58" rx="8" ry="12" fill="url(#muscleGrad)" />
                
                {/* Shoulders */}
                <line x1="75" y1="65" x2="125" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400/60" />
                
                {/* Chest & Pecs */}
                <ellipse cx="85" cy="85" rx="12" ry="20" fill="url(#muscleGrad)" />
                <ellipse cx="115" cy="85" rx="12" ry="20" fill="url(#muscleGrad)" />
                <line x1="100" y1="70" x2="100" y2="105" stroke="currentColor" strokeWidth="1" className="text-cyan-400/30" />
                
                {/* Abs */}
                <g className="text-cyan-400/40">
                  <line x1="90" y1="100" x2="110" y2="100" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="88" y1="115" x2="112" y2="115" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="88" y1="130" x2="112" y2="130" stroke="currentColor" strokeWidth="0.8" />
                </g>
                
                {/* Arms */}
                <g className="text-cyan-400/50">
                  <path d="M 75 70 L 55 130" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <ellipse cx="65" cy="100" rx="6" ry="18" fill="url(#muscleGrad)" />
                  <path d="M 125 70 L 145 130" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <ellipse cx="135" cy="100" rx="6" ry="18" fill="url(#muscleGrad)" />
                </g>
                
                {/* Forearms & Hands */}
                <circle cx="55" cy="135" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-cyan-400/50" />
                <circle cx="145" cy="135" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-cyan-400/50" />
                
                {/* Torso outline */}
                <path d="M 80 65 L 75 100 L 78 150 L 100 155 L 122 150 L 125 100 L 120 65" fill="url(#muscleGrad)" />
                
                {/* Abs detail */}
                <line x1="100" y1="85" x2="100" y2="140" stroke="currentColor" strokeWidth="0.7" className="text-cyan-400/30" />
                
                {/* Pelvis */}
                <path d="M 75 150 Q 100 158 125 150" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-cyan-400/50" />
                
                {/* Legs */}
                <g className="text-cyan-400/50">
                  <path d="M 82 155 L 80 250" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <path d="M 118 155 L 120 250" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <ellipse cx="81" cy="200" rx="5" ry="20" fill="url(#muscleGrad)" />
                  <ellipse cx="119" cy="200" rx="5" ry="20" fill="url(#muscleGrad)" />
                </g>
                
                {/* Feet */}
                <circle cx="80" cy="255" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-cyan-400/50" />
                <circle cx="120" cy="255" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-cyan-400/50" />
              </>
            ) : (
              // BACK - Detailed Anatomy
              <>
                {/* Head */}
                <circle cx="100" cy="35" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400/60" />
                
                {/* Neck muscles */}
                <path d="M 95 50 L 95 70 M 105 50 L 105 70" stroke="currentColor" strokeWidth="1.2" className="text-purple-400/50" />
                <ellipse cx="100" cy="60" rx="8" ry="15" fill="url(#muscleGrad)" />
                
                {/* Shoulders & Traps */}
                <ellipse cx="75" cy="75" rx="10" ry="18" fill="url(#muscleGrad)" />
                <ellipse cx="125" cy="75" rx="10" ry="18" fill="url(#muscleGrad)" />
                <path d="M 100 50 L 100 90" stroke="currentColor" strokeWidth="0.8" className="text-purple-400/40" />
                
                {/* Lats */}
                <ellipse cx="70" cy="120" rx="18" ry="35" fill="url(#muscleGrad)" />
                <ellipse cx="130" cy="120" rx="18" ry="35" fill="url(#muscleGrad)" />
                
                {/* Erector spinae (back muscles along spine) */}
                <path d="M 98 75 L 96 150" stroke="currentColor" strokeWidth="1.2" className="text-purple-400/50" />
                <path d="M 102 75 L 104 150" stroke="currentColor" strokeWidth="1.2" className="text-purple-400/50" />
                
                {/* Glutes */}
                <ellipse cx="85" cy="165" rx="14" ry="22" fill="url(#muscleGrad)" />
                <ellipse cx="115" cy="165" rx="14" ry="22" fill="url(#muscleGrad)" />
                
                {/* Arms */}
                <g className="text-purple-400/50">
                  <path d="M 70 80 L 45 140" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <ellipse cx="57" cy="110" rx="6" ry="18" fill="url(#muscleGrad)" />
                  <path d="M 130 80 L 155 140" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <ellipse cx="143" cy="110" rx="6" ry="18" fill="url(#muscleGrad)" />
                </g>
                
                {/* Hands */}
                <circle cx="45" cy="145" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-purple-400/50" />
                <circle cx="155" cy="145" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-purple-400/50" />
                
                {/* Hamstrings */}
                <g className="text-purple-400/50">
                  <path d="M 82 190 L 78 260" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <path d="M 118 190 L 122 260" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <ellipse cx="80" cy="225" rx="5" ry="22" fill="url(#muscleGrad)" />
                  <ellipse cx="120" cy="225" rx="5" ry="22" fill="url(#muscleGrad)" />
                </g>
                
                {/* Calves */}
                <ellipse cx="80" cy="270" rx="4" ry="12" fill="url(#muscleGrad)" />
                <ellipse cx="120" cy="270" rx="4" ry="12" fill="url(#muscleGrad)" />
                
                {/* Feet */}
                <circle cx="78" cy="285" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-purple-400/50" />
                <circle cx="122" cy="285" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-purple-400/50" />
              </>
            )}
          </svg>

          {/* Node highlight marker */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute"
            style={{
              left: `${nodeData.x || 50}%`,
              top: `${nodeData.y || 35}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            {/* Outer pulsing ring */}
            <motion.div
              animate={{
                scale: [1, 1.6, 1],
                opacity: [0.8, 0.3, 0.8]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full border-2.5 ${nodeData.position === 'front' ? 'border-cyan-400' : 'border-purple-400'}`}
              style={{ width: '48px', height: '48px', top: '-24px', left: '-24px' }}
            />
            
            {/* Center bright dot */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className={`w-5 h-5 rounded-full shadow-2xl ${
                nodeData.position === 'front' 
                  ? 'bg-gradient-to-br from-cyan-200 to-cyan-500 shadow-cyan-500/80' 
                  : 'bg-gradient-to-br from-purple-200 to-purple-500 shadow-purple-500/80'
              }`}
            />
            
            {/* Glow aura */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.1, 0.4] 
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full blur-xl ${nodeData.position === 'front' ? 'bg-cyan-400/60' : 'bg-purple-400/60'}`}
              style={{ width: '40px', height: '40px', top: '-20px', left: '-20px' }}
            />
          </motion.div>
          
          <div className="absolute bottom-3 right-3 text-xs text-slate-300/70 bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-700">
            {nodeData.position === 'front' ? '👁️ Vorne' : '👁️ Hinten'}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Target Chain */}
          <div>
            <p className="text-xs uppercase tracking-wider text-cyan-400/70 mb-2">Zielkette</p>
            <p className="text-sm text-slate-200">{nodeData.target_chain}</p>
          </div>

          {/* Compression Time Info */}
          <div className="bg-slate-900/50 rounded-lg p-3 border border-purple-500/20">
            <p className="text-xs text-purple-400 font-semibold mb-1">
              {nodeData.compression_time_max > 90 ? '🔄 TIEFENMUSKEL-MODUS' : '⚡ STANDARD-MODUS'}
            </p>
            <p className="text-sm text-slate-300">
              Kompressionszeit: <span className="font-mono font-bold text-cyan-400">{nodeData.compression_time_max || 90}s</span>
            </p>
            {nodeData.compression_time_max > 90 && (
              <p className="text-xs text-slate-400 mt-2">
                Halte die Kompression konstant. Ab Sekunde 60 beginne mit minimalen Bewegungen.
              </p>
            )}
          </div>

          {/* Pressure Rules */}
          {(nodeData.pressure_rule_burning || nodeData.pressure_rule_depth) && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-orange-400/70">Druck-Regeln</p>
              {nodeData.pressure_rule_burning && (
                <div className="text-xs bg-orange-500/10 border border-orange-500/20 rounded p-2 text-orange-300">
                  <span className="font-semibold">⚠️ Brennen:</span> {nodeData.pressure_rule_burning}
                </div>
              )}
              {nodeData.pressure_rule_depth && (
                <div className="text-xs bg-purple-500/10 border border-purple-500/20 rounded p-2 text-purple-300">
                  <span className="font-semibold">📍 Tiefe:</span> {nodeData.pressure_rule_depth}
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Detaillierte Anleitung öffnen
          </Button>
        </div>
      </motion.div>

      {/* Modal */}
      {showModal && (
        <MFRNodeModal node={nodeData} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}