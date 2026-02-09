import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowRight } from 'lucide-react';

export default function InteractiveBodyMapInput({ onSubmit }) {
  const [view, setView] = useState('front');
  const [markers, setMarkers] = useState([]);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const bodyImages = {
    front: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/8fa3e2584_body_front.png',
    back: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/03e0e9f73_body_back.png'
  };

  useEffect(() => {
    drawMarkers();
  }, [markers, view]);

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
    if (markers.length === 0) return;
    
    const mapData = {
      view,
      markers,
      mode: 'rehab'
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
      <motion.div
        key={view}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative max-w-md mx-auto bg-slate-800/30 rounded-2xl p-4"
      >
        <div className="relative">
          <img
            ref={imageRef}
            src={bodyImages[view]}
            alt={`Body ${view}`}
            className="w-full h-auto rounded-xl"
            style={{ display: 'block', maxHeight: '600px', objectFit: 'contain' }}
            onLoad={() => {
              const canvas = canvasRef.current;
              const img = imageRef.current;
              if (canvas && img) {
                canvas.width = img.offsetWidth;
                canvas.height = img.offsetHeight;
                drawMarkers();
              }
            }}
            onError={(e) => {
              console.error('Bild konnte nicht geladen werden:', bodyImages[view]);
              e.target.style.display = 'none';
            }}
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair rounded-xl"
            style={{ pointerEvents: imageRef.current ? 'auto' : 'none' }}
          />
        </div>
      </motion.div>

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
          disabled={markers.length === 0}
          className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold"
        >
          Weiter
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}