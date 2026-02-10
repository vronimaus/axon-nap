import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, Check, Loader2, Image as ImageIcon, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function ExerciseImageUpload() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingExerciseId, setUploadingExerciseId] = useState(null);
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

  // Fetch all exercises
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list(),
    enabled: !!user
  });

  // Fetch all routines to check where exercises are used
  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: () => base44.entities.Routine.list(),
    enabled: !!user
  });

  // Collect all unique exercise names from routines
  const getExercisesFromRoutines = () => {
    const exerciseMap = new Map();
    
    routines.forEach(routine => {
      routine.sequence?.forEach((step, index) => {
        if (step.instruction) {
          // Extract exercise name from instruction (first line, before colon or line break)
          const lines = step.instruction.split('\n');
          const firstLine = lines[0] || '';
          
          // Remove colon and any trailing whitespace/punctuation
          const exerciseName = firstLine.replace(':', '').trim();

          if (exerciseName && exerciseName.length > 3) {
            const key = exerciseName.toLowerCase();
            if (!exerciseMap.has(key)) {
              exerciseMap.set(key, {
                name: exerciseName,
                type: step.type,
                image_url: step.image_url,
                usedIn: []
              });
            }
            exerciseMap.get(key).usedIn.push({
              routine: routine.routine_name,
              routineId: routine.id,
              stepIndex: index,
              currentImageUrl: step.image_url
            });
          }
        }
      });
    });

    return Array.from(exerciseMap.values());
  };

  // Combine exercises from Exercise entity and routines
  const getAllExercises = () => {
    const fromEntity = exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      type: 'exercise_entity',
      image_url: ex.image_url,
      exercise_id: ex.exercise_id
    }));

    const fromRoutines = getExercisesFromRoutines().map(ex => ({
      name: ex.name,
      type: ex.type,
      image_url: ex.image_url,
      usedIn: ex.usedIn,
      source: 'routine'
    }));

    // Merge and deduplicate
    const allExercises = [...fromEntity];
    fromRoutines.forEach(routineEx => {
      const exists = allExercises.find(
        ex => ex.name.toLowerCase() === routineEx.name.toLowerCase()
      );
      if (!exists) {
        allExercises.push(routineEx);
      } else {
        // Add usage info
        exists.usedIn = routineEx.usedIn;
      }
    });

    return allExercises.sort((a, b) => a.name.localeCompare(b.name));
  };

  const allExercises = getAllExercises();

  // Filter exercises by search term
  const filteredExercises = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Upload mutation for Exercise entity
  const updateExerciseMutation = useMutation({
    mutationFn: async ({ exerciseId, imageUrl }) => {
      return await base44.entities.Exercise.update(exerciseId, { image_url: imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success('Bild erfolgreich hochgeladen');
      setUploadingExerciseId(null);
    },
    onError: (error) => {
      toast.error('Upload fehlgeschlagen: ' + error.message);
      setUploadingExerciseId(null);
    }
  });

  // Update mutation for routines
  const updateRoutineMutation = useMutation({
    mutationFn: async ({ routineId, stepIndex, imageUrl }) => {
      const routine = routines.find(r => r.id === routineId);
      if (!routine) throw new Error('Routine nicht gefunden');
      
      const updatedSequence = [...routine.sequence];
      updatedSequence[stepIndex] = {
        ...updatedSequence[stepIndex],
        image_url: imageUrl
      };

      return await base44.entities.Routine.update(routineId, { sequence: updatedSequence });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    }
  });

  const handleFileUpload = async (exercise, file) => {
    if (!file) return;
    
    try {
      setUploadingExerciseId(exercise.name);
      toast.info('Uploading...');
      
      // Upload file to base44
      const response = await base44.integrations.Core.UploadFile({ file });
      const imageUrl = response.file_url;

      if (!imageUrl) {
        throw new Error('Keine URL erhalten');
      }

      let updatedCount = 0;

      // Update Exercise entity if it exists
      if (exercise.id) {
        await updateExerciseMutation.mutateAsync({
          exerciseId: exercise.id,
          imageUrl
        });
        updatedCount++;
      }

      // Update all routines where this exercise is used
      if (exercise.usedIn && exercise.usedIn.length > 0) {
        console.log('🔍 Updating routines for:', exercise.name);
        console.log('📝 Usage locations:', exercise.usedIn);
        
        for (const usage of exercise.usedIn) {
          console.log(`🎯 Updating routine ${usage.routineId}, step ${usage.stepIndex}`);
          
          await updateRoutineMutation.mutateAsync({
            routineId: usage.routineId,
            stepIndex: usage.stepIndex,
            imageUrl
          });
          
          console.log(`✅ Updated routine ${usage.routineId}`);
          updatedCount++;
        }
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['exercises'] });
      await queryClient.invalidateQueries({ queryKey: ['routines'] });

      if (updatedCount > 0) {
        toast.success(`✅ Bild erfolgreich hochgeladen und in ${updatedCount} ${updatedCount === 1 ? 'Stelle' : 'Stellen'} aktualisiert`);
      } else {
        toast.success('✅ Bild erfolgreich hochgeladen');
      }
      
      setUploadingExerciseId(null);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('❌ Upload fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
      setUploadingExerciseId(null);
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
                📸 Übungs-Bilder hochladen
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {filteredExercises.length} Übungen gefunden
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
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Übung suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700"
            />
          </div>
        </div>

        {/* Exercise List */}
        <div className="grid gap-4">
          {filteredExercises.map((exercise, index) => (
            <motion.div
              key={exercise.id || exercise.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl border border-cyan-500/20 p-4"
            >
              <div className="flex items-start gap-4 mb-3">
                {/* Exercise Image Preview */}
                <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-700">
                  {exercise.image_url ? (
                    <img
                      src={exercise.image_url}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                {/* Exercise Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white mb-2">
                    {exercise.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      exercise.type === 'exercise_entity' 
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : exercise.type === 'mfr'
                        ? 'bg-red-500/20 text-red-400'
                        : exercise.type === 'neuro'
                        ? 'bg-purple-500/20 text-purple-400'
                        : exercise.type === 'strength'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {exercise.type === 'exercise_entity' ? 'Exercise Entity' : exercise.type}
                    </span>
                    {exercise.usedIn && exercise.usedIn.length > 0 && (
                      <span className="text-xs text-slate-400">
                        in {exercise.usedIn.length} Routine(n)
                      </span>
                    )}
                    {exercise.image_url && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <input
                type="file"
                accept="image/*"
                id={`upload-${exercise.id || exercise.name}`}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(exercise, file);
                }}
                disabled={uploadingExerciseId === exercise.name}
              />
              <Button
                onClick={() => {
                  document.getElementById(`upload-${exercise.id || exercise.name}`)?.click();
                }}
                disabled={uploadingExerciseId === exercise.name}
                size="sm"
                className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
              >
                {uploadingExerciseId === exercise.name ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {exercise.image_url ? 'Bild ersetzen' : 'Bild hochladen'}
                  </>
                )}
              </Button>

              {/* Usage Info */}
              {exercise.usedIn && exercise.usedIn.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Wird verwendet in:</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.usedIn.slice(0, 3).map((usage, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded"
                      >
                        {usage.routine}
                      </span>
                    ))}
                    {exercise.usedIn.length > 3 && (
                      <span className="text-xs text-slate-500">
                        +{exercise.usedIn.length - 3} mehr
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Keine Übungen gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
}