import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const BODY_IMAGE_FRONT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png";
const BODY_IMAGE_BACK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/0df8e2e95_generated_image.png";

// Region-Erkennung analog zur großen InteractiveBodyMap
function detectRegion(x, y, view) {
  const ny = y; // already normalized 0-1
  const nx = x;

  let laterality = '';
  if (nx < 0.35) laterality = 'links';
  else if (nx > 0.65) laterality = 'rechts';

  let region = '';
  if (view === 'front') {
    if (ny < 0.06) region = 'Kopf/Stirn';
    else if (ny < 0.11) region = (nx < 0.47 || nx > 0.53) ? 'Kiefergelenk' : 'Hals vorne';
    else if (ny < 0.20) region = (nx < 0.40 || nx > 0.60) ? 'Schulter vorne' : 'obere Brust';
    else if (ny < 0.30) region = (nx < 0.30 || nx > 0.70) ? 'Oberarm' : 'mittlere Brust';
    else if (ny < 0.37) region = (nx < 0.40 || nx > 0.60) ? 'Ellenbogen' : 'Bauch oben';
    else if (ny < 0.42) region = 'Bauch Mitte';
    else if (ny < 0.50) region = (nx < 0.35 || nx > 0.65) ? 'Unterarm' : 'Unterbauch';
    else if (ny < 0.56) region = 'Becken/Hüfte';
    else if (ny < 0.68) region = 'Oberschenkel vorne';
    else if (ny < 0.76) region = 'Knie vorne';
    else if (ny < 0.88) region = 'Unterschenkel';
    else region = 'Fuß/Knöchel';
  } else {
    if (ny < 0.06) region = 'Hinterkopf';
    else if (ny < 0.12) region = 'Nacken';
    else if (ny < 0.22) region = (nx < 0.40 || nx > 0.60) ? 'Schulter hinten' : 'oberer Rücken';
    else if (ny < 0.32) region = (nx < 0.30 || nx > 0.70) ? 'Schulterblatt' : 'oberer Rücken';
    else if (ny < 0.38) region = (nx < 0.40 || nx > 0.60) ? 'Ellenbogen' : 'mittlerer Rücken';
    else if (ny < 0.45) region = 'unterer Rücken/LWS';
    else if (ny < 0.54) region = (nx < 0.35 || nx > 0.65) ? 'Unterarm' : 'Gesäß';
    else if (ny < 0.60) region = 'Becken/Hüfte';
    else if (ny < 0.70) region = 'Oberschenkel hinten';
    else if (ny < 0.78) region = 'Kniekehle';
    else if (ny < 0.90) region = 'Wade';
    else region = 'Ferse/Achillessehne';
  }

  return laterality ? `${region} ${laterality}` : region;
}

export default function MiniBodyMap({ onNodeSelect }) {
  const [view, setView] = useState('front');
  const [marker, setMarker] = useState(null); // {x, y, region}
  const imgRef = useRef(null);

  const handleClick = (e) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;

    const region = detectRegion(nx, ny, view);
    const m = { x: nx * 100, y: ny * 100, region };
    setMarker(m);
    // Pass region as node identifier
    onNodeSelect(region);
  };

  return (
    <div className="space-y-3">
      {/* Front / Back Toggle */}
      <div className="flex gap-2 justify-center">
        <Button
          size="sm"
          variant={view === 'front' ? 'default' : 'outline'}
          onClick={() => { setView('front'); setMarker(null); }}
          className="text-xs"
        >
          Vorderseite
        </Button>
        <Button
          size="sm"
          variant={view === 'back' ? 'default' : 'outline'}
          onClick={() => { setView('back'); setMarker(null); }}
          className="text-xs"
        >
          Rückseite
        </Button>
      </div>

      {/* Body Image */}
      <div
        className="relative rounded-xl overflow-hidden border border-slate-700 cursor-crosshair select-none"
        style={{ touchAction: 'none' }}
        onClick={handleClick}
        onTouchStart={handleClick}
      >
        <img
          ref={imgRef}
          src={view === 'front' ? BODY_IMAGE_FRONT : BODY_IMAGE_BACK}
          alt={view === 'front' ? 'Vorderseite' : 'Rückseite'}
          className="w-full h-auto"
          draggable={false}
        />

        {/* Pain Marker */}
        {marker && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute pointer-events-none"
            style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-7 h-7 rounded-full bg-red-500/80 border-2 border-red-300 shadow-lg shadow-red-500/50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </motion.div>
        )}

        {/* Hint */}
        {!marker && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
            <span className="text-xs text-slate-400 bg-slate-900/70 px-3 py-1 rounded-full">
              Tippe auf die Schmerzstelle
            </span>
          </div>
        )}
      </div>

      {/* Selected Region */}
      {marker && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center"
        >
          <p className="text-sm font-semibold text-red-400">{marker.region}</p>
          <p className="text-xs text-slate-400 mt-1">Bestätigt – weiter zur Schmerzintensität</p>
        </motion.div>
      )}
    </div>
  );
}