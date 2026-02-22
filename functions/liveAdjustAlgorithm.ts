import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      current_exercise_id,
      pain_node_id,
      pain_nrs,
      user_email,
      current_phase
    } = payload;

    if (!current_exercise_id || !pain_node_id || !pain_nrs) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // PERFORMANCE FIX: Load exercises + rehab plan in parallel, single call
    const [allExercisesData, rehabPlans] = await Promise.all([
      base44.asServiceRole.entities.Exercise.list('-updated_date', 500),
      base44.asServiceRole.entities.RehabPlan.filter({ user_email, status: 'active' })
    ]);

    const currentExercise = allExercisesData.find(e => e.exercise_id === current_exercise_id);

    if (!currentExercise) {
      return Response.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const rehabPlan = rehabPlans[0];
    if (!rehabPlan) {
      return Response.json({ error: 'No active rehab plan found' }, { status: 404 });
    }

    const isYellowMode = pain_nrs >= 5 && pain_nrs <= 7;
    const isRedMode = pain_nrs >= 8;
    const readiness_status = isRedMode ? 'red' : 'yellow';

    // Delegate to Smart Filter Engine (deterministic, no AI, single exercise cache)
    const filterResult = await base44.asServiceRole.functions.invoke('smartFilterAlternatives', {
      current_exercise_id,
      pain_nodes: [pain_node_id],
      readiness_status,
      mode: 'regress'
    });

    const bestCandidate = filterResult?.best_match || null;

    if (!bestCandidate) {
      return Response.json({
        success: false,
        error: 'No suitable alternative found',
        action: 'red_stop',
        message: 'Leider können wir keine sichere Alternative finden. Lass uns diese Session beenden.'
      }, { status: 200 });
    }

    return Response.json({
      success: true,
      substituted_exercise_id: bestCandidate.exercise_id,
      exercise_name: bestCandidate.name,
      exercise_data: {
        exercise_id: bestCandidate.exercise_id,
        name: bestCandidate.name,
        description: bestCandidate.description,
        axon_moment: bestCandidate.axon_moment,
        cues: bestCandidate.cues || [],
        breathing_instruction: bestCandidate.breathing_instruction
      },
      reasoning: filterResult.reasoning,
      action_taken: isYellowMode ? 'modify_parameter' : 'pivot_to_drill',
      intervention_mode: isYellowMode ? 'yellow_pivot' : 'red_stop',
      confidence: 0.9
    });

  } catch (error) {
    console.error('liveAdjustAlgorithm error:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});