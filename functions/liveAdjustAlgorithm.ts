import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rehabPlanId, exerciseId, nodeFeedback, painNrs } = await req.json();

    if (!rehabPlanId || !exerciseId || painNrs === undefined) {
      return Response.json(
        { error: 'Missing required fields: rehabPlanId, exerciseId, painNrs' },
        { status: 400 }
      );
    }

    // Fetch current plan and exercise
    const rehabPlan = await base44.entities.RehabPlan.get(rehabPlanId);
    const exercise = await base44.entities.Exercise.get(exerciseId);

    if (!rehabPlan || !exercise) {
      return Response.json(
        { error: 'RehabPlan or Exercise not found' },
        { status: 404 }
      );
    }

    // LIVE-ADJUST ALGORITHM
    // Step 1: Analyze the feedback
    const feedbackSeverity = painNrs >= 7 ? 'critical' : painNrs >= 5 ? 'moderate' : 'mild';

    // Step 2: Check contraindications based on smart tags
    const smartTags = exercise.smart_tags || {};
    const contraindications = smartTags.contraindications || [];
    
    // If node feedback matches a contraindication, veto immediately
    const hasVeto = nodeFeedback && contraindications.some(c =>
      c.condition.toLowerCase().includes(nodeFeedback.toLowerCase()) ||
      nodeFeedback.toLowerCase().includes(c.condition.toLowerCase())
    );

    // Step 3: Determine action
    let action = 'continue';
    let adjustmentReasoning = '';
    let newExerciseId = null;
    let parameter_adjustment = null;

    if (painNrs >= 8 || hasVeto) {
      // Critical: Stop and pivot
      action = 'pivot_to_drill';
      adjustmentReasoning = `Kritischer Schmerz (NRS ${painNrs}) oder Kontraindikation detektiert. Pivot zu Neuro-Drill für Safe-Reset.`;
      
      // Find a calming neuro drill from the same movement family
      const parentExercise = exercise.parent_exercise || exercise.exercise_id;
      const allExercises = await base44.entities.Exercise.filter(
        { parent_exercise: parentExercise }
      );
      
      const neroDrill = allExercises.find(e => 
        e.neuro_impact_type?.includes('calming') && e.progression_level <= 2
      );
      
      if (neroDrill) {
        newExerciseId = neroDrill.id;
      }
    } else if (painNrs >= 5 && painNrs < 8) {
      // Moderate: Adjust parameters (tempo, load, ROM)
      action = 'modify_parameter';
      adjustmentReasoning = `Moderater Schmerz (NRS ${painNrs}). Parametric Adjustment: Tempo verlangsamt, Range-of-Motion reduziert.`;
      
      parameter_adjustment = {
        tempo: 'slower', // Slow down the movement
        range_of_motion: 'partial', // Reduce ROM
        load_reduction: 0.7 // 70% of original load
      };
    } else if (painNrs >= 2 && painNrs < 5) {
      // Mild: Monitor and possibly regress
      action = 'regress_exercise';
      adjustmentReasoning = `Milder Schmerz (NRS ${painNrs}). Wechsel zu Basic-Variante für sicheren Fortschritt.`;
      
      // Find basic progression
      if (exercise.progression_basic) {
        newExerciseId = exercise.progression_basic.label; // Reference to basic version
      }
    } else {
      // Green light: Continue but log the data
      action = 'continue';
      adjustmentReasoning = 'Keine Anpassung erforderlich. Schmerz-Score OK.';
    }

    // Step 4: Log the intervention
    const intervention = {
      timestamp: new Date().toISOString(),
      exercise_id: exerciseId,
      exercise_name: exercise.name,
      node_feedback: nodeFeedback || 'general_discomfort',
      pain_nrs: painNrs,
      action_taken: action,
      new_exercise_id: newExerciseId,
      reasoning: adjustmentReasoning,
      parameter_adjustment: parameter_adjustment
    };

    // Step 5: Update RehabPlan with live_adjust_log
    const updatedLog = rehabPlan.live_adjust_log || [];
    updatedLog.push(intervention);

    await base44.entities.RehabPlan.update(rehabPlanId, {
      live_adjust_log: updatedLog
    });

    // Track event
    base44.analytics.track({
      eventName: 'live_adjust_triggered',
      properties: {
        action,
        pain_nrs: painNrs,
        exercise_id: exerciseId,
        has_veto: hasVeto
      }
    });

    return Response.json({
      success: true,
      action,
      adjustment: {
        reasoning: adjustmentReasoning,
        newExerciseId,
        parameterAdjustment: parameter_adjustment,
        recommendation: getActionRecommendation(action)
      }
    });
  } catch (error) {
    console.error('Live Adjust Algorithm Error:', error);
    return Response.json(
      { error: error.message || 'Failed to process live adjustment' },
      { status: 500 }
    );
  }
});

function getActionRecommendation(action) {
  const recommendations = {
    continue: '✅ Weiter wie bisher - alles im grünen Bereich!',
    regress_exercise: '⬇️ Wir wechseln zur leichteren Variante für sichere Progression.',
    modify_parameter: '⚙️ Kleine Anpassungen: Tempo verlangsamt, ROM reduziert.',
    pivot_to_drill: '🔄 Sicherheits-Pivot: Wir machen einen Neuro-Reset-Drill.',
    tempo_adjustment: '⏱️ Tempo-Anpassung für bessere Nervenbahn-Integration.',
    load_reduction: '📉 Belastung reduziert für strukturelle Adaption.'
  };
  
  return recommendations[action] || 'Anpassung durchgeführt.';
}