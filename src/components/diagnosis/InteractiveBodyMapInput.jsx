import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { detectRegionFromMarkers, getRegionsForView } from '@/components/diagnosis/bodyMapRegions';
import { getDisambiguation } from '@/components/diagnosis/ambiguousRegions';
import RegionDisambiguation from '@/components/diagnosis/RegionDisambiguation';

export default function InteractiveBodyMapInput({ onSubmit }) {
  const [view, setView] = useState('front');
  const [markers, setMarkers] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disambiguation, setDisambiguation] = useState(null);
  const [liveRegion, setLiveRegion] = useState('');
  const canvasRef = useRef(null);

  // EXAKT die gleichen Bilder wie im Dashboard
  const BODY_IMAGE_FRONT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png";
  const BODY_IMAGE_BACK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/0df8e2e95_generated_image.png";

  useEffect(() => {
    // Use requestAnimationFrame to batch reflows
    const id = requestAnimationFrame(drawMarkers);
    return () => cancelAnimationFrame(id);
  }, [markers]);

  // Region-Erkennung jetzt polygon-basiert (shared module)
  // Siehe: src/components/diagnosis/bodyMapRegions.js

  const drawMarkers = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DEBUG: Zeichne alle Polygon-Grenzen (in 400×600 Raum → 600×600 Canvas skaliert)
    if (window.__DEBUG_POLYGONS) {
      const regions = getRegionsForView(view);
      const sx = canvas.width / 400;
      const sy = canvas.height / 600;
      ctx.strokeStyle = 'rgba(255,255,0,0.4)';
      ctx.lineWidth = 1;
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255,255,0,0.6)';
      regions.forEach(r => {
        ctx.beginPath();
        r.polygon.forEach(([px, py], i) => {
          const cx = px * sx, cy = py * sy;
          if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
        });
        ctx.closePath();
        ctx.stroke();
        const cx = r.polygon.reduce((s, p) => s + p[0], 0) / r.polygon.length * sx;
        const cy = r.polygon.reduce((s, p) => s + p[1], 0) / r.polygon.length * sy;
        ctx.fillText(r.id, cx - 15, cy);
      });
    }

    markers.forEach(marker => {
      if (marker.type === 'point' && marker.x && marker.y) {
        ctx.fillStyle = 'rgba(57, 139, 247, 0.85)';
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = '#398bf7';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#398bf7';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleCanvasClick = (e) => {
    if (!imageLoaded) return;
    const coords = getCoordinates(e);
    setMarkers([{ type: 'point', x: coords.x, y: coords.y }]);
    // Live-Region anzeigen zum Debuggen
    const region = detectRegionFromMarkers([{ type: 'point', x: coords.x, y: coords.y }], view, 600, 600);
    setLiveRegion(region);
    console.log(`[DEBUG-CLICK] X:${Math.round(coords.x)} Y:${Math.round(coords.y)} → ${region}`);
  };

  const handleSubmit = () => {
    if (markers.length === 0 || isSubmitting) return;
    
    const detectedRegion = detectRegionFromMarkers(markers, view, 600, 600);
    
    // DEBUG: Log die tatsächlichen Werte
    if (markers[0]) {
      const normalizedY = markers[0].y / 600;
      const normalizedX = markers[0].x / 600;
      console.log(`[DEBUG] Y: ${markers[0].y} (norm: ${normalizedY.toFixed(3)}), X: ${markers[0].x} (norm: ${normalizedX.toFixed(3)}) → ${detectedRegion}`);
    }

    // Disambiguation: wenn die Region mehrdeutig ist, erst nachfragen
    const options = getDisambiguation(detectedRegion, view);
    if (options) {
      setDisambiguation({ region: detectedRegion, options });
      return;
    }

    const mapData = {
      view,
      markers,
      mode: 'rehab',
      region: detectedRegion
    };
    
    onSubmit(mapData);
  };

  const handleDisambiguationSelect = (option) => {
    if (option.switchView) {
      // Ansicht umschalten und neu markieren lassen
      setView(option.switchView);
      setMarkers([]);
      setDisambiguation(null);
      return;
    }
    // Mit aufgelöstem Node weiter
    const mapData = {
      view,
      markers,
      mode: 'rehab',
      region: option.label,
      nodeId: option.nodeId,
    };
    setDisambiguation(null);
    onSubmit(mapData);
  };

  return (
    <div className="relative w-full space-y-6">
      {/* Live Region Debug */}
      {liveRegion && (
        <div className="text-center text-xs font-mono py-1 px-3 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          {liveRegion}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-center gap-1 bg-zinc-800/60 rounded-xl p-1">
        <button
          onClick={() => setView('front')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === 'front'
              ? 'text-white shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          style={view === 'front' ? { backgroundColor: '#398bf7' } : {}}
        >
          Vorderseite
        </button>
        <button
          onClick={() => setView('back')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === 'back'
              ? 'text-white shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          style={view === 'back' ? { backgroundColor: '#398bf7' } : {}}
        >
          Rückseite
        </button>
      </div>

      {/* Body Map - EXAKT wie im Dashboard */}
      <div className="relative w-full max-w-md mx-auto bg-zinc-900/60 rounded-2xl overflow-hidden">
        {imageError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4 text-red-400 text-center">
            Körperbild konnte nicht geladen werden
          </div>
        )}
        <div className="relative" style={{ touchAction: 'none' }}>
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative"
            style={{ pointerEvents: 'none' }}
          >
            {view === 'front' ? (
              <img 
                src={BODY_IMAGE_FRONT}
                alt="Front view"
                className="w-full h-auto"
                draggable={false}
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            ) : (
              <img 
                src={BODY_IMAGE_BACK}
                alt="Back view"
                className="w-full h-auto"
                draggable={false}
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            )}
          </motion.div>
          
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            onClick={handleCanvasClick}
            onTouchStart={(e) => {
              handleCanvasClick(e);
            }}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ pointerEvents: imageLoaded ? 'auto' : 'none', touchAction: 'none' }}
          />
          

        </div>
      </div>

      {/* Disambiguation Overlay */}
      {disambiguation && (
        <RegionDisambiguation
          region={disambiguation.region}
          options={disambiguation.options}
          onSelect={handleDisambiguationSelect}
          onSkip={() => {
            // Mit ursprünglicher Auto-Erkennung weiter
            const mapData = {
              view,
              markers,
              mode: 'rehab',
              region: disambiguation.region
            };
            setDisambiguation(null);
            onSubmit(mapData);
          }}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setMarkers([])}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.08] bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Zurücksetzen
        </button>
        <button
          onClick={handleSubmit}
          disabled={markers.length === 0 || isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#398bf7' }}
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              <span className="ml-2">Wird verarbeitet...</span>
            </>
          ) : (
            <>
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}