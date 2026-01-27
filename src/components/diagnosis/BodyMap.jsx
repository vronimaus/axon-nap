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
    { id: 'beine', path: 'M98,165 L110,210 M110,165 L122,210', label: 'Oberschenkel' },
    { id: 'knie', path: 'M96,210 L104,225 M116,210 L124,225', label: 'Knie' },
    { id: 'fuss', path: 'M92,225 L98,260 L92,275 L100,280 L108,275 L102,260 L108,225 M112,225 L118,260 L112,275 L120,280 L128,275 L122,260 L128,225', label: 'Fuß & Sprunggelenk' },
    { id: 'systemisch', path: 'M85,285 L135,285 L130,295 L90,295 Z', label: 'Systemisch' }
  ];

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <svg viewBox="0 0 220 300" className="w-full h-auto">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
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
            fill={selectedRegion === region.id ? '#3b82f6' : 'url(#bodyGradient)'}
            stroke={selectedRegion === region.id ? '#1d4ed8' : '#94a3b8'}
            strokeWidth={selectedRegion === region.id ? 2.5 : 1.5}
            className="cursor-pointer transition-all duration-200"
            onClick={() => onRegionClick(region.id)}
            whileHover={{ 
              fill: selectedRegion === region.id ? '#2563eb' : '#dbeafe',
              scale: 1.02,
              filter: 'url(#glow)'
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: regions.indexOf(region) * 0.1 }}
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
              className="absolute left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap"
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
      
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 w-full max-w-3xl">
        {Object.entries(SYMPTOM_CLUSTERS).map(([key, cluster]) => (
          <motion.button
            key={key}
            onClick={() => onRegionSelect(key)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedRegion === key 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {cluster.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}