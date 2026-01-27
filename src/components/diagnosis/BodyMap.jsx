import React from 'react';
import { motion } from 'framer-motion';
import { SYMPTOM_CLUSTERS } from './SymptomData';

const BodySilhouette = ({ selectedRegion, onRegionClick }) => {
  const regions = [
    { id: 'kopf_nacken', path: 'M100,20 Q110,10 120,20 Q130,30 130,50 Q130,60 120,65 L100,65 Q90,60 90,50 Q90,30 100,20', label: 'Kopf & Nacken' },
    { id: 'schulter_arm', path: 'M70,70 L50,90 L45,130 L55,130 L65,100 L85,75 M135,75 L155,100 L165,130 L175,130 L170,90 L150,70', label: 'Schulter & Arm' },
    { id: 'ruecken_lws', path: 'M85,70 L135,70 L140,120 L130,140 L90,140 L80,120 Z', label: 'Rücken & LWS' },
    { id: 'huefte_becken', path: 'M85,140 L135,140 L145,170 L130,180 L90,180 L75,170 Z', label: 'Hüfte & Becken' },
    { id: 'knie_fuss', path: 'M85,180 L95,230 L90,280 L100,290 L105,280 L100,230 L110,180 M110,180 L120,230 L115,280 L120,290 L130,280 L125,230 L135,180', label: 'Knie & Fuß' }
  ];

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <svg viewBox="0 0 220 310" className="w-full h-auto">
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
      
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
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