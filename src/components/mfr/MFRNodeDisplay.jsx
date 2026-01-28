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

        {/* Body Map - Anatomical Wireframe */}
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 aspect-[3/5] flex items-center justify-center border-b border-cyan-500/20 overflow-hidden">
          {/* Anatomical Outline */}
          <svg 
            viewBox="0 0 100 160" 
            className="absolute inset-0 w-full h-full opacity-30"
            preserveAspectRatio="xMidYMid meet"
          >
            {nodeData.position === 'front' ? (
              // FRONT body
              <>
                {/* Head */}
                <circle cx="50" cy="15" r="6" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-cyan-400/50" />
                {/* Neck */}
                <line x1="50" y1="21" x2="50" y2="28" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                {/* Chest/Torso */}
                <path d="M 40 28 Q 40 35 38 50 L 62 50 Q 60 35 60 28" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-cyan-400/50" />
                {/* Abs */}
                <line x1="42" y1="45" x2="58" y2="45" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                <line x1="42" y1="52" x2="58" y2="52" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                {/* Arms */}
                <line x1="40" y1="32" x2="28" y2="60" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                <line x1="60" y1="32" x2="72" y2="60" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                {/* Hands */}
                <circle cx="28" cy="62" r="2" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                <circle cx="72" cy="62" r="2" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                {/* Pelvis */}
                <path d="M 38 60 Q 38 70 40 80 L 60 80 Q 62 70 62 60" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-cyan-400/50" />
                {/* Legs */}
                <line x1="40" y1="80" x2="38" y2="155" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                <line x1="60" y1="80" x2="62" y2="155" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                {/* Feet */}
                <circle cx="38" cy="157" r="2" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
                <circle cx="62" cy="157" r="2" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-cyan-400/50" />
              </>
            ) : (
              // BACK body
              <>
                {/* Head */}
                <circle cx="50" cy="15" r="6" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-purple-400/50" />
                {/* Neck */}
                <line x1="50" y1="21" x2="50" y2="28" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                {/* Spine line */}
                <line x1="50" y1="28" x2="50" y2="85" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                {/* Shoulders */}
                <line x1="35" y1="30" x2="65" y2="30" stroke="currentColor" strokeWidth="0.4" className="text-purple-400/50" />
                {/* Back muscles */}
                <path d="M 40 35 Q 35 45 35 60 L 65 60 Q 65 45 60 35" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-purple-400/50" />
                {/* Arms */}
                <line x1="35" y1="32" x2="20" y2="60" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                <line x1="65" y1="32" x2="80" y2="60" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                {/* Hands */}
                <circle cx="20" cy="62" r="2" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                <circle cx="80" cy="62" r="2" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                {/* Glutes */}
                <path d="M 40 65 Q 38 75 40 85 L 60 85 Q 62 75 60 65" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-purple-400/50" />
                {/* Legs */}
                <line x1="40" y1="85" x2="38" y2="155" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                <line x1="60" y1="85" x2="62" y2="155" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                {/* Feet */}
                <circle cx="38" cy="157" r="2" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
                <circle cx="62" cy="157" r="2" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-purple-400/50" />
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
              top: `${nodeData.y || 30}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            {/* Outer pulsing ring */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.4, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 rounded-full border-2 ${nodeData.position === 'front' ? 'border-cyan-400' : 'border-purple-400'}`}
              style={{ width: '40px', height: '40px', top: '-20px', left: '-20px' }}
            />
            
            {/* Center bright dot */}
            <div className={`w-4 h-4 rounded-full shadow-lg ${
              nodeData.position === 'front' 
                ? 'bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-cyan-500/70' 
                : 'bg-gradient-to-br from-purple-300 to-purple-500 shadow-purple-500/70'
            }`} />
            
            {/* Glow aura */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 rounded-full blur-lg ${nodeData.position === 'front' ? 'bg-cyan-400/40' : 'bg-purple-400/40'}`}
              style={{ width: '32px', height: '32px', top: '-16px', left: '-16px' }}
            />
          </motion.div>
          
          <div className="absolute bottom-2 right-2 text-xs text-slate-400/70 bg-slate-900/90 px-2 py-1 rounded backdrop-blur-sm border border-slate-700">
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