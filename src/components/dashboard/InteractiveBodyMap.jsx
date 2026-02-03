import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FlipHorizontal, MapPin, Pencil, Send, RotateCcw } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// KRITISCH: Diese Bilder sind final kalibriert - NICHT ändern!
const BODY_IMAGE_FRONT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png";
const BODY_IMAGE_BACK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/0df8e2e95_generated_image.png";

export default function InteractiveBodyMap({ mode, onRegionSelect, sessions }) {
  const navigate = useNavigate();
  const [view, setView] = useState('front');
  const [drawMode, setDrawMode] = useState('point');
  const [markers, setMarkers] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Load pain markers from recent sessions or clear on mode change
  useEffect(() => {
    if (mode === 'rehab' && sessions?.length > 0) {
      // Display recent pain markers
      const recentMarkers = sessions
        .filter(s => s.symptom_location)
        .slice(0, 3)
        .map(s => ({ location: s.symptom_location, type: 'pain' }));
      setMarkers(recentMarkers);
    } else {
      // Clear old markers when switching to performance mode
      setMarkers([]);
    }
  }, [mode, sessions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw markers with neon-red glow effect for rehab mode
    markers.forEach(marker => {
      if (marker.type === 'point' && marker.x && marker.y) {
        const color = mode === 'rehab' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(168, 85, 247, 0.8)';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Neon glow effect for rehab
        if (mode === 'rehab') {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
        }
        ctx.strokeStyle = mode === 'rehab' ? '#ef4444' : '#a855f7';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (marker.points?.length > 1) {
        const color = mode === 'rehab' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(168, 85, 247, 0.9)';

        // Neon glow effect for rehab
        if (mode === 'rehab') {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(marker.points[0].x, marker.points[0].y);
        marker.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // Draw current path with neon-red glow
    if (currentPath.length > 1) {
      const color = mode === 'rehab' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(168, 85, 247, 0.9)';

      // Neon glow effect for rehab
      if (mode === 'rehab') {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [markers, currentPath, mode]);

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

  const startDrawing = (e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    
    if (drawMode === 'point') {
      setMarkers([...markers, { type: 'point', x: coords.x, y: coords.y }]);
    } else {
      setIsDrawing(true);
      setCurrentPath([coords]);
    }
  };

  const draw = (e) => {
    if (!isDrawing || drawMode === 'point') return;
    e.preventDefault();
    const coords = getCoordinates(e);
    setCurrentPath([...currentPath, coords]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 1) {
      setMarkers([...markers, { type: 'line', points: currentPath }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearMarkers = () => {
    setMarkers([]);
    setCurrentPath([]);
  };

  // KRITISCH: Region-Detection - Final kalibriert - NICHT ändern!
  // Koordinaten basieren auf den finalen Body-Bildern (Canvas-Dimensionen)
  const detectRegionFromCoordinates = (markers, view, canvasWidth = 400, canvasHeight = 600) => {
    if (markers.length === 0) return 'systemisch';

    // Calculate average position of all markers
    let totalY = 0, totalX = 0, totalPoints = 0;

    markers.forEach(marker => {
      if (marker.type === 'point') {
        totalX += marker.x;
        totalY += marker.y;
        totalPoints += 1;
      } else if (marker.points) {
        marker.points.forEach(p => {
          totalX += p.x;
          totalY += p.y;
          totalPoints += 1;
        });
      }
    });

    const avgY = totalPoints > 0 ? totalY / totalPoints : 0;
    const avgX = totalPoints > 0 ? totalX / totalPoints : 0;

    // Normalized Y position (0 = top, 1 = bottom)
    const normalizedY = avgY / canvasHeight;
    const normalizedX = avgX / canvasWidth;

    // Laterality detection
    let laterality = '';
    if (normalizedX < 0.35) laterality = 'links';
    else if (normalizedX > 0.65) laterality = 'rechts';

    // Region detection - basierend auf dem anatomischen Rendering
    let region = '';
    
    if (view === 'front') {
      // Basiert auf dem tatsächlichen Körper-Rendering im Bild
      if (normalizedY < 0.06) region = 'Kopf/Stirn';
      else if (normalizedY < 0.11) region = (normalizedX < 0.47 || normalizedX > 0.53) ? 'Ohr/Kiefergelenk' : 'Hals vorne';
      else if (normalizedY < 0.20) region = (normalizedX < 0.40 || normalizedX > 0.60) ? 'Schulter vorne/Acromion' : 'obere Brust/Schlüsselbein';
      else if (normalizedY < 0.30) region = (normalizedX < 0.30 || normalizedX > 0.70) ? 'Oberarm' : 'mittlere Brust';
      else if (normalizedY < 0.37) region = (normalizedX < 0.40 || normalizedX > 0.60) ? 'Ellenbogen-Beuge' : 'Bauch oben';
      else if (normalizedY < 0.42) region = 'Bauch Mitte/Bauchnabel';
      else if (normalizedY < 0.50) region = (normalizedX < 0.35 || normalizedX > 0.65) ? 'Unterarm/Handgelenk' : 'Unterbauch/Becken';
      else if (normalizedY < 0.56) region = 'Becken/Hüfte';
      else if (normalizedY < 0.68) region = 'Oberschenkel vorne';
      else if (normalizedY < 0.76) region = 'Knie vorne';
      else if (normalizedY < 0.88) region = 'Unterschenkel/Schienbein';
      else region = 'Fuß/Knöchel vorne';
    } else { // back view
      if (normalizedY < 0.06) region = 'Hinterkopf';
      else if (normalizedY < 0.12) region = 'Nacken/obere Halswirbelsäule';
      else if (normalizedY < 0.22) region = (normalizedX < 0.40 || normalizedX > 0.60) ? 'Schulter hinten/Acromion' : 'oberer Rücken/Nacken';
      else if (normalizedY < 0.32) region = (normalizedX < 0.30 || normalizedX > 0.70) ? 'Schulterblatt' : 'oberer Rücken';
      else if (normalizedY < 0.38) region = (normalizedX < 0.40 || normalizedX > 0.60) ? 'Ellenbogen' : 'mittlerer Rücken';
      else if (normalizedY < 0.45) region = 'unterer Rücken/Lendenwirbelsäule';
      else if (normalizedY < 0.54) region = (normalizedX < 0.35 || normalizedX > 0.65) ? 'Unterarm/Handgelenk' : 'Gesäß';
      else if (normalizedY < 0.60) region = 'Becken/Hüfte';
      else if (normalizedY < 0.70) region = 'Oberschenkel hinten';
      else if (normalizedY < 0.78) region = 'Kniekehle';
      else if (normalizedY < 0.90) region = 'Wade';
      else region = 'Ferse/Achillessehne';
    }

    return laterality ? `${region} ${laterality}` : region;
  };

  const handleAnalyze = async () => {
    if (markers.length === 0) {
      toast.error('Bitte markiere zuerst einen Bereich');
      return;
    }

    setIsAnalyzing(true);
    try {
      // DEBUG: Log marker coordinates
      console.log('Markers:', markers);
      console.log('Canvas width:', canvasRef.current?.width, 'height:', canvasRef.current?.height);
      
      // Detect region from marker coordinates using canvas internal dimensions (400x600)
      // Markers are already in canvas coordinate space (0-400, 0-600)
      const region = detectRegionFromCoordinates(markers, view, 400, 600);
      
      console.log('Detected region:', region);
      
      // Store markers in session storage
      sessionStorage.setItem('bodyMapData', JSON.stringify({ view, markers, mode }));
      
      if (mode === 'rehab') {
        // Navigate to DiagnosisChat for rehab
        const params = new URLSearchParams({
          mapData: JSON.stringify({ view, markers, mode }),
          region: region
        });
        
        toast.success('Starte KI-Analyse...');
        setTimeout(() => {
          navigate(createPageUrl(`DiagnosisChat?${params.toString()}`));
        }, 500);
      } else {
        // Performance mode: just save and notify
        toast.success('Spannungen gespeichert!');
        setIsAnalyzing(false);
        onRegionSelect(region);
      }
    } catch (error) {
      console.error('Fehler:', error);
      toast.error('Fehler beim Starten der Analyse');
      setIsAnalyzing(false);
    }
  };

  const modeColor = mode === 'rehab' ? 'red' : 'purple';
  const modeColorHex = mode === 'rehab' ? '#ef4444' : '#a855f7';

  return (
    <div className="glass rounded-xl sm:rounded-2xl border border-cyan-500/20 overflow-hidden">
      {/* Header */}
      <div className={`p-3 sm:p-4 border-b ${mode === 'rehab' ? 'border-red-500/20' : 'border-purple-500/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-cyan-400">
            {mode === 'rehab' ? '🔴 Detective Mode: Pain' : '⚡ Detective Mode: Tension'}
          </h3>
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              size="sm"
              variant={view === 'front' ? 'default' : 'outline'}
              onClick={() => setView('front')}
              className="text-xs"
            >
              Vorne
            </Button>
            <Button
              size="sm"
              variant={view === 'back' ? 'default' : 'outline'}
              onClick={() => setView('back')}
              className="text-xs"
            >
              Hinten
            </Button>
          </div>
        </div>

        {/* Drawing Controls - Responsive */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button
            size="sm"
            variant={drawMode === 'point' ? 'default' : 'outline'}
            onClick={() => setDrawMode('point')}
            className="text-xs gap-1 sm:gap-2 px-2 sm:px-3"
          >
            <MapPin className="w-3 h-3" />
            <span className="hidden xs:inline">Punkt</span>
          </Button>
          <Button
            size="sm"
            variant={drawMode === 'line' ? 'default' : 'outline'}
            onClick={() => setDrawMode('line')}
            className="text-xs gap-1 sm:gap-2 px-2 sm:px-3"
          >
            <Pencil className="w-3 h-3" />
            <span className="hidden xs:inline">Linie</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearMarkers}
            className={`text-xs gap-1 sm:gap-2 px-2 sm:px-3 border-${modeColor}-500/50 text-${modeColor}-400`}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden xs:inline">Reset</span>
          </Button>
          {mode === 'rehab' && (
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={markers.length === 0 || isAnalyzing}
              className="text-xs gap-1 sm:gap-2 px-3 sm:px-4 ml-auto bg-gradient-to-r from-red-500 to-pink-600"
            >
              <Send className="w-3 h-3" />
              {isAnalyzing ? 'Lädt...' : 'Analysieren'}
            </Button>
          )}
          {mode === 'performance' && (
            <Button
              size="sm"
              onClick={() => {
                // Get goal and use same detection as Rehab
                const goalInput = document.querySelector('input[placeholder*="Klimmzug"], input[placeholder*="Pistol"]')?.value || '';
                const detectedRegion = markers.length > 0 ? detectRegionFromCoordinates(markers, view, 400, 600) : '';
                console.log('Performance - Markers:', markers);
                console.log('Performance - View:', view);
                console.log('Performance - Detected region:', detectedRegion);
                sessionStorage.setItem('bodyMapData', JSON.stringify({ view, markers, mode, dashboardGoal: goalInput, detectedRegion }));
                navigate(createPageUrl('PerformanceChat'));
              }}
              className="ml-auto text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-4 py-2"
            >
              <Send className="w-4 h-4 mr-2" />
              {markers.length > 0 ? 'Goal & Tension erfasst. Analyse starten →' : 'Goal erfasst. Analyse starten →'}
            </Button>
          )}
        </div>
      </div>

      {/* Body Canvas */}
      <div 
        ref={containerRef}
        className="relative bg-slate-900/50"
        style={{ touchAction: 'none' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {view === 'front' ? (
              <img 
                src={BODY_IMAGE_FRONT}
                alt="Front view"
                className="w-full h-auto"
                draggable={false}
              />
            ) : (
              <img 
                src={BODY_IMAGE_BACK}
                alt="Back view"
                className="w-full h-auto"
                draggable={false}
              />
            )}
          </motion.div>
        </AnimatePresence>
        
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Legend */}
      <div className="p-2 sm:p-3 border-t border-slate-700/50 text-xs text-slate-400">
        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
          <span className="font-mono text-xs sm:text-sm">
            {mode === 'rehab' ? '🔴 Schmerzpunkte markieren' : '⚡ Spannungszonen markieren'}
          </span>
          <span className="hidden xs:inline text-slate-500">|</span>
          <span className="text-xs sm:text-sm">{markers.length} Markierung(en)</span>
        </div>
      </div>
    </div>
  );
}