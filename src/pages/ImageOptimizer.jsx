import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Image as ImageIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function ImageOptimizer() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState('');
  const [results, setResults] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Dashboard');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list(),
    enabled: !!user
  });

  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: () => base44.entities.Routine.list(),
    enabled: !!user
  });

  const collectAllImages = () => {
    const images = [];

    // From exercises
    exercises.forEach(ex => {
      if (ex.image_url && ex.image_url.trim()) {
        images.push({
          type: 'exercise',
          id: ex.id,
          name: ex.name,
          url: ex.image_url
        });
      }
    });

    // From routines
    routines.forEach(routine => {
      routine.sequence?.forEach((step, idx) => {
        if (step.image_url && step.image_url.trim()) {
          const exerciseName = step.instruction?.split('\n')[0]?.replace(':', '').trim() || `Step ${idx + 1}`;
          images.push({
            type: 'routine',
            routineId: routine.id,
            routineName: routine.routine_name,
            stepIndex: idx,
            name: exerciseName,
            url: step.image_url
          });
        }
      });
    });

    return images;
  };

  const handleOptimizeAll = async () => {
    const images = collectAllImages();
    
    if (images.length === 0) {
      toast.error('Keine Bilder gefunden');
      return;
    }

    setOptimizing(true);
    setProgress(0);
    setResults([]);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      setCurrentImage(img.name);
      
      try {
        const { data } = await base44.functions.invoke('optimizeImages', {
          imageUrl: img.url,
          exerciseName: img.name
        });

        if (data.success) {
          // Update the entity
          if (img.type === 'exercise') {
            await base44.entities.Exercise.update(img.id, {
              image_url: data.optimizedUrl
            });
          } else if (img.type === 'routine') {
            const routine = routines.find(r => r.id === img.routineId);
            const updatedSequence = routine.sequence.map((step, idx) => {
              if (idx === img.stepIndex) {
                return { ...step, image_url: data.optimizedUrl };
              }
              return step;
            });
            await base44.entities.Routine.update(img.routineId, {
              sequence: updatedSequence
            });
          }

          setResults(prev => [...prev, {
            name: img.name,
            success: true,
            oldUrl: data.originalUrl,
            newUrl: data.optimizedUrl
          }]);
        }
      } catch (error) {
        console.error('Optimization error:', error);
        setResults(prev => [...prev, {
          name: img.name,
          success: false,
          error: error.message
        }]);
      }

      setProgress(((i + 1) / images.length) * 100);
    }

    // Refresh data
    await queryClient.invalidateQueries({ queryKey: ['exercises'] });
    await queryClient.invalidateQueries({ queryKey: ['routines'] });

    setOptimizing(false);
    setCurrentImage('');
    toast.success(`✅ ${results.filter(r => r.success).length} Bilder optimiert!`);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  const allImages = collectAllImages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                🚀 Bildoptimierung
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {allImages.length} Bilder gefunden
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('AdminHub')}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Card */}
        <div className="glass rounded-2xl border border-cyan-500/30 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Mobile-Optimierung & Kompression
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Alle Bilder werden für Mobile optimiert: bessere Auflösung, schnellere Ladezeiten, 
                professionelle Qualität. Die AI generiert optimierte Versionen mit klarem Fokus auf mobile Geräte.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ImageIcon className="w-4 h-4" />
                <span>Portrait-Format (800x1200px)</span>
                <span>•</span>
                <span>High Contrast</span>
                <span>•</span>
                <span>Klare Details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!optimizing && results.length === 0 && (
          <Button
            onClick={handleOptimizeAll}
            disabled={allImages.length === 0}
            size="lg"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 mb-6"
          >
            <Zap className="w-5 h-5 mr-2" />
            Alle {allImages.length} Bilder optimieren
          </Button>
        )}

        {/* Progress */}
        {optimizing && (
          <div className="glass rounded-2xl border border-purple-500/30 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <div className="flex-1">
                <p className="text-white font-semibold">Optimiere Bilder...</p>
                <p className="text-sm text-slate-400">{currentImage}</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-slate-400 mt-2 text-center">
              {Math.round(progress)}% abgeschlossen
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">
              Ergebnisse ({results.filter(r => r.success).length}/{results.length} erfolgreich)
            </h3>
            {results.map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-xl border p-4 ${
                  result.success 
                    ? 'border-green-500/30' 
                    : 'border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-400 text-xs">✕</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{result.name}</p>
                    {result.success ? (
                      <p className="text-xs text-green-400">Optimiert und gespeichert</p>
                    ) : (
                      <p className="text-xs text-red-400">{result.error}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {allImages.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Keine Bilder zum Optimieren gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
}