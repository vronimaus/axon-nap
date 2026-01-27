import React from 'react';
import { motion } from 'framer-motion';
import { SYMPTOM_CLUSTERS } from './SymptomData';

const BodySilhouette = ({ selectedRegion, onRegionClick }) => {
  const regions = [
    { id: 'kopf_kiefer', path: 'M100,15 Q108,8 116,15 Q122,22 122,35 Q122,42 116,45 L104,45 Q98,42 98,35 Q98,22 100,15', label: 'Kopf & Kiefer' },
    { id: 'hals_nacken', path: 'M102,45 L118,45 L116,60 L104,60 Z', label: 'Hals & Nacken' },
    { id: 'schulter_arm', path: 'M75,65 L55,80 L50,110 L58,110 L68,85 L85,70 M135,70 L152,85 L162,110 L170,110 L165,80 L145,65', label: 'Schulter & Arm' },
    { id: 'ruecken', path: 'M87,65 L133,65 L132,85 L88,85 Z', label: 'Rücken (BWS)' },
    { id: 'rumpf', path: 'M88,85 L132,85 L128,105 L92,105 Z', label: 'Rumpf & Rippen' },
    { id: 'lws', path: 'M92,105 L128,105 L125,130 L95,130 Z', label: 'LWS & Kreuzbein' },
    { id: 'huefte', path: 'M95,130 L125,130 L130,155 L118,165 L102,165 L90,155 Z', label: 'Hüfte & Becken' },
    { id: 'beine', path: 'M98,165 L108,210 L114,210 L122,165 L118,165 L110,200 L102,165 Z', label: 'Oberschenkel' },
    { id: 'knie', path: 'M106,210 L104,225 L108,228 L112,228 L116,225 L114,210 Z', label: 'Knie' },
    { id: 'fuss', path: 'M102,228 L98,260 L94,270 L96,278 L110,280 L112,272 L108,260 L106,228 Z M114,228 L118,260 L114,272 L116,280 L124,278 L126,270 L122,260 L118,228 Z', label: 'Fuß & Sprunggelenk' },
    { id: 'systemisch', path: 'M85,285 L135,285 L130,295 L90,295 Z', label: 'Systemisch' }
  ];

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <svg viewBox="0 0 220 300" className="w-full h-auto">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="bodyGradientActive" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {regions.map((region) => (
          <motion.path
            key={region.id}
            d={region.path}
            fill={selectedRegion === region.id ? 'url(#bodyGradientActive)' : 'url(#bodyGradient)'}
            stroke={selectedRegion === region.id ? '#06b6d4' : '#475569'}
            strokeWidth={selectedRegion === region.id ? 3 : 1.5}
            className="cursor-pointer transition-all duration-300"
            onClick={() => onRegionClick(region.id)}
            whileHover={{ 
              fill: selectedRegion === region.id ? 'url(#bodyGradientActive)' : '#1e293b',
              stroke: '#06b6d4',
              strokeWidth: 2,
              filter: 'url(#glow)'
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: regions.indexOf(region) * 0.05 }}
          />
        ))}
      </svg>
      
      {/* Hover Labels */}
      <div className="absolute inset-0 pointer-events-none">
        {regions.map((region) => (
          selectedRegion === region.id && (
            <motion.div
              key={`label-${region.id}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-900 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold shadow-lg shadow-cyan-500/50"
              style={{ 
                top: region.id === 'kopf_nacken' ? '2%' : 
                     region.id === 'schulter_arm' ? '22%' :
                     region.id === 'ruecken_lws' ? '38%' :
                     region.id === 'huefte_becken' ? '52%' : '78%'
              }}
            >
              {region.label}
            </motion.div>
          )
        ))}
      </div>
    </div>
  );
};

export default function BodyMap({ selectedRegion, onRegionSelect }) {
  return (
    <div className="flex flex-col items-center">
      <BodySilhouette 
        selectedRegion={selectedRegion} 
        onRegionClick={onRegionSelect} 
      />
      
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-3xl">
        {Object.entries(SYMPTOM_CLUSTERS).map(([key, cluster]) => (
          <motion.button
            key={key}
            onClick={() => onRegionSelect(key)}
            className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all touch-target ${
              selectedRegion === key 
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 shadow-lg shadow-cyan-500/30 neuro-glow' 
                : 'glass text-slate-300 border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {cluster.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}