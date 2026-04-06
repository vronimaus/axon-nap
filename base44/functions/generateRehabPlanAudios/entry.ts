import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Generate Rehab Plan Audios (Background Agent)
 * 
 * Triggered automatically when a RehabPlan is created.
 * Generates audio files for ALL exercises in the plan.
 * Uses agentAudioOptimizer + ttsWithCache to cache them.
 * 
 * No user wait time — all audios ready when plan opens.
 */

async function generateAudioForExercise(base44, exercise) {
  try {
    // Build audio text from exercise data
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
    const result = await base44.functions.invoke('ttsWithCache', {
      text: fullText
    });
    
    console.log(`[Rehab Audio Gen] ✓ Audio generated for: ${exercise.name}`);
    return result.signed_url;
    
  } catch (error) {
    console.error(`[Rehab Audio Gen] Error for ${exercise.name}:`, error.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the rehabPlanId from payload (passed by automation)
    const { rehabPlanId } = await req.json();
    
    if (!rehabPlanId) {
      return Response.json({ error: 'rehabPlanId is required' }, { status: 400 });
    }

    console.log(`[Rehab Audio Gen] Starting audio generation for plan: ${rehabPlanId}`);

    // Fetch the full RehabPlan
    const plans = await base44.asServiceRole.entities.RehabPlan.filter({ id: rehabPlanId });
    if (!plans || plans.length === 0) {
      return Response.json({ error: 'RehabPlan not found' }, { status: 404 });
    }

    const rehabPlan = plans[0];
    const phases = rehabPlan.phases || [];
    
    console.log(`[Rehab Audio Gen] Found ${phases.length} phases`);

    let audioCount = 0;
    const failedCount = [];

    // Process each phase
    for (const phase of phases) {
      const exercises = phase.exercises || [];
      console.log(`[Rehab Audio Gen] Processing phase: ${phase.title} (${exercises.length} exercises)`);

      // Generate audio for each exercise
      for (const exercise of exercises) {
        const audioUrl = await generateAudioForExercise(base44, exercise);
        if (audioUrl) {
          audioCount++;
        } else {
          failedCount.push(exercise.name);
        }
        
        // Small delay to avoid API rate limits
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[Rehab Audio Gen] Complete: ${audioCount} audios generated, ${failedCount.length} failed`);

    return Response.json({
      success: true,
      plan_id: rehabPlanId,
      audios_generated: audioCount,
      failed_exercises: failedCount.length > 0 ? failedCount : null
    });

  } catch (error) {
    console.error('[Rehab Audio Gen] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});