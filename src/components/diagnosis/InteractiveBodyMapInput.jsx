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
  const imageRef = useRef(null);

  // Same URLs as in Dashboard BodyMap
  const bodyImages = {
    front: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png',
    back: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png'
  };

  useEffect(() => {
    drawMarkers();
  }, [markers, view]);

  // Region Detection (Canvas ist immer 400x600)
  const detectRegionFromCoordinates = (markers, view) => {
    if (markers.length === 0) return 'unbekannte Region';

    const totalX = markers.reduce((sum, m) => sum + m.x, 0) / markers.length;
    const totalY = markers.reduce((sum, m) => sum + m.y, 0) / markers.length;

    // Normalized (0-1)
    const normalizedY = totalY / 100;
    const normalizedX = totalX / 100;

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
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    markers.forEach(marker => {
      const x = (marker.x / 100) * canvas.width;
      const y = (marker.y / 100) * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ef4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMarkers([{ x, y, type: 'point' }]);
  };

  const handleSubmit = () => {
    if (markers.length === 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const detectedRegion = detectRegionFromCoordinates(markers, view);
    console.log('Detected region:', detectedRegion, 'Markers:', markers);
    
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

      {/* Body Map */}
      <div className="relative w-full max-w-md mx-auto">
        {imageError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4 text-red-400 text-center">
            Körperbild konnte nicht geladen werden
          </div>
        )}
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full aspect-[3/4] bg-slate-800/50 rounded-2xl overflow-hidden"
        >
          <img
            ref={imageRef}
            src={bodyImages[view]}
            alt={`Body ${view}`}
            className="absolute inset-0 w-full h-full object-contain"
            onLoad={(e) => {
              console.log('Bild geladen:', bodyImages[view]);
              setImageLoaded(true);
              setImageError(false);
              const canvas = canvasRef.current;
              const img = e.target;
              if (canvas && img) {
                // Set canvas to match displayed image size
                canvas.width = img.clientWidth;
                canvas.height = img.clientHeight;
                drawMarkers();
              }
            }}
            onError={(e) => {
              console.error('Bild Fehler:', bodyImages[view], e);
              setImageError(true);
              setImageLoaded(false);
            }}
          />
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            onClick={handleCanvasClick}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ pointerEvents: imageLoaded ? 'auto' : 'none' }}
          />
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-400 text-sm">Lade Körperbild...</div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Instructions */}
      <p className="text-center text-sm text-slate-400">
        Tippe auf die Stelle, wo es schmerzt
      </p>

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