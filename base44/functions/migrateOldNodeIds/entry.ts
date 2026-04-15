import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Migriert alte N1-N8 node_ids auf die neuen Stecco-IDs in:
 * 1. Routine.sequence[].node_id
 * 2. Exercise.affected_nodes[]
 * 3. Exercise.upgrade_blocked_if_pain_nodes[]
 */

const NODE_ID_MIGRATION = {
  'N1': 'CP-P',
  'N2': 'CL-P',
  'N3': 'TH-P',
  'N4': 'LU-P',
  'N5': 'PV-P',
  'N6': 'HU-A',
  'N7': 'CU-A',
  'N8': 'CA-A',
  'N9': 'CX-A',  // Coxa → Hüfte (aber CX-A oder CX-P?)
  'N10': 'GE-A', // Genu → Knie
  'N11': 'TA-A', // Tarsus → Sprunggelenk
  'N12': 'PE-A', // Metatarsus/Pes → Fuß
};

function migrateNodeId(nodeId) {
  if (!nodeId) return nodeId;
  return NODE_ID_MIGRATION[nodeId] || nodeId;
}

function migrateNodeArray(arr) {
  if (!arr || !Array.isArray(arr)) return arr;
  return arr.map(id => NODE_ID_MIGRATION[id] || id);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;

    const results = {
      routines_updated: 0,
      routine_steps_migrated: 0,
      exercises_updated: 0,
      exercise_nodes_migrated: 0,
      details: [],
    };

    // 1. Routines patchen
    const routines = await base44.asServiceRole.entities.Routine.list();
    for (const routine of routines) {
      if (!routine.sequence || !Array.isArray(routine.sequence)) continue;

      let changed = false;
      const updatedSequence = routine.sequence.map((step, idx) => {
        if (!step.node_id || !NODE_ID_MIGRATION[step.node_id]) return step;
        const newId = NODE_ID_MIGRATION[step.node_id];
        results.routine_steps_migrated++;
        changed = true;
        results.details.push({
          type: 'routine_step',
          routine: routine.routine_name,
          step: idx,
          old: step.node_id,
          new: newId,
        });
        return { ...step, node_id: newId };
      });

      if (changed && !dryRun) {
        await base44.asServiceRole.entities.Routine.update(routine.id, { sequence: updatedSequence });
        results.routines_updated++;
      } else if (changed) {
        results.routines_updated++;
      }
    }

    // 2. Exercises patchen (affected_nodes + upgrade_blocked_if_pain_nodes)
    const exercises = await base44.asServiceRole.entities.Exercise.list();
    for (const ex of exercises) {
      const hasOldAffected = ex.affected_nodes?.some(n => NODE_ID_MIGRATION[n]);
      const hasOldBlocked = ex.upgrade_blocked_if_pain_nodes?.some(n => NODE_ID_MIGRATION[n]);

      if (!hasOldAffected && !hasOldBlocked) continue;

      const updateData = {};
      if (hasOldAffected) {
        updateData.affected_nodes = migrateNodeArray(ex.affected_nodes);
        results.exercise_nodes_migrated += ex.affected_nodes.filter(n => NODE_ID_MIGRATION[n]).length;
        results.details.push({
          type: 'exercise_affected_nodes',
          exercise: ex.name,
          old: ex.affected_nodes,
          new: updateData.affected_nodes,
        });
      }
      if (hasOldBlocked) {
        updateData.upgrade_blocked_if_pain_nodes = migrateNodeArray(ex.upgrade_blocked_if_pain_nodes);
      }

      if (!dryRun) {
        await base44.asServiceRole.entities.Exercise.update(ex.id, updateData);
        results.exercises_updated++;
      } else {
        results.exercises_updated++;
      }
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      summary: results,
      message: dryRun
        ? `Dry Run: ${results.routine_steps_migrated} Routine-Steps + ${results.exercise_nodes_migrated} Exercise-Nodes würden migriert.`
        : `Migriert: ${results.routine_steps_migrated} Routine-Steps, ${results.exercise_nodes_migrated} Exercise-Nodes.`,
    });

  } catch (error) {
    console.error('migrateOldNodeIds error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});