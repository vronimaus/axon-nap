import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MFRBodyMap({ position = 'back', selectedNode = null, onNodeSelect = () => {}, completedNodes = [] }) {
  const { data: mfrNodes = [] } = useQuery({
    queryKey: ['mfrNodes', position],
    queryFn: async () => {
      const all = await base44.entities.MFRNode.list();
      return all.filter(node => node.position === position).sort((a, b) => a.order - b.order);
    }
  });

  const bodyImages = {
    front: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/801f10b7d_generated_image.png',
    back: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/1431ba1dd_generated_image.png'
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Body Image */}
      <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-900">
        <img 
          src={bodyImages[position]}
          alt={`Body ${position}`}
          className="w-full h-auto"
        />
        
        {/* MFR Nodes */}
        <div className="absolute inset-0">
          {mfrNodes.map((node) => (
            <motion.button
              key={node.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => onNodeSelect(node)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${
                selectedNode?.id === node.id ? 'z-20' : 'z-10'
              }`}
            >
              {/* Outer Glow Ring */}
              <div className={`absolute -inset-4 rounded-full border-2 transition-all ${
                completedNodes.includes(node.node_id)
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-cyan-500 bg-cyan-500/10'
              } ${selectedNode?.id === node.id ? 'ring-2 ring-purple-500 scale-125' : ''}`} />
              
              {/* Center Dot */}
              <div className={`w-4 h-4 rounded-full transition-all ${
                completedNodes.includes(node.node_id)
                  ? 'bg-green-500 shadow-lg shadow-green-500/50'
                  : 'bg-cyan-400 shadow-lg shadow-cyan-500/50'
              }`} />
              
              {/* Label */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-cyan-300 bg-slate-900/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {node.node_id}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Node Info */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-cyan-500/30"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-cyan-400">{selectedNode.node_id}</h3>
              <p className="text-sm text-slate-300">{selectedNode.name_de}</p>
              <p className="text-xs text-slate-400 mt-1">→ {selectedNode.target_chain}</p>
            </div>
            {completedNodes.includes(selectedNode.node_id) && (
              <div className="text-2xl">✓</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}