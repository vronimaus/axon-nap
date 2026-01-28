import React from 'react';
import { motion } from 'framer-motion';
import { SYMPTOM_CLUSTERS } from './SymptomData';

const BodySilhouette = ({ selectedRegion, onRegionClick }) => {
  const regions = [
    { id: 'kopf_kiefer', label: 'Kopf & Kiefer', top: '5%' },
    { id: 'hals_nacken', label: 'Hals & Nacken', top: '12%' },
    { id: 'schulter_arm', label: 'Schulter & Arm', top: '20%' },
    { id: 'ruecken', label: 'Rücken (BWS)', top: '30%' },
    { id: 'rumpf', label: 'Rumpf & Rippen', top: '38%' },
    { id: 'lws', label: 'LWS & Kreuzbein', top: '48%' },
    { id: 'huefte', label: 'Hüfte & Becken', top: '58%' },
    { id: 'beine', label: 'Oberschenkel', top: '68%' },
    { id: 'knie', label: 'Knie', top: '78%' },
    { id: 'fuss', label: 'Fuß & Sprunggelenk', top: '88%' },
    { id: 'systemisch', label: 'Systemisch', top: '50%' }
  ];

  return (
    <div className="relative w-full max-w-[400px] mx-auto">
      {/* Use the detailed anatomical image */}
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png"
        alt="Anatomical body map"
        className="w-full h-auto"
      />
      
      {/* Interactive overlay regions */}
      <div className="absolute inset-0">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => onRegionClick(region.id)}
            className={`absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedRegion === region.id
                ? 'bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.8)]'
                : 'bg-slate-900/80 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            }`}
            style={{ top: region.top }}
          >
            {region.label}
          </button>
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
    </div>
  );
}