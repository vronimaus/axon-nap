import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const routineId = body.routineId;

    if (!routineId) {
      return Response.json({ error: 'routineId required' }, { status: 400 });
    }

    // Get single routine
    const routines = await base44.entities.Routine.filter({ id: routineId });
    if (routines.length === 0) {
      return Response.json({ error: 'Routine not found' }, { status: 404 });
    }

    const routine = routines[0];
    const newExercises = [];

    // Extract exercises from this routine
    routine.sequence?.forEach(step => {
      if (step.instruction) {
        const lines = step.instruction.split('\n');
        const exerciseName = lines[0]?.replace(':', '').trim();

        if (exerciseName && exerciseName.length > 3) {
          newExercises.push({
            name: exerciseName,
            exercise_id: exerciseName.toLowerCase().replace(/\s+/g, '_'),
            description: `From: ${routine.routine_name}`,
            category: 'other',
            image_url: step.image_url || ''
          });
        }
      }
    });

    // Bulk create exercises
    if (newExercises.length > 0) {
      await base44.entities.Exercise.bulkCreate(newExercises);
    }

    return Response.json({
      success: true,
      created: newExercises.length
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});