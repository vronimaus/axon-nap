import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check admin auth
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all routines and exercises
    const routines = await base44.asServiceRole.entities.Routine.list();
    const exercises = await base44.asServiceRole.entities.Exercise.list();

    let updatedCount = 0;
    let errorCount = 0;
    const updates = [];

    for (const routine of routines) {
      let hasChanges = false;
      const updatedSequence = routine.sequence.map((step) => {
        // Skip if already has exercise_id
        if (step.exercise_id) return step;

        // Try to extract exercise name from instruction
        const instruction = step.instruction || '';
        const lines = instruction.split('\n');
        const firstLine = lines[0] || '';
        
        // Extract title (before colon or full first line)
        let title = firstLine.includes(':') 
          ? firstLine.split(':')[0].trim()
          : firstLine.trim();

        // Clean title
        title = title.toLowerCase().trim();

        // Find matching exercise
        const matchingExercise = exercises.find(ex => {
          const exName = (ex.name || '').toLowerCase().trim();
          const exId = (ex.exercise_id || '').toLowerCase().replace(/_/g, ' ').trim();
          
          return title.includes(exName) || 
                 exName.includes(title) ||
                 title.includes(exId) ||
                 exId.includes(title);
        });

        if (matchingExercise) {
          hasChanges = true;
          updates.push(`${routine.routine_name}: "${title}" → ${matchingExercise.exercise_id}`);
          return { ...step, exercise_id: matchingExercise.exercise_id };
        }

        return step;
      });

      if (hasChanges) {
        try {
          await base44.asServiceRole.entities.Routine.update(routine.id, {
            sequence: updatedSequence
          });
          updatedCount++;
        } catch (err) {
          errorCount++;
          console.error(`Error updating routine ${routine.routine_name}:`, err);
        }
      }
    }

    return Response.json({
      success: true,
      routinesProcessed: routines.length,
      routinesUpdated: updatedCount,
      errors: errorCount,
      updates: updates
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});