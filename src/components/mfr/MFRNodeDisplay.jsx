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

        {/* Body Map - Professional Anatomical Images */}
        <div className="relative bg-black aspect-[3/5] border-b border-cyan-500/20 overflow-hidden">
          <img
            src={nodeData.position === 'front' 
              ? 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/2c14e3cdc_image.png'
              : 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/7b154e77f_image.png'
            }
            alt={nodeData.position === 'front' ? 'Front anatomy' : 'Back anatomy'}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'hue-rotate(180deg) saturate(1.2) brightness(0.9)' }}
          />
          
          {/* Teal/Purple overlay for brand consistency */}
          <div className={`absolute inset-0 ${
            nodeData.position === 'front' 
              ? 'bg-gradient-to-b from-cyan-900/30 via-transparent to-slate-950/50'
              : 'bg-gradient-to-b from-purple-900/30 via-transparent to-slate-950/50'
          }`} />

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