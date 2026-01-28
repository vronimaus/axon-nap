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

        {/* Body Map Image - Anatomical */}
        <div className="relative bg-black aspect-[3/5] flex items-center justify-center border-b border-cyan-500/20 overflow-hidden">
          {/* Background anatomical image */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
          
          {nodeData.position === 'front' && (
            <img
              src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=600&fit=crop&q=80"
              alt="Front anatomy"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          {nodeData.position === 'back' && (
            <img
              src="https://images.unsplash.com/photo-1576091160550-112173faf977?w=400&h=600&fit=crop&q=80"
              alt="Back anatomy"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          
          {/* Node highlight marker */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute"
            style={{
              left: `${nodeData.x || 50}%`,
              top: `${nodeData.y || 30}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Outer glow ring */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [1, 0.6, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-cyan-400"
              style={{ width: '32px', height: '32px', top: '-16px', left: '-16px' }}
            />
            
            {/* Center dot */}
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-500/50" />
            
            {/* Secondary glow */}
            <div className="absolute inset-0 rounded-full bg-cyan-400 blur-md opacity-40" style={{ width: '24px', height: '24px', top: '-12px', left: '-12px' }} />
          </motion.div>
          
          <div className="absolute bottom-2 right-2 text-xs text-cyan-400/70 bg-slate-900/90 px-2 py-1 rounded backdrop-blur-sm border border-cyan-500/20">
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