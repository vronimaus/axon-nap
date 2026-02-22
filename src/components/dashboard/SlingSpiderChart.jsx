import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * AXON Sling-Balance Spider Chart
 * Visualizes the 3-sling balance as an interactive triangle HUD
 */
export default function SlingSpiderChart({ 
  anterior, 
  posterior, 
  lateral,
  alerts = [],
  onSlingClick = null 
}) {
  const [activeNode, setActiveNode] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Normalize scores to 0-10 scale for triangle sizing
  const normalizeSling = (score) => Math.min(10, Math.max(0, score || 0));
  const antNorm = normalizeSling(anterior) / 10; // 0-1
  const postNorm = normalizeSling(posterior) / 10;
  const latNorm = normalizeSling(lateral) / 10;

  // Triangle vertices (equilateral triangle centered in SVG)
  const size = 280;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 100;

  // Equilateral triangle vertices (120° apart)
  const antVertex = {
    x: centerX,
    y: centerY - radius,
    label: 'Anterior',
    color: '#3b82f6',
    value: anterior
  };
  const postVertex = {
    x: centerX + (radius * Math.sin(Math.PI / 3)),
    y: centerY + (radius * Math.cos(Math.PI / 3)),
    label: 'Posterior',
    color: '#10b981',
    value: posterior
  };
  const latVertex = {
    x: centerX - (radius * Math.sin(Math.PI / 3)),
    y: centerY + (radius * Math.cos(Math.PI / 3)),
    label: 'Lateral',
    color: '#8b5cf6',
    value: lateral
  };

  // Calculate the center point of the triangle based on sling values
  // This creates a point inside the triangle showing the "balance state"
  const calcCenterPoint = () => {
    const factor = 0.6; // How far inward from vertices
    return {
      x: (antVertex.x * antNorm + postVertex.x * postNorm + latVertex.x * latNorm) / 
         (antNorm + postNorm + latNorm || 1),
      y: (antVertex.y * antNorm + postVertex.y * postNorm + latVertex.y * latNorm) / 
         (antNorm + postNorm + latNorm || 1)
    };
  };

  const centerPoint = calcCenterPoint();

  // Determine overall status
  const imbalanceAlert = alerts.find(a => a.type === 'critical_imbalance' || a.type === 'moderate_imbalance');
  const statusColor = imbalanceAlert?.severity === 'critical' ? '#ef4444' : 
                      imbalanceAlert?.severity === 'warning' ? '#f97316' : '#10b981';

  return (
    <Card className="glass rounded-2xl border border-cyan-500/20 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-cyan-400">Sling Balance</h3>
            <p className="text-xs text-slate-400 mt-1">Deine 3-teilige Ketten-Harmonie</p>
          </div>
          {imbalanceAlert && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400 font-medium">
                {imbalanceAlert.severity === 'critical' ? 'Kritisch' : 'Warnung'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Spider Chart SVG */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center py-6"
        >
          <svg width={size} height={size} className="drop-shadow-lg">
            {/* Background grid triangles */}
            <defs>
              <linearGradient id="antGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="postGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="latGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Outer triangle (max values) */}
            <polygon
              points={`${antVertex.x},${antVertex.y} ${postVertex.x},${postVertex.y} ${latVertex.x},${latVertex.y}`}
              fill="none"
              stroke="rgba(100, 150, 200, 0.3)"
              strokeWidth="1"
              strokeDasharray="5,5"
            />

            {/* Concentric rings (readability) */}
            {[0.25, 0.5, 0.75].map((scale) => (
              <polygon
                key={`ring-${scale}`}
                points={`${centerX + (antVertex.x - centerX) * scale},${centerY + (antVertex.y - centerY) * scale} 
                         ${centerX + (postVertex.x - centerX) * scale},${centerY + (postVertex.y - centerY) * scale} 
                         ${centerX + (latVertex.x - centerX) * scale},${centerY + (latVertex.y - centerY) * scale}`}
                fill="none"
                stroke="rgba(100, 150, 200, 0.15)"
                strokeWidth="1"
              />
            ))}

            {/* Inner triangle (current values) filled */}
            <polygon
              points={`${centerX + (antVertex.x - centerX) * antNorm},${centerY + (antVertex.y - centerY) * antNorm} 
                       ${centerX + (postVertex.x - centerX) * postNorm},${centerY + (postVertex.y - centerY) * postNorm} 
                       ${centerX + (latVertex.x - centerX) * latNorm},${centerY + (latVertex.y - centerY) * latNorm}`}
              fill={statusColor}
              fillOpacity="0.15"
              stroke={statusColor}
              strokeWidth="2"
            />

            {/* Vertices (clickable) */}
            {[antVertex, postVertex, latVertex].map((vertex, idx) => (
              <g key={`vertex-${vertex.label}`}>
                {/* Vertex circle */}
                <motion.circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r="8"
                  fill={vertex.color}
                  fillOpacity="0.8"
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: onSlingClick ? 'pointer' : 'default' }}
                  whileHover={onSlingClick ? { r: 12, fillOpacity: 1 } : {}}
                  onClick={() => {
                    if (onSlingClick) {
                      onSlingClick(vertex.label.toLowerCase());
                      setActiveNode(vertex.label);
                    }
                  }}
                />
                {/* Label */}
                <text
                  x={vertex.x}
                  y={vertex.y - 25}
                  textAnchor="middle"
                  fill={vertex.color}
                  fontSize="12"
                  fontWeight="600"
                  className="select-none"
                >
                  {vertex.label}
                </text>
                {/* Value */}
                <text
                  x={vertex.x}
                  y={vertex.y + 35}
                  textAnchor="middle"
                  fill={vertex.color}
                  fontSize="14"
                  fontWeight="bold"
                  className="select-none"
                >
                  {vertex.value.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Center point (balance indicator) */}
            <motion.circle
              cx={centerPoint.x}
              cy={centerPoint.y}
              r="6"
              fill="#06b6d4"
              fillOpacity="0.6"
              stroke="#06b6d4"
              strokeWidth="2"
              animate={{
                r: [6, 8, 6],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </motion.div>

        {/* Sling Details */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Anterior', value: anterior, color: 'blue', unit: '/10' },
            { label: 'Posterior', value: posterior, color: 'emerald', unit: '/10' },
            { label: 'Lateral', value: lateral, color: 'purple', unit: '/10' }
          ].map((sling) => (
            <motion.div
              key={sling.label}
              whileHover={{ y: -2 }}
              onClick={() => {
                setActiveNode(sling.label);
                setShowDetails(true);
              }}
              className={`rounded-lg p-3 cursor-pointer transition-all ${
                activeNode === sling.label
                  ? 'bg-slate-700/50 border border-cyan-400/50'
                  : 'bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/30'
              }`}
            >
              <p className={`text-xs font-medium ${
                sling.color === 'blue' ? 'text-blue-400' :
                sling.color === 'emerald' ? 'text-emerald-400' : 'text-purple-400'
              }`}>
                {sling.label}
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {sling.value.toFixed(1)}
                <span className="text-xs text-slate-400 ml-1">{sling.unit}</span>
              </p>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(sling.value / 10) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-full ${
                    sling.color === 'blue' ? 'bg-blue-500' :
                    sling.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Alert Message */}
        {imbalanceAlert && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-3 text-sm ${
              imbalanceAlert.severity === 'critical'
                ? 'bg-red-500/10 border border-red-500/30 text-red-200'
                : 'bg-orange-500/10 border border-orange-500/30 text-orange-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{imbalanceAlert.message}</p>
                {imbalanceAlert.coaching_instruction && (
                  <p className="text-xs mt-1 opacity-80">{imbalanceAlert.coaching_instruction}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Adaptive Session Starten
          </div>
        </motion.button>
      </div>
    </Card>
  );
}