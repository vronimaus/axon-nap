import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowRight } from 'lucide-react';

export default function InteractiveBodyMapInput({ onSubmit }) {
  const [view, setView] = useState('front');
  const [markers, setMarkers] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef(null);

  // EXAKT die gleichen Bilder wie im Dashboard
  const BODY_IMAGE_FRONT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png";
  const BODY_IMAGE_BACK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/0df8e2e95_generated_image.png";

  useEffect(() => {
    // Use requestAnimationFrame to batch reflows
    const id = requestAnimationFrame(drawMarkers);
    return () => cancelAnimationFrame(id);
  }, [markers]);

  // EXAKT die gleiche Region Detection wie im Dashboard
  const detectRegionFromCoordinates = (markers, view, canvasWidth = 400, canvasHeight = 600) => {
    if (markers.length === 0) return 'systemisch';

    let totalY = 0, totalX = 0, totalPoints = 0;
    markers.forEach(marker => {
      if (marker.type === 'point') {
        totalX += marker.x;
        totalY += marker.y;
        totalPoints += 1;
      }
    });

    const avgY = totalPoints > 0 ? totalY / totalPoints : 0;
    const avgX = totalPoints > 0 ? totalX / totalPoints : 0;

    const normalizedY = avgY / canvasHeight;
    const normalizedX = avgX / canvasWidth;

    let laterality = '';
    if (normalizedX < 0.35) laterality = 'links';
    else if (normalizedX > 0.65) laterality = 'rechts';

    let region = '';
    if (view === 'front') {
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
    } else {
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

  const drawMarkers = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    markers.forEach(marker => {
      if (marker.type === 'point' && marker.x && marker.y) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ef4444';
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
  };

  const handleSubmit = () => {
    if (markers.length === 0 || isSubmitting) return;
    
    const detectedRegion = detectRegionFromCoordinates(markers, view, 400, 600);
    
    const mapData = {
      view,
      markers,
      mode: 'rehab',
      region: detectedRegion
    };
    
    onSubmit(mapData);
  };

  return (
    <div className="w-full space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-lg p-1">
        <Button
          onClick={() => setView('front')}
          variant={view === 'front' ? 'default' : 'ghost'}
          className={view === 'front' ? 'bg-red-500/30 text-red-400' : 'text-slate-400'}
        >
          Vorderseite
        </Button>
        <Button
          onClick={() => setView('back')}
          variant={view === 'back' ? 'default' : 'ghost'}
          className={view === 'back' ? 'bg-red-500/30 text-red-400' : 'text-slate-400'}
        >
          Rückseite
        </Button>
      </div>

      {/* Body Map - EXAKT wie im Dashboard */}
      <div className="relative w-full max-w-md mx-auto bg-slate-900/50 rounded-2xl overflow-hidden">
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
            width={400}
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

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setMarkers([])}
          variant="outline"
          className="flex-1 border-slate-600 text-slate-400"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Zurücksetzen
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={markers.length === 0 || isSubmitting}
          className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold"
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
        </Button>
      </div>
    </div>
  );
}