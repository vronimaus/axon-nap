/**
 * Helper: Bestimme ob ein Exercise spielbar ist
 * - Mit hasAccess: alle spielen
 * - Ohne hasAccess: nur erste pro Kategorie
 */
export function canPlayExercise(exerciseId, allExercisesInPhases, hasAccess) {
  if (hasAccess) return true;

  // Finde alle Exercises in allen Phasen
  const allExercises = [];
  if (Array.isArray(allExercisesInPhases)) {
    allExercisesInPhases.forEach(phase => {
      if (phase.exercises && Array.isArray(phase.exercises)) {
        allExercises.push(...phase.exercises);
      }
    });
  }

  // Finde die Kategorie des zu prüfenden Exercises
  const currentExercise = allExercises.find(ex => ex.exercise_id === exerciseId);
  if (!currentExercise) return false;

  const currentCategory = currentExercise.category || currentExercise.section || 'other';

  // Finde das erste Exercise dieser Kategorie
  const firstInCategory = allExercises.find(ex => {
    const category = ex.category || ex.section || 'other';
    return category === currentCategory;
  });

  return firstInCategory?.exercise_id === exerciseId;
}

/**
 * Gibt Info über Lock-Status zurück
 */
export function getExerciseLockInfo(exerciseId, allExercisesInPhases, hasAccess) {
  if (hasAccess) return { isLocked: false };

  const allExercises = [];
  if (Array.isArray(allExercisesInPhases)) {
    allExercisesInPhases.forEach(phase => {
      if (phase.exercises && Array.isArray(phase.exercises)) {
        allExercises.push(...phase.exercises);
      }
    });
  }

  const currentExercise = allExercises.find(ex => ex.exercise_id === exerciseId);
  if (!currentExercise) return { isLocked: true, reason: 'Exercise nicht gefunden' };

  const currentCategory = currentExercise.category || currentExercise.section || 'other';
  const firstInCategory = allExercises.find(ex => {
    const category = ex.category || ex.section || 'other';
    return category === currentCategory;
  });

  if (firstInCategory?.exercise_id === exerciseId) {
    return { isLocked: false };
  }

  return {
    isLocked: true,
    reason: 'Schließe zuerst die erste Übung dieser Kategorie ab',
    categoryName: currentCategory
  };
}