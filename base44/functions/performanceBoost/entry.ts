import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// AXON Upgrade-System: Safety-Check Mapping
// Welche Nodes blockieren welches Upgrade
const UPGRADE_SAFETY_MAP = {
  'BW_SHO_001': { blocked_nodes: ['N10'], reason: 'Schulter-Schmerz erkannt – Mini-Band würde N10 zusätzlich belasten.' },
  'BW_LAT_001': { blocked_nodes: ['N10', 'N5'], reason: 'Seitliche Belastung wäre bei aktivem Schulter/Hüft-Schmerz zu hoch.' },
  'KB_SQU_001': { blocked_nodes: ['N7', 'N8'], reason: 'Freier Squat ohne Box erhöht Knie/LWS-Belastung.' },
  'KB_HIN_001': { blocked_nodes: ['N7', 'N8', 'N9'], reason: 'Asymmetrische Last beim B-Stance wäre bei aktivem Rücken/Hüft-Schmerz unsicher.' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rehabPlanId, exerciseId, currentPhaseIndex } = await req.json();

    if (!rehabPlanId || !exerciseId) {
      return Response.json({ error: 'rehabPlanId und exerciseId sind erforderlich' }, { status: 400 });
    }

    // 1. Fetch current rehab plan
    const rehabPlan = await base44.entities.RehabPlan.get(rehabPlanId);
    if (!rehabPlan) {
      return Response.json({ error: 'RehabPlan nicht gefunden' }, { status: 404 });
    }

    // 2. Fetch current exercise from DB (source of truth)
    const exercises = await base44.entities.Exercise.filter({ exercise_id: exerciseId });
    const currentExercise = exercises[0];

    if (!currentExercise) {
      return Response.json({ error: 'Übung nicht gefunden', blocked: true, reason: 'Übung nicht in Datenbank.' }, { status: 200 });
    }

    if (!currentExercise.next_progression_id) {
      return Response.json({ blocked: true, reason: 'Für diese Übung gibt es noch keine definierte Progression.' }, { status: 200 });
    }

    // 3. Safety-Check 1: NRS-History / Active Pain Nodes
    const activePainNodes = [];
    if (rehabPlan.pain_feedback_node) activePainNodes.push(rehabPlan.pain_feedback_node);
    // Also check live_adjust_log for recent ouch events in this session (last 24h)
    if (rehabPlan.live_adjust_log?.length > 0) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      rehabPlan.live_adjust_log
        .filter(log => log.node_feedback && new Date(log.timestamp) > oneDayAgo)
        .forEach(log => activePainNodes.push(log.node_feedback));
    }

    // Check if this upgrade is blocked by active pain nodes
    const safetyRule = UPGRADE_SAFETY_MAP[exerciseId];
    if (safetyRule && activePainNodes.length > 0) {
      const blockedNode = safetyRule.blocked_nodes.find(n => activePainNodes.includes(n));
      if (blockedNode) {
        return Response.json({
          blocked: true,
          reason: safetyRule.reason,
          blocked_by_node: blockedNode
        }, { status: 200 });
      }
    }

    // 4. Fetch the upgrade exercise
    const upgradeExercises = await base44.entities.Exercise.filter({ exercise_id: currentExercise.next_progression_id });
    const upgradeExercise = upgradeExercises[0];

    if (!upgradeExercise) {
      return Response.json({ blocked: true, reason: 'Die Upgrade-Übung wurde nicht in der Datenbank gefunden.' }, { status: 200 });
    }

    // 5. Apply the upgrade to the rehab plan
    const phaseIdx = typeof currentPhaseIndex === 'number' ? currentPhaseIndex : (rehabPlan.current_phase || 1) - 1;
    const updatedPhases = rehabPlan.phases.map((phase, idx) => {
      if (idx !== phaseIdx) return phase;
      return {
        ...phase,
        exercises: phase.exercises.map(ex => {
          if (ex.exercise_id !== exerciseId) return ex;
          return {
            ...ex,
            exercise_id: upgradeExercise.exercise_id,
            name: upgradeExercise.name,
            instruction: upgradeExercise.description,
            notes: `⬆️ Upgrade von ${currentExercise.name}: ${currentExercise.upgrade_boost_description || 'Performance-Modus aktiviert.'}`
          };
        })
      };
    });

    // 6. Log the upgrade action
    const adjustmentLog = {
      timestamp: new Date().toISOString(),
      exercise_id: exerciseId,
      exercise_name: currentExercise.name,
      action_taken: 'regress_exercise', // reusing existing enum - semantically "progression"
      new_exercise_id: upgradeExercise.exercise_id,
      reasoning: `Performance-Boost: User meldete positives Feedback. Upgrade auf ${upgradeExercise.name}. Neuro-Mechanischer Grund: ${currentExercise.upgrade_neuro_reason || 'Progression entlang definiertem Pfad.'}`,
      user_feedback_post_adjustment: 'feel_great'
    };

    await base44.entities.RehabPlan.update(rehabPlanId, {
      phases: updatedPhases,
      live_adjust_log: [...(rehabPlan.live_adjust_log || []), adjustmentLog]
    });

    return Response.json({
      success: true,
      upgraded_to: {
        exercise_id: upgradeExercise.exercise_id,
        name: upgradeExercise.name,
        description: upgradeExercise.description,
        axon_moment: upgradeExercise.axon_moment,
        progression_level: upgradeExercise.progression_level
      },
      message: `Boom! Dein Nervensystem ist heute im Performance-Modus. Wir schalten hoch auf ${upgradeExercise.name}. Zeig uns, was du drauf hast!`,
      boost_description: currentExercise.upgrade_boost_description,
      neuro_reason: currentExercise.upgrade_neuro_reason
    });

  } catch (error) {
    console.error('performanceBoost error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});