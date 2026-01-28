import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Pencil, Circle, Eraser, RotateCcw, Send, FlipHorizontal } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BodyPainMap({ onSubmit, onCancel }) {
  const [view, setView] = useState('front'); // 'front' or 'back'
  const [drawMode, setDrawMode] = useState('line'); // 'line' or 'point'
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all paths
    paths.forEach(path => {
      if (path.type === 'point') {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.8)';
        ctx.beginPath();
        ctx.arc(path.x, path.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(236, 72, 153, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (path.points && path.points.length > 1) {
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.9)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    });
    
    // Draw current path
    if (currentPath.length > 1) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.9)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  }, [paths, currentPath]);

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
      setPaths([...paths, { type: 'point', x: coords.x, y: coords.y }]);
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
      setPaths([...paths, { type: 'line', points: currentPath }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath([]);
  };

  const handleSubmit = async () => {
    if (paths.length === 0) {
      toast.error('Bitte markiere zuerst deine Schmerzbereiche');
      return;
    }

    setUploading(true);
    try {
      // Create composite image with body + drawings
      const canvas = canvasRef.current;
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = canvas.width;
      compositeCanvas.height = canvas.height;
      const ctx = compositeCanvas.getContext('2d');
      
      // Draw body silhouette
      const bodySvg = containerRef.current.querySelector('svg');
      const svgData = new XMLSerializer().serializeToString(bodySvg);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
      
      // Draw pain markers on top
      ctx.drawImage(canvas, 0, 0);
      
      // Convert to blob
      const blob = await new Promise(resolve => compositeCanvas.toBlob(resolve, 'image/png'));
      
      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      
      // Prepare analysis data
      const analysisData = {
        view,
        drawMode,
        painMarkers: paths.map(p => ({
          type: p.type,
          ...(p.type === 'point' ? { x: p.x, y: p.y } : { points: p.points })
        })),
        imageUrl: file_url
      };
      
      onSubmit(analysisData);
      toast.success('Schmerzmarkierung übermittelt');
    } catch (error) {
      console.error('Upload-Fehler:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">
          Schmerzbereich markieren
        </h2>
        <p className="text-slate-400">
          Zeichne Linien oder setze Punkte, wo es weh tut
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant={view === 'front' ? 'default' : 'outline'}
          onClick={() => setView('front')}
          className="gap-2"
        >
          <FlipHorizontal className="w-4 h-4" />
          Vorderseite
        </Button>
        <Button
          variant={view === 'back' ? 'default' : 'outline'}
          onClick={() => setView('back')}
          className="gap-2"
        >
          <FlipHorizontal className="w-4 h-4" />
          Rückseite
        </Button>
        
        <div className="w-px bg-slate-700" />
        
        <Button
          variant={drawMode === 'line' ? 'default' : 'outline'}
          onClick={() => setDrawMode('line')}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" />
          Linie
        </Button>
        <Button
          variant={drawMode === 'point' ? 'default' : 'outline'}
          onClick={() => setDrawMode('point')}
          className="gap-2"
        >
          <Circle className="w-4 h-4" />
          Punkt
        </Button>
        
        <Button
          variant="outline"
          onClick={clearCanvas}
          className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          <RotateCcw className="w-4 h-4" />
          Zurücksetzen
        </Button>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative mx-auto max-w-md bg-slate-900/50 rounded-2xl border border-cyan-500/30 overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'front' ? <BodySilhouetteFront /> : <BodySilhouetteBack />}
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

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={uploading}
        >
          Abbrechen
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={paths.length === 0 || uploading}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 gap-2"
        >
          {uploading ? (
            <>Wird hochgeladen...</>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Analyse starten
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// Front body silhouette
function BodySilhouetteFront() {
  return (
    <svg viewBox="0 0 400 600" className="w-full h-full">
      <defs>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(6, 182, 212, 0.15)" />
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0.15)" />
        </linearGradient>
      </defs>
      
      {/* Body outline - front view */}
      <path
        d="M 200 50 
           C 180 50, 170 60, 170 80
           L 170 120
           L 140 140
           L 140 240
           C 140 250, 150 260, 160 260
           L 160 350
           L 180 550
           L 160 590
           L 180 590
           L 200 500
           L 220 590
           L 240 590
           L 220 550
           L 240 350
           L 240 260
           C 250 260, 260 250, 260 240
           L 260 140
           L 230 120
           L 230 80
           C 230 60, 220 50, 200 50 Z"
        fill="url(#bodyGradient)"
        stroke="rgba(6, 182, 212, 0.5)"
        strokeWidth="2"
      />
      
      {/* Head */}
      <circle cx="200" cy="40" r="25" fill="url(#bodyGradient)" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="2" />
      
      {/* Arms */}
      <path
        d="M 140 140 L 100 200 L 90 280 L 110 280 L 120 200"
        fill="none"
        stroke="rgba(6, 182, 212, 0.5)"
        strokeWidth="2"
      />
      <path
        d="M 260 140 L 300 200 L 310 280 L 290 280 L 280 200"
        fill="none"
        stroke="rgba(6, 182, 212, 0.5)"
        strokeWidth="2"
      />
    </svg>
  );
}

// Back body silhouette
function BodySilhouetteBack() {
  return (
    <svg viewBox="0 0 400 600" className="w-full h-full">
      <defs>
        <linearGradient id="bodyGradientBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(139, 92, 246, 0.15)" />
          <stop offset="100%" stopColor="rgba(6, 182, 212, 0.15)" />
        </linearGradient>
      </defs>
      
      {/* Body outline - back view */}
      <path
        d="M 200 50 
           C 180 50, 170 60, 170 80
           L 170 120
           L 140 140
           L 140 240
           C 140 250, 150 260, 160 260
           L 160 350
           L 180 550
           L 160 590
           L 180 590
           L 200 500
           L 220 590
           L 240 590
           L 220 550
           L 240 350
           L 240 260
           C 250 260, 260 250, 260 240
           L 260 140
           L 230 120
           L 230 80
           C 230 60, 220 50, 200 50 Z"
        fill="url(#bodyGradientBack)"
        stroke="rgba(139, 92, 246, 0.5)"
        strokeWidth="2"
      />
      
      {/* Head */}
      <circle cx="200" cy="40" r="25" fill="url(#bodyGradientBack)" stroke="rgba(139, 92, 246, 0.5)" strokeWidth="2" />
      
      {/* Arms */}
      <path
        d="M 140 140 L 100 200 L 90 280 L 110 280 L 120 200"
        fill="none"
        stroke="rgba(139, 92, 246, 0.5)"
        strokeWidth="2"
      />
      <path
        d="M 260 140 L 300 200 L 310 280 L 290 280 L 280 200"
        fill="none"
        stroke="rgba(139, 92, 246, 0.5)"
        strokeWidth="2"
      />
      
      {/* Spine indicator */}
      <line x1="200" y1="80" x2="200" y2="350" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}