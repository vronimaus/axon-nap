import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Reclassifies all exercises with category "mobility" or "other"
// into one of the 6 Dan John movement patterns: push, pull, squat, hinge, core, carry
// Also cleans up: neuro→neuro stays, mfr→mfr stays, breath→breath stays

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const VALID_PATTERNS = ['push', 'pull', 'squat', 'hinge', 'core', 'carry'];
  const SKIP_CATEGORIES = ['neuro', 'mfr', 'breath', 'breathwork', 'push', 'pull', 'squat', 'hinge', 'core', 'carry'];

  // Load all exercises that need reclassification
  const allExercises = await base44.asServiceRole.entities.Exercise.list('-updated_date', 500);
  const toReclassify = allExercises.filter(ex => !SKIP_CATEGORIES.includes(ex.category));

  console.log(`Found ${toReclassify.length} exercises to reclassify`);

  if (toReclassify.length === 0) {
    return Response.json({ message: 'Nothing to reclassify', updated: 0 });
  }

  // Build a compact list for LLM
  const exerciseList = toReclassify.map(ex => ({
    id: ex.id,
    exercise_id: ex.exercise_id,
    name: ex.name,
    category: ex.category,
    description: (ex.description || '').substring(0, 100),
  }));

  // Process in batches of 30 to avoid token limits
  const BATCH_SIZE = 30;
  let totalUpdated = 0;
  const errors = [];

  for (let i = 0; i < exerciseList.length; i += BATCH_SIZE) {
    const batch = exerciseList.slice(i, i + BATCH_SIZE);

    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE)+1}: exercises ${i+1}-${Math.min(i+BATCH_SIZE, exerciseList.length)}`);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Du bist Sportwissenschaftler und kennst Dan Johns 6 Grundbewegungsmuster.
Weise jeder Übung in der Liste GENAU einem der 6 Muster zu: push, pull, squat, hinge, core, carry.

Regeln:
- push: Druckbewegungen (Liegestütz, Schulterdrücken, Dips, horizontales/vertikales Drücken)
- pull: Zugbewegungen (Klimmzüge, Rudern, Face Pulls, Bizeps)
- squat: Kniebeugen-Muster (Squat, Lunge, Split Squat, Pistol, Step Up)
- hinge: Hüftstreck-Muster (Deadlift, RDL, Swing, Good Morning, Hip Thrust, Glute Bridge)
- core: Rumpfstabilität (Plank, Bird Dog, Dead Bug, Side Bridge, Rotation, Ab-Übungen, Wirbelsäulenmobilität)
- carry: Tragen und Loaded Carries (Farmers Walk, Suitcase Carry, Overhead Carry)
- Tibialis Raises, Wadenheben, Mobility-Übungen ohne klares Muster → squat oder hinge je nach betroffener Gelenkregion
- Atemübungen, Spinal Waves, Wirbelsäulenmobilität → core
- Hip CARs, Hip Circles, Hüftmobilität → hinge
- Schulter CARs, Thoraxrotation, T-Spine → push oder core
- Schultermobilität → pull
- Kniemobilität, Tibialis → squat

Antworte NUR mit JSON:
{"assignments": [{"id": "<db_id>", "category": "<pattern>"}]}

Übungen:
${JSON.stringify(batch, null, 2)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          assignments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                category: { type: 'string' }
              },
              required: ['id', 'category']
            }
          }
        },
        required: ['assignments']
      }
    });

    if (!result?.assignments) {
      console.error('No assignments returned for batch', i);
      errors.push(`Batch ${i}: no assignments`);
      continue;
    }

    // Update each exercise
    for (const assignment of result.assignments) {
      if (!VALID_PATTERNS.includes(assignment.category)) {
        console.warn(`Invalid category "${assignment.category}" for id ${assignment.id}, skipping`);
        continue;
      }
      await base44.asServiceRole.entities.Exercise.update(assignment.id, {
        category: assignment.category
      });
      totalUpdated++;
    }

    console.log(`Batch done. Updated ${result.assignments.length} exercises.`);
  }

  return Response.json({
    message: `Reclassification complete`,
    total_found: toReclassify.length,
    updated: totalUpdated,
    errors
  });
});