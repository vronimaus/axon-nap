import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RotateCcw, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

// SVG Paths for Body Zones
const BODY_PATHS = {
  front: [
    { id: 'N1', name: 'Kopf/Hals', path: 'M135,40 C135,20 165,20 165,40 C165,55 135,55 135,40 Z', cx: 150, cy: 40 },
    { id: 'N2', name: 'Brust/Schulter', path: 'M110,65 Q150,85 190,65 L200,85 Q150,110 100,85 Z', cx: 150, cy: 80 },
    { id: 'N4', name: 'Flanken/Rippen', path: 'M120,95 L110,140 Q130,135 150,140 Q170,135 190,140 L180,95 Q150,110 120,95 Z', cx: 150, cy: 120 },
    { id: 'N5', name: 'Leiste/Bauch', path: 'M130,145 Q150,165 170,145 L165,175 Q150,185 135,175 Z', cx: 150, cy: 160 },
    { id: 'N8', name: 'Oberschenkel (Vorn)', path: 'M130,180 L125,260 Q145,265 175,260 L170,180 Q150,190 130,180 Z', cx: 150, cy: 220 },
    { id: 'N9', name: 'Hüfte Außen', path: 'M110,150 Q100,180 115,210 L125,200 Q115,180 125,150 Z', cx: 110, cy: 180 }, // Left side for demo
    { id: 'N11', name: 'Schienbein', path: 'M130,270 L135,340 Q150,345 165,340 L170,270 Q150,275 130,270 Z', cx: 150, cy: 305 },
  ],
  back: [
    { id: 'N1', name: 'Hinterhaupt', path: 'M135,35 C135,20 165,20 165,35 C165,45 135,45 135,35 Z', cx: 150, cy: 30 },
    { id: 'N3', name: 'Oberer Rücken', path: 'M115,60 L185,60 L175,100 Q150,110 125,100 Z', cx: 150, cy: 80 },
    { id: 'N7', name: 'Lendenbereich', path: 'M130,105 L170,105 L175,135 Q150,140 125,135 Z', cx: 150, cy: 120 },
    { id: 'N6', name: 'Gesäß', path: 'M125,140 Q150,135 175,140 L170,175 Q150,185 130,175 Z', cx: 150, cy: 155 },
    { id: 'N10', name: 'Oberschenkel (Hinten)', path: 'M130,180 L135,250 Q150,255 165,250 L170,180 Q150,190 130,180 Z', cx: 150, cy: 215 },
    { id: 'N12', name: 'Ferse/Fußsohle', path: 'M140,350 L140,370 Q150,375 160,370 L160,350 Q150,345 140,350 Z', cx: 150, cy: 360 },
  ]
};

// Silhouette Paths (Simplified for aesthetic background)
const SILHOUETTE = {
  front: "M150,10 Q180,10 180,40 L195,55 L210,60 L210,130 L190,160 L195,260 L185,280 L185,350 L195,370 L165,370 L160,280 L165,260 L160,180 L150,170 L140,180 L135,260 L140,280 L135,370 L105,370 L115,350 L115,280 L105,260 L110,160 L90,130 L90,60 L105,55 L120,40 Q120,10 150,10 Z",
  back: "M150,10 Q180,10 180,40 L200,55 L215,60 L210,130 L190,160 L195,260 L185,280 L185,350 L195,370 L165,370 L160,280 L165,260 L160,180 L150,170 L140,180 L135,260 L140,280 L135,370 L105,370 L115,350 L115,280 L105,260 L110,160 L90,130 L85,60 L100,55 L120,40 Q120,10 150,10 Z"
};

export default function MFRBodyMap({ position: initialPosition = 'front', selectedNode = null, onNodeSelect = () => {}, completedNodes = [] }) {
  const [position, setPosition] = useState(initialPosition);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Sync internal state if prop changes, but allow manual toggle
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const togglePosition = () => {
    setPosition(prev => prev === 'front' ? 'back' : 'front');
  };

  const activePaths = BODY_PATHS[position] || [];

  return (
    <div className="flex flex-col items-center">
      {/* View Toggle */}
      <div className="flex justify-end w-full max-w-xs mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={togglePosition}
          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-xs">{position === 'front' ? 'Rückseite' : 'Vorderseite'}</span>
        </Button>
      </div>

      {/* SVG Container */}
      <div className="relative w-full max-w-[300px] aspect-[1/2] select-none">
        <svg 
          viewBox="0 0 300 600" 
          className="w-full h-full drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.15))' }}
        >
          {/* Defs for gradients/filters */}
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Base Silhouette (The "Ghost Layer") */}
          <path 
            d={SILHOUETTE[position]} 
            fill="url(#bodyGradient)" 
            stroke="#475569" 
            strokeWidth="2"
            opacity="0.6"
          />

          {/* 2. Interactive Zones */}
          {activePaths.map((zone) => {
            const isSelected = selectedNode?.node_id === zone.id;
            const isHovered = hoveredNode === zone.id;
            const isCompleted = completedNodes.includes(zone.id);

            // Dynamic Styling
            let fill = "transparent";
            let stroke = "transparent";
            let opacity = 0;

            if (isSelected) {
              fill = "rgba(6, 182, 212, 0.4)"; // Cyan highlight
              stroke = "#22d3ee";
              opacity = 1;
            } else if (isHovered) {
              fill = "rgba(6, 182, 212, 0.2)";
              stroke = "#06b6d4";
              opacity = 1;
            } else if (isCompleted) {
              fill = "rgba(34, 197, 94, 0.2)"; // Green
              stroke = "#22c55e";
              opacity = 0.8;
            }

            return (
              <g 
                key={zone.id}
                onClick={() => onNodeSelect({ node_id: zone.id, name_de: zone.name })}
                onMouseEnter={() => setHoveredNode(zone.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-all duration-300"
              >
                {/* Hit Area (Invisible but clickable) */}
                <path 
                  d={zone.path} 
                  fill={fill} 
                  stroke={stroke}
                  strokeWidth={isSelected ? 3 : 1}
                  className="transition-all duration-300 ease-out"
                />

                {/* Node Label/Indicator (Only when active) */}
                <AnimatePresence>
                  {(isSelected || isHovered || isCompleted) && (
                    <motion.g
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <circle cx={zone.cx} cy={zone.cy} r="4" fill={isCompleted ? "#22c55e" : "#22d3ee"} />
                      <circle cx={zone.cx} cy={zone.cy} r="8" stroke={isCompleted ? "#22c55e" : "#22d3ee"} strokeWidth="1" opacity="0.5" />
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>

        {/* Floating Label for Hovered Item */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute pointer-events-none px-3 py-1.5 bg-slate-900/90 border border-cyan-500/30 rounded-lg backdrop-blur-md shadow-xl z-50"
              style={{ 
                left: '50%', 
                top: '10%', // Simple positioning
                transform: 'translateX(-50%)' 
              }}
            >
              <span className="text-xs font-bold text-cyan-400">
                {activePaths.find(p => p.id === hoveredNode)?.name}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Node Details Panel */}
      <AnimatePresence mode="wait">
        {selectedNode && (
          <motion.div
            key={selectedNode.node_id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mt-4"
          >
            <div className="glass-cyan rounded-xl p-4 border border-cyan-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ZoomIn className="w-12 h-12 text-cyan-400" />
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
                  <span className="text-xs font-bold text-cyan-300">{selectedNode.node_id}</span>
                </div>
                <h3 className="font-bold text-lg text-white">
                  {selectedNode.name_de || activePaths.find(p => p.id === selectedNode.node_id)?.name}
                </h3>
              </div>
              
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between border-b border-cyan-500/10 pb-2">
                  <span>Zone:</span>
                  <span className="text-cyan-400">{activePaths.find(p => p.id === selectedNode.node_id)?.name}</span>
                </div>
                {selectedNode.target_chain && (
                  <div className="flex justify-between">
                    <span>Target Chain:</span>
                    <span className="text-purple-400 font-mono text-xs">{selectedNode.target_chain}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}