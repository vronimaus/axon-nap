import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Bulk Generate Exercise Audios (Global Cache Population)
 * 
 * Generates and caches audio files for ALL exercises in the database.
 * Runs once to populate the entire TTSCache.
 * Any new plan can then use these pre-cached audios — no wait time.
 */

async function generateAudioForExercise(base44, exercise) {
  try {
    const textParts = [];
    
    if (exercise.name) textParts.push(exercise.name);
    if (exercise.sets_reps_tempo) textParts.push(`${exercise.sets_reps_tempo}.`);
    if (exercise.axon_moment) textParts.push(`Das ist wichtig: ${exercise.axon_moment}`);
    if (exercise.instruction) textParts.push(exercise.instruction);
    if (exercise.cues?.length) textParts.push(`Tipps: ${exercise.cues.join('. ')}`);
    if (exercise.breathing_instruction) textParts.push(`Atmung: ${exercise.breathing_instruction}`);
    
    const fullText = textParts.join('. ');
    
    if (!fullText.trim()) return null;
    
    // Generate audio via ttsWithCache (auto-cached)
    await base44.functions.invoke('ttsWithCache', {
      text: fullText
    });
    
    console.log(`[Bulk Audio Gen] ✓ ${exercise.name}`);
    return true;
    
  } catch (error) {
    console.error(`[Bulk Audio Gen] Error for ${exercise.name}:`, error.message);
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can trigger bulk generation
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('[Bulk Audio Gen] Starting bulk exercise audio generation...');

    // Fetch ALL exercises
    const exercises = await base44.asServiceRole.entities.Exercise.list('-updated_date', 1000);
    
    if (!exercises || exercises.length === 0) {
      return Response.json({ error: 'No exercises found' }, { status: 404 });
    }

    console.log(`[Bulk Audio Gen] Found ${exercises.length} exercises`);

    let successCount = 0;
    let failedCount = 0;

    // Generate audio for each exercise with rate limiting
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      const result = await generateAudioForExercise(base44, exercise);
      if (result) {
        successCount++;
      } else {
        failedCount++;
      }
      
      // Every 10 exercises, log progress and pause
      if ((i + 1) % 10 === 0) {
        console.log(`[Bulk Audio Gen] Progress: ${i + 1}/${exercises.length} (${Math.round((i + 1) / exercises.length * 100)}%)`);
        await new Promise(r => setTimeout(r, 1000)); // 1s pause to avoid rate limits
      } else {
        await new Promise(r => setTimeout(r, 300)); // 300ms between requests
      }
    }

    const summary = {
      success: true,
      total_exercises: exercises.length,
      audios_generated: successCount,
      failed: failedCount,
      message: `Global exercise audio cache populated: ${successCount}/${exercises.length} audios ready`
    };

    console.log('[Bulk Audio Gen] Complete:', summary);

    return Response.json(summary);

  } catch (error) {
    console.error('[Bulk Audio Gen] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});