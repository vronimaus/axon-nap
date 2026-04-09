import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Phase 2: Bulk-Enrichment der Exercise-Datenbank
 * 
 * Befüllt für alle Exercises:
 * 1. laterality (bilateral / unilateral_left / unilateral_right / alternating / asymmetric)
 * 2. movement_plane (sagittal / frontal / transverse / multi_planar)
 * 3. stability_degree (high_stability / moderate_stability / low_stability / unstable)
 * 4. Remapping von alten N1-N12 affected_nodes auf neue Stecco-Node-IDs
 */

// Mapping: alte Legacy-IDs → neue Stecco-Node-IDs
const LEGACY_NODE_MAP = {
  'N1': 'CP-P',   // Schädelbasis / Nacken
  'N2': 'TH-P',   // BWS posterior / Schulterblätter
  'N3': 'TH-A',   // BWS anterior / Brustbein
  'N4': 'LU-P',   // LWS posterior
  'N5': 'LU-A',   // LWS anterior / Hüftbeuger
  'N6': 'CX-A',   // Hüfte anterior / Hüftbeuger
  'N7': 'CX-P',   // Hüfte posterior / Gesäß
  'N8': 'GE-P',   // Knie posterior / Hamstrings
  'N9': 'GE-A',   // Knie anterior / Oberschenkel
  'N10': 'TA-P',  // Sprunggelenk posterior / Wade
  'N11': 'TA-A',  // Sprunggelenk anterior / Tibialis
  'N12': 'PE-A',  // Fuß / Zehen
};

function remapNodes(nodes) {
  if (!nodes || !Array.isArray(nodes)) return nodes;
  return nodes.map(n => LEGACY_NODE_MAP[n] || n);
}

const BATCH_SIZE = 15;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const forceAll = body.force_all === true; // re-enrich even if fields exist

  // Load all exercises
  const allExercises = await base44.asServiceRole.entities.Exercise.list('-updated_date', 500);
  console.log(`Loaded ${allExercises.length} exercises`);

  // Filter: only those missing at least one new field (unless force_all)
  const toEnrich = forceAll
    ? allExercises
    : allExercises.filter(ex =>
        !ex.laterality || !ex.movement_plane || !ex.stability_degree ||
        (ex.affected_nodes || []).some(n => LEGACY_NODE_MAP[n])
      );

  console.log(`Exercises to enrich: ${toEnrich.length}`);

  if (toEnrich.length === 0) {
    return Response.json({ message: 'All exercises already enriched', updated: 0 });
  }

  let updated = 0;
  let errors = [];

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}–${Math.min(i + BATCH_SIZE, toEnrich.length)})`);

    const batchInput = batch.map(ex => ({
      id: ex.id,
      name: ex.name,
      exercise_id: ex.exercise_id || '',
      category: ex.category || '',
      description: (ex.description || '').substring(0, 150),
    }));

    let result;
    try {
      result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Du bist Sportwissenschaftler und Bewegungsexperte (Dan John, Gary Gray, Pavel). 
Analysiere jede Übung und vergib exakt die korrekten Werte für 3 Felder.

FELDER-DEFINITIONEN:

laterality:
- bilateral = beide Seiten gleichzeitig, symmetrisch (Goblet Squat, Deadlift, Push-Up, Pull-Up, Farmers Walk mit 2 KB)
- alternating = wechselseitig (Bird Dog, Alternating Lunge, Alternating KB Swing)
- asymmetric = asymmetrisch aber bilateral ausgeführt (Suitcase Carry, Rack Walk 1 KB)
- unilateral_left = explizit nur linke Seite
- unilateral_right = explizit nur rechte Seite
Hinweis: Wenn die Übung "einarmig" oder "einbeinig" oder "Single Leg/Arm" im Namen hat → alternating (weil beide Seiten nacheinander trainiert werden)

movement_plane:
- sagittal = Bewegung vor/zurück (Squat, Deadlift, Push-Up, Pull-Up, Lunge vorwärts, Swing)
- frontal = Bewegung seitlich (Lateral Lunge, Side Bridge, Suitcase Carry, Lateral Raise)
- transverse = Rotation (Rotational Swing, Woodchop, Bird Dog mit Rotation, Getaway Lunge)
- multi_planar = mehrere Ebenen gleichzeitig (Turkish Get-Up, KB Complex, Burpee, Suspended Alligator)

stability_degree:
- high_stability = fester Untergrund, bilateral, kein instabiles Element (KB Deadlift, Goblet Squat, Push-Up am Boden, Farmers Walk)
- moderate_stability = asymmetrisch ODER einbeinig auf festem Boden ODER Wand-Unterstützung (Single Leg RDL, B-Stance RDL, Suitcase Carry, Wall Circles)
- low_stability = Schlingentrainer/TRX bilateral ODER instabiles Element bilateral (Suspended Row, Suspended Push, Suspended Hip Hinge)
- unstable = Schlingentrainer einbeinig/unilateral ODER maximal instabil (Suspended Single Leg Squat, Suspended Lunge, Suspended L-Sit)

Antworte NUR mit diesem JSON-Format:
{
  "assignments": [
    {
      "id": "<db_id>",
      "laterality": "<wert>",
      "movement_plane": "<wert>",
      "stability_degree": "<wert>"
    }
  ]
}

Übungen:
${JSON.stringify(batchInput, null, 2)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            assignments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  laterality: { type: 'string' },
                  movement_plane: { type: 'string' },
                  stability_degree: { type: 'string' },
                },
                required: ['id', 'laterality', 'movement_plane', 'stability_degree']
              }
            }
          },
          required: ['assignments']
        }
      });
    } catch (e) {
      console.error(`LLM error on batch ${i}:`, e.message);
      errors.push(`Batch ${i}: ${e.message}`);
      continue;
    }

    if (!result?.assignments) {
      console.warn(`No assignments returned for batch ${i}`);
      errors.push(`Batch ${i}: no assignments`);
      continue;
    }

    // Validate enums
    const VALID_LATERALITY = ['bilateral', 'unilateral_left', 'unilateral_right', 'alternating', 'asymmetric'];
    const VALID_PLANE = ['sagittal', 'frontal', 'transverse', 'multi_planar'];
    const VALID_STABILITY = ['high_stability', 'moderate_stability', 'low_stability', 'unstable'];

    for (const assignment of result.assignments) {
      if (
        !VALID_LATERALITY.includes(assignment.laterality) ||
        !VALID_PLANE.includes(assignment.movement_plane) ||
        !VALID_STABILITY.includes(assignment.stability_degree)
      ) {
        console.warn(`Invalid values for ${assignment.id}:`, assignment);
        errors.push(`Invalid enum for exercise ${assignment.id}`);
        continue;
      }

      // Find original exercise to remap nodes
      const original = batch.find(ex => ex.id === assignment.id);
      const updatePayload = {
        laterality: assignment.laterality,
        movement_plane: assignment.movement_plane,
        stability_degree: assignment.stability_degree,
      };

      // Remap legacy N1-N12 nodes if present
      if (original) {
        const originalEx = toEnrich.find(ex => ex.id === assignment.id);
        if (originalEx?.affected_nodes?.some(n => LEGACY_NODE_MAP[n])) {
          updatePayload.affected_nodes = remapNodes(originalEx.affected_nodes);
          console.log(`Remapping nodes for ${originalEx.exercise_id}: ${originalEx.affected_nodes} → ${updatePayload.affected_nodes}`);
        }
      }

      await base44.asServiceRole.entities.Exercise.update(assignment.id, updatePayload);
      updated++;
    }

    console.log(`Batch done. Running total updated: ${updated}`);
  }

  return Response.json({
    message: 'Phase 2 Enrichment complete',
    total_found: allExercises.length,
    to_enrich: toEnrich.length,
    updated,
    errors,
  });
});