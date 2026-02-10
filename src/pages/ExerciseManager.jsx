import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Upload, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExerciseManager() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exercises, setExercises] = useState([]);
  const [uploadingExercise, setUploadingExercise] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Dashboard');
          return;
        }
        setUser(currentUser);
        await loadExercises();
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const loadExercises = async () => {
    try {
      const routines = await base44.entities.Routine.list();
      
      // Extract all unique exercises from all routines
      const exerciseMap = new Map();
      
      routines.forEach(routine => {
        routine.sequence?.forEach(step => {
          const instruction = step.instruction || '';
          const lines = instruction.split('\n');
          const firstLine = lines[0] || '';
          
          // Extract exercise name (first line before colon)
          let exerciseName = '';
          if (firstLine.includes(':')) {
            exerciseName = firstLine.replace(':', '').trim();
          } else {
            exerciseName = firstLine.trim();
          }
          
          if (exerciseName && exerciseName.length > 0) {
            if (!exerciseMap.has(exerciseName)) {
              exerciseMap.set(exerciseName, {
                name: exerciseName,
                type: step.type,
                image_url: step.image_url || null,
                routines: []
              });
            }
            
            // Track which routines use this exercise
            const exercise = exerciseMap.get(exerciseName);
            if (!exercise.routines.find(r => r.id === routine.id)) {
              exercise.routines.push({
                id: routine.id,
                name: routine.routine_name,
                stepIndex: routine.sequence.indexOf(step)
              });
            }
          }
        });
      });
      
      setExercises(Array.from(exerciseMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      ));
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast.error('Fehler beim Laden der Übungen');
    }
  };

  const handleImageUpload = async (exercise, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingExercise(exercise.name);
    
    try {
      // Upload image
      const { data } = await base44.integrations.Core.UploadFile({ file });
      const imageUrl = data.file_url;
      
      // Update all routines that contain this exercise
      const routines = await base44.entities.Routine.list();
      
      for (const routine of routines) {
        let needsUpdate = false;
        const updatedSequence = routine.sequence?.map(step => {
          const instruction = step.instruction || '';
          const lines = instruction.split('\n');
          const firstLine = lines[0] || '';
          let exerciseName = '';
          
          if (firstLine.includes(':')) {
            exerciseName = firstLine.replace(':', '').trim();
          } else {
            exerciseName = firstLine.trim();
          }
          
          if (exerciseName === exercise.name) {
            needsUpdate = true;
            return { ...step, image_url: imageUrl };
          }
          return step;
        });
        
        if (needsUpdate) {
          await base44.entities.Routine.update(routine.id, {
            sequence: updatedSequence
          });
        }
      }
      
      toast.success(`Bild für "${exercise.name}" hochgeladen und in ${exercise.routines.length} Routine(n) aktualisiert`);
      await loadExercises();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploadingExercise(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                🏋️ Übungsverwaltung
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Lade Bilder für alle Übungen hoch
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="glass rounded-2xl border border-cyan-500/30 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-cyan-400">
              {exercises.length} eindeutige Übungen gefunden
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            Lade für jede Übung ein Bild hoch. Das Bild wird automatisch in allen Routinen angezeigt, die diese Übung enthalten.
          </p>
        </div>

        {/* Exercise List */}
        <div className="grid gap-4">
          {exercises.map((exercise) => (
            <motion.div
              key={exercise.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass border-cyan-500/20 p-4">
                <div className="flex items-start gap-4">
                  {/* Exercise Image Preview */}
                  <div className="w-24 h-24 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {exercise.image_url ? (
                      <img 
                        src={exercise.image_url} 
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    )}
                  </div>

                  {/* Exercise Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white mb-1 truncate">
                      {exercise.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        exercise.type === 'strength' ? 'bg-cyan-500/20 text-cyan-400' :
                        exercise.type === 'mobility' ? 'bg-amber-500/20 text-amber-400' :
                        exercise.type === 'neuro' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {exercise.type}
                      </span>
                      <span className="text-xs text-slate-500">
                        Verwendet in {exercise.routines.length} Routine(n)
                      </span>
                    </div>
                    {exercise.routines.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {exercise.routines.map(routine => (
                          <span 
                            key={`${routine.id}-${routine.stepIndex}`}
                            className="text-xs px-2 py-0.5 rounded bg-slate-800/50 text-slate-400"
                          >
                            {routine.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-shrink-0">
                    <input
                      type="file"
                      id={`upload-${exercise.name}`}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(exercise, e)}
                      disabled={uploadingExercise === exercise.name}
                    />
                    <label htmlFor={`upload-${exercise.name}`}>
                      <Button
                        as="span"
                        size="sm"
                        disabled={uploadingExercise === exercise.name}
                        className={`cursor-pointer ${
                          exercise.image_url 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                        }`}
                      >
                        {uploadingExercise === exercise.name ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Upload...
                          </>
                        ) : exercise.image_url ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Ersetzen
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Hochladen
                          </>
                        )}
                      </Button>
                    </label>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}