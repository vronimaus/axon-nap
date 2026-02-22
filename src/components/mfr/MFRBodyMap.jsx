import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Original Images
const BODY_IMAGES = {
  front: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/801f10b7d_generated_image.png',
  back: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/1431ba1dd_generated_image.png'
};

// Ghost Layer Paths (Zones)
// Coordinates aligned to 300x600 viewbox matching the image aspect ratio
const BODY_PATHS = {
  front: [
    { id: 'N1', name: 'Kopf/Hals', path: 'M130,20 C130,5 170,5 170,20 C170,45 130,45 130,20 Z', cx: 150, cy: 30 },
    { id: 'N2', name: 'Brust/Schulter', path: 'M100,55 Q150,85 200,55 L210,85 Q150,120 90,85 Z', cx: 150, cy: 80 },
    { id: 'N4', name: 'Flanken/Rippen', path: 'M110,95 L100,150 Q120,145 150,150 Q180,145 200,150 L190,95 Q150,110 110,95 Z', cx: 150, cy: 125 },
    { id: 'N5', name: 'Leiste/Bauch', path: 'M120,155 Q150,175 180,155 L175,190 Q150,200 125,190 Z', cx: 150, cy: 175 },
    { id: 'N8', name: 'Oberschenkel (Vorn)', path: 'M120,200 L115,300 Q150,310 185,300 L180,200 Q150,210 120,200 Z', cx: 150, cy: 250 },
    { id: 'N9', name: 'Hüfte Außen', path: 'M95,160 Q85,190 100,220 L110,210 Q100,190 110,160 Z', cx: 100, cy: 190 }, 
    { id: 'N11', name: 'Schienbein', path: 'M125,320 L130,420 Q150,430 170,420 L175,320 Q150,325 125,320 Z', cx: 150, cy: 370 },
  ],
  back: [
    { id: 'N1', name: 'Hinterhaupt', path: 'M130,20 C130,5 170,5 170,20 C170,40 130,40 130,20 Z', cx: 150, cy: 25 },
    { id: 'N3', name: 'Oberer Rücken', path: 'M105,50 L195,50 L185,100 Q150,110 115,100 Z', cx: 150, cy: 75 },
    { id: 'N7', name: 'Lendenbereich', path: 'M120,105 L180,105 L185,145 Q150,155 115,145 Z', cx: 150, cy: 125 },
    { id: 'N6', name: 'Gesäß', path: 'M115,150 Q150,145 185,150 L180,195 Q150,205 120,195 Z', cx: 150, cy: 175 },
    { id: 'N10', name: 'Oberschenkel (Hinten)', path: 'M120,200 L125,290 Q150,300 175,290 L180,200 Q150,210 120,200 Z', cx: 150, cy: 245 },
    { id: 'N12', name: 'Ferse/Fußsohle', path: 'M130,440 L130,470 Q150,480 170,470 L170,440 Q150,430 130,440 Z', cx: 150, cy: 455 },
  ]
};

export default function MFRBodyMap({ position: initialPosition = 'front', selectedNode = null, onNodeSelect = () => {}, completedNodes = [] }) {
  const [position, setPosition] = useState(initialPosition);
  const [hoveredNode, setHoveredNode] = useState(null);

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

      {/* Container with Image + Ghost Layer Overlay */}
      <div className="relative w-full max-w-[300px] aspect-[1/2] select-none rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
        
        {/* 1. Base Image */}
        <img 
          src={BODY_IMAGES[position]} 
          alt={`Body ${position}`}
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-90"
        />

        {/* 2. Interactive SVG Overlay (Ghost Layer) */}
        <svg 
          viewBox="0 0 300 600" 
          className="absolute inset-0 w-full h-full z-10"
        >
          <defs>
             <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {activePaths.map((zone) => {
            const isSelected = selectedNode?.node_id === zone.id;
            const isHovered = hoveredNode === zone.id;
            const isCompleted = completedNodes.includes(zone.id);

            // Styling Logic
            let fill = "transparent";
            let stroke = "transparent";
            let strokeWidth = 0;

            if (isSelected) {
              fill = "rgba(6, 182, 212, 0.4)"; // Cyan active
              stroke = "#22d3ee";
              strokeWidth = 2;
            } else if (isHovered) {
              fill = "rgba(6, 182, 212, 0.2)"; // Cyan hover
              stroke = "rgba(6, 182, 212, 0.5)";
              strokeWidth = 1;
            } else if (isCompleted) {
              fill = "rgba(34, 197, 94, 0.3)"; // Green done
              stroke = "#22c55e";
              strokeWidth = 1;
            }

            return (
              <g 
                key={zone.id}
                onClick={() => onNodeSelect({ node_id: zone.id, name_de: zone.name })}
                onMouseEnter={() => setHoveredNode(zone.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* Visual Path */}
                <path 
                  d={zone.path} 
                  fill={fill} 
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-200"
                  style={{ filter: isSelected ? 'url(#glow-selected)' : 'none' }}
                />

                {/* Marker Dots */}
                <AnimatePresence>
                  {(isSelected || isHovered || isCompleted) && (
                    <motion.g
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <circle 
                        cx={zone.cx} 
                        cy={zone.cy} 
                        r={isSelected ? 6 : 4} 
                        fill={isCompleted ? "#22c55e" : "#22d3ee"} 
                        className="shadow-lg"
                      />
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>

        {/* Hover Label */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-50 pointer-events-none px-3 py-1.5 bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-xl"
              style={{ 
                left: '50%', 
                top: '10%',
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