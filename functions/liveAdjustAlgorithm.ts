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

    // Fetch current exercise for context
    const allExercises = await base44.asServiceRole.entities.Exercise.list();
    const currentExercise = allExercises.find(e => e.exercise_id === current_exercise_id);

    if (!currentExercise) {
      return Response.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Get the user's rehab plan for phase context
    const rehabPlans = await base44.asServiceRole.entities.RehabPlan.filter({ 
      user_email,
      status: 'active'
    });

    const rehabPlan = rehabPlans[0];
    if (!rehabPlan) {
      return Response.json({ error: 'No active rehab plan found' }, { status: 404 });
    }

    // Fetch all exercises to find suitable alternatives
    const allExercisesData = await base44.asServiceRole.entities.Exercise.list();

    // Filter criteria based on pain_nrs
    // NRS 6-7 = Yellow (modify/regress)
    // NRS 8+ = Red (stop/replace with ISO)
    const isYellowMode = pain_nrs >= 5 && pain_nrs <= 7;
    const isRedMode = pain_nrs >= 8;

    // Find suitable alternatives
    const candidates = allExercisesData.filter(exercise => {
      // Same progression level or easier
      if (exercise.progression_level > currentExercise.progression_level) {
        return false;
      }

      // Must NOT have the pain node in contraindications
      const contraindications = exercise.smart_tags?.contraindications || [];
      const hasContraindication = contraindications.some(c => c.condition && c.condition.includes(pain_node_id));
      if (hasContraindication) {
        return false;
      }

      // Yellow mode: look for reduced load
      if (isYellowMode) {
        const compressionDemand = exercise.smart_tags?.biomechanical_stress?.compression_demand || 10;
        if (compressionDemand > 4) return false;
      }

      // Red mode: only ISO or bodyweight with minimal compression
      if (isRedMode) {
        const loadCategory = exercise.smart_tags?.execution_parameters?.load_category;
        const compressionDemand = exercise.smart_tags?.biomechanical_stress?.compression_demand || 10;
        if (loadCategory === 'heavy' || loadCategory === 'explosive') return false;
        if (compressionDemand > 3) return false;
      }

      // Prefer same category or related category
      if (exercise.category === currentExercise.category) {
        return true;
      }

      // Allow core/stability for any exercise in yellow/red mode
      if ((isYellowMode || isRedMode) && (exercise.category === 'core' || exercise.category === 'mobility')) {
        return true;
      }

      return false;
    });

    if (candidates.length === 0) {
      return Response.json({
        success: false,
        error: 'No suitable alternative found',
        action: 'red_stop',
        message: 'Leider können wir keine sichere Alternative finden. Lass uns diese Session beenden.'
      }, { status: 200 });
    }

    // Select best candidate (prefer ISO/static over dynamic in red mode)
    let bestCandidate = candidates[0];
    if (isRedMode) {
      const isoCandidates = candidates.filter(e => 
        e.smart_tags?.mechanical_impact_type?.includes('stability') && !e.smart_tags?.mechanical_impact_type?.includes('explosive')
      );
      if (isoCandidates.length > 0) {
        bestCandidate = isoCandidates[0];
      }
    }

    return Response.json({
      success: true,
      substituted_exercise_id: bestCandidate.exercise_id,
      exercise_name: bestCandidate.name,
      reasoning: isYellowMode 
        ? `Deine Schmerzintensität (${pain_nrs}/10) erfordert eine modifizierte Übung. ${bestCandidate.name} reduziert die Belastung auf ${pain_node_id}, während wir die Kette aktiv halten.`
        : `Eine Schmerzintensität von ${pain_nrs}/10 ist kritisch. Wir stoppen die aktuelle Übung und nutzen ${bestCandidate.name} – eine isometrische, sichere Alternative.`,
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