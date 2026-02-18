import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      current_exercise_id,
      nrs_score,
      hardware_score,
      software_score,
      battery_score,
      recent_sessions,
      current_plan_id
    } = await req.json();

    if (!current_exercise_id || nrs_score === undefined) {
      return Response.json({ 
        error: 'current_exercise_id and nrs_score required' 
      }, { status: 400 });
    }

    // ============================================================
    // 1. CALCULATE READINESS STATUS
    // ============================================================
    const readiness_score = Math.round((hardware_score + software_score + battery_score) / 3);
    let readiness_status = 'green';
    if (readiness_score < 5) readiness_status = 'red';
    else if (readiness_score < 7) readiness_status = 'yellow';

    // ============================================================
    // 2. CALCULATE RIS STATUS (STUCK/TESTING/READY)
    // ============================================================
    const stable_sessions = recent_sessions?.filter(s => 
      s.nrs_score >= (nrs_score - 1) && s.nrs_score <= (nrs_score + 1)
    )?.length || 0;

    let ris_status = 'STUCK';
    let safety_flare_triggered = false;

    // Rule: NRS > 3 = STUCK, Safety Flare
    if (nrs_score > 3) {
      ris_status = 'STUCK';
      safety_flare_triggered = true;
    }
    // Rule: NRS 0-2 with 3+ stable sessions = READY
    else if (nrs_score >= 0 && nrs_score <= 2 && stable_sessions >= 3) {
      ris_status = 'READY';
    }
    // Rule: NRS 1-3 with 1-2 stable sessions = TESTING
    else if (nrs_score >= 1 && nrs_score <= 3 && stable_sessions >= 1) {
      ris_status = 'TESTING';
    }
    // Otherwise = STUCK
    else {
      ris_status = 'STUCK';
    }

    // ============================================================
    // 3. FETCH CURRENT EXERCISE & PLAN
    // ============================================================
    const exerciseData = await base44.entities.Exercise.filter(
      { exercise_id: current_exercise_id }
    );
    
    if (!exerciseData || exerciseData.length === 0) {
      return Response.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const current_exercise = exerciseData[0];
    let current_plan = null;

    if (current_plan_id) {
      const planData = await base44.entities.RehabPlan.filter(
        { id: current_plan_id }
      );
      current_plan = planData[0] || null;
    }

    // ============================================================
    // 4. DETERMINE RECOMMENDED ACTION & NEXT EXERCISE
    // ============================================================
    let recommended_action = 'hold';
    let next_exercise = null;
    let use_hybrid_bridge = false;
    let regression_reason = null;

    // SAFETY FLARE: NRS > 3, Readiness < 3, or Aggravatoren active
    if (safety_flare_triggered || readiness_score < 3) {
      recommended_action = 'regression';
      regression_reason = safety_flare_triggered ? 'NRS > 3 (Safety Flare)' : 'Low Readiness Score';

      // Find regression exercise (from progression_basic)
      if (current_exercise.progression_basic?.description) {
        next_exercise = {
          exercise_id: current_exercise.exercise_id,
          variant: 'basic',
          name: `${current_exercise.name} (Regression)`,
          description: current_exercise.progression_basic.description,
          focus: current_exercise.progression_basic.focus,
          reason: `Regression due to ${regression_reason}`
        };
      }
    }
    // TESTING: Use Hybrid-Bridge (Isometric + Load, Slow Eccentric)
    else if (ris_status === 'TESTING') {
      recommended_action = 'hybrid_bridge';
      use_hybrid_bridge = true;

      next_exercise = {
        exercise_id: current_exercise.exercise_id,
        variant: 'hybrid_bridge',
        name: `${current_exercise.name} (Hybrid-Bridge)`,
        description: `Isometric hold with light load OR slow eccentric (3-5s) without concentric movement`,
        focus: 'Neuro-muscular preparation without pain provocation',
        reason: '1-2 stable sessions. Use Hybrid-Bridge to prepare for full progression.'
      };
    }
    // READY: Progression to next level in chain
    else if (ris_status === 'READY') {
      recommended_action = 'progression';

      // Find next exercise in progression_advanced
      if (current_exercise.progression_advanced?.description) {
        next_exercise = {
          exercise_id: current_exercise.exercise_id,
          variant: 'advanced',
          name: `${current_exercise.name} (Progression)`,
          description: current_exercise.progression_advanced.description,
          focus: current_exercise.progression_advanced.focus,
          reason: '3+ stable sessions with NRS 0-2. Ready for progression!'
        };
      }
    }
    // STUCK: Hold or mild regression
    else {
      recommended_action = 'hold';
      next_exercise = {
        exercise_id: current_exercise.exercise_id,
        variant: 'current',
        name: current_exercise.name,
        description: 'Maintain current level. Consistency is the key.',
        focus: 'Stabilize progress',
        reason: 'Less than 1 stable session. Stay consistent before progressing.'
      };
    }

    // ============================================================
    // 5. APPLY 3-PHASE SESSION STRUCTURE
    // ============================================================
    const session_structure = {
      phase_1_primer: {
        name: 'Primer (Neuro/Prep)',
        duration_minutes: 5,
        description: 'Neural calibration + joint preparation',
        purpose: 'Prepare nervous system and joints for work'
      },
      phase_2_engine: {
        name: 'Engine (Power/Stability)',
        duration_minutes: 20,
        exercise: next_exercise,
        sets_reps: recommendedSetsReps(ris_status, current_exercise),
        description: 'Main training work'
      },
      phase_3_reset: {
        name: 'Reset (Vagus/Recovery)',
        duration_minutes: 5,
        description: 'Neuro-dampening, parasympathetic activation',
        purpose: 'Mandatory shutdown. Do NOT skip.'
      }
    };

    // ============================================================
    // 6. BUILD RESPONSE
    // ============================================================
    const response = {
      success: true,
      ris_status,
      readiness_status,
      readiness_score,
      nrs_score,
      stable_sessions,
      safety_flare_triggered,
      regression_reason: regression_reason || null,
      recommended_action,
      use_hybrid_bridge,
      session_structure,
      next_exercise,
      coaching_message: generateCoachingMessage(ris_status, safety_flare_triggered, stable_sessions),
      timestamp: new Date().toISOString()
    };

    return Response.json(response);

  } catch (error) {
    console.error('rehabCoach error:', error);
    return Response.json({ 
      error: error.message || 'Unknown error',
      type: 'REHAB_COACH_ERROR'
    }, { status: 500 });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function recommendedSetsReps(ris_status, exercise) {
  const base_level = exercise.progression_level || 1;

  if (ris_status === 'STUCK') {
    return {
      sets: 2,
      reps: 5,
      tempo: '2-1-2',
      intensity: 'Light',
      note: 'Conservative volume to avoid aggravation'
    };
  }

  if (ris_status === 'TESTING') {
    return {
      sets: 3,
      reps: 5,
      tempo: '2-2-3',
      intensity: 'Moderate',
      note: 'Isometric or slow eccentric focus'
    };
  }

  // READY
  return {
    sets: 3,
    reps: 8,
    tempo: '2-1-2',
    intensity: 'Moderate-High',
    note: 'Full range of motion. Progressive overload possible.'
  };
}

function generateCoachingMessage(ris_status, safety_flare_triggered, stable_sessions) {
  if (safety_flare_triggered) {
    return '🚨 Safety Flare Activated: Pain is too high. Stepping back to regression. Your system needs more time. No shame in this—it\'s how smart training works.';
  }

  if (ris_status === 'STUCK') {
    return '🔴 STUCK Status: Less than 1 consistent session at this level. Focus on quality over quantity. We\'re building the foundation.';
  }

  if (ris_status === 'TESTING') {
    return `🟡 TESTING Status: You\'ve got ${stable_sessions} stable session(s). We\'re using the Hybrid-Bridge to prepare your nervous system. 1-2 more good sessions = progression ready.`;
  }

  if (ris_status === 'READY') {
    return `🟢 READY Status: ${stable_sessions} consecutive stable sessions! Your system is showing real improvement. Time to level up. Exciting progress!`;
  }

  return 'Keep going. Consistency is everything.';
}