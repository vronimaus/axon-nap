import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Simplified node map for quick pain location selection
const NODES = [
  { id: 'N1', name: 'Kopf/Stirn', x: 50, y: 5 },
  { id: 'N2', name: 'Nacken', x: 50, y: 12 },
  { id: 'N3', name: 'Schulter', x: 35, y: 18 },
  { id: 'N4', name: 'Schulter rechts', x: 65, y: 18 },
  { id: 'N5', name: 'Oberarm', x: 30, y: 28 },
  { id: 'N6', name: 'Oberarm rechts', x: 70, y: 28 },
  { id: 'N7', name: 'Ellenbogen', x: 25, y: 35 },
  { id: 'N8', name: 'Ellenbogen rechts', x: 75, y: 35 },
  { id: 'N9', name: 'Brust/Bauch', x: 50, y: 40 },
  { id: 'N10', name: 'Unterer Rücken', x: 50, y: 50 },
  { id: 'N11', name: 'Oberschenkel', x: 50, y: 65 },
  { id: 'N12', name: 'Knie', x: 50, y: 75 },
  { id: 'N13', name: 'Wade/Knöchel', x: 50, y: 85 }
];

export default function MiniBodyMap({ onNodeSelect }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);

  const handleNodeClick = (nodeId) => {
    setSelectedNode(nodeId);
    onNodeSelect(nodeId);
  };

  return (
    <div className="space-y-3">
      <div 
        ref={containerRef}
        className="relative w-full bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden"
        style={{ aspectRatio: '1/1.5' }}
      >
        {/* Simplified Body Silhouette */}
        <svg className="w-full h-full" viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet">
          {/* Head */}
          <circle cx="50" cy="10" r="6" fill="rgba(148, 163, 184, 0.2)" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.5" />
          
          {/* Neck */}
          <line x1="50" y1="16" x2="50" y2="22" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="2" />
          
          {/* Shoulders & Torso */}
          <ellipse cx="50" cy="35" rx="18" ry="22" fill="rgba(148, 163, 184, 0.15)" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.5" />
          
          {/* Arms */}
          <line x1="32" y1="28" x2="15" y2="45" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="2" />
          <line x1="68" y1="28" x2="85" y2="45" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="2" />
          
          {/* Pelvis & Legs */}
          <ellipse cx="50" cy="65" rx="14" ry="16" fill="rgba(148, 163, 184, 0.15)" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.5" />
          
          {/* Thighs */}
          <line x1="42" y1="80" x2="38" y2="105" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="2.5" />
          <line x1="58" y1="80" x2="62" y2="105" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="2.5" />
          
          {/* Lower Legs */}
          <line x1="38" y1="105" x2="36" y2="140" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="2" />
          <line x1="62" y1="105" x2="64" y2="140" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="2" />
        </svg>

        {/* Interactive Nodes */}
        {NODES.map((node) => (
          <motion.button
            key={node.id}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNodeClick(node.id)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
              selectedNode === node.id
                ? 'w-6 h-6 bg-red-500 shadow-lg shadow-red-500/50 ring-2 ring-red-400'
                : 'w-4 h-4 bg-slate-500/40 hover:bg-slate-400/60 hover:shadow-lg hover:shadow-cyan-400/30'
            }`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`
            }}
            title={node.name}
          />
        ))}
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center"
        >
          <p className="text-sm font-semibold text-red-400">
            {NODES.find(n => n.id === selectedNode)?.name}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Bestätigt – Nächster Schritt: Schmerzintensität
          </p>
        </motion.div>
      )}
    </div>
  );
}