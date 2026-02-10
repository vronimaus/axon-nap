import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all routines and exercises
    const routines = await base44.entities.Routine.list();
    const existingExercises = await base44.entities.Exercise.list();

    const existingNames = new Set(existingExercises.map(e => e.name.toLowerCase()));
    const newExercises = [];

    // Extract all exercises from routines
    routines.forEach(routine => {
      routine.sequence?.forEach(step => {
        if (step.instruction) {
          const lines = step.instruction.split('\n');
          const exerciseName = lines[0]?.replace(':', '').trim();

          if (exerciseName && exerciseName.length > 3 && !existingNames.has(exerciseName.toLowerCase())) {
            newExercises.push({
              name: exerciseName,
              exercise_id: exerciseName.toLowerCase().replace(/\s+/g, '_'),
              description: `Imported from ${routine.routine_name}`,
              category: 'other',
              image_url: step.image_url || ''
            });

            existingNames.add(exerciseName.toLowerCase());
          }
        }
      });
    });

    // Bulk create new exercises
    if (newExercises.length > 0) {
      console.log(`Creating ${newExercises.length} new exercises...`);
      await base44.entities.Exercise.bulkCreate(newExercises);
    }

    return Response.json({
      success: true,
      created: newExercises.length,
      exercises: newExercises
    });
  } catch (error) {
    console.error('Error syncing exercises:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});