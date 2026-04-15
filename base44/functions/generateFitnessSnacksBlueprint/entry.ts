import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Load exercises and MFR nodes
    const [exercises, mfrNodes] = await Promise.all([
      base44.entities.Exercise.list(),
      base44.entities.MFRNode.list()
    ]);

    // Helper to categorize exercises
    const getExercisesByCategory = (categories) => {
      return exercises.filter(ex => categories.includes(ex.category));
    };

    // Master Prompt Blueprint für LLM
    const generateMasterPrompt = (readinessState, userNotes = '') => {
      const blueprints = {
        red: {
          block1: { duration: '1 min', categories: ['neuro', 'mobility'], description: 'Zwerchfell-Atmung oder visueller Drill' },
          block2: { duration: '2 min', categories: ['core'], description: 'Bodenübungen ohne Geräte, z.B. Dead Bug oder Stir the Pot' },
          block3: { duration: '1-2 min', categories: ['mobility'], description: 'MFR Nacken oder Lendenwirbelsäule' }
        },
        yellow: {
          block1: { duration: '2 min', categories: ['mobility'], description: 'Dynamische Mobilität wie Thoracic Bridge oder Wall Circles' },
          block2: { duration: '3-4 min', categories: ['push', 'pull', 'squat', 'hinge'], description: 'Bodyweight oder Schlingentrainer, 2 komplementäre Muster' },
          block3: { duration: '1-2 min', categories: ['mobility'], description: 'MFR passend zu Block 2 Nodes' }
        },
        green: {
          block1: { duration: '1 min', categories: ['neuro'], description: 'Suspended Gaze Stability oder visueller Balance-Drill' },
          block2: { duration: '5-7 min', categories: ['push', 'pull', 'squat', 'hinge', 'carry'], description: '2 komplementäre Muster mit Kettlebell oder Suspension explosiv' },
          block3: { duration: '2 min', categories: ['mobility'], description: 'MFR für Laktatabbau, passend zu Block 2 Nodes' }
        }
      };

      const blueprint = blueprints[readinessState] || blueprints.yellow;

      return `Du bist der AXON Neuro-Athletic-Algorithm. Generiere einen hochpräzisen Fitness-Snack für den ${readinessState.toUpperCase()} Readiness-State.

**STRUKTUR (streng einhalten):**
- Block 1 (Neuronales Priming): ${blueprint.block1.duration} - ${blueprint.block1.description}
- Block 2 (Mechanische Belastung): ${blueprint.block2.duration} - ${blueprint.block2.description}
- Block 3 (Faszialer Reset): ${blueprint.block3.duration} - ${blueprint.block3.description}

**KRITISCHE RULES:**
1. Wähle Übungen AUSSCHLIESSLICH aus der AXON-Datenbank.
2. Block 3 (MFR) MUSS die exact gleichen "affected_nodes" wie Block 2 adressieren (Node-Matching-Rule).
3. Gesamtdauer: ${readinessState === 'red' ? '4-5' : readinessState === 'yellow' ? '6-8' : '8-10'} Minuten.
4. Jeder Step braucht: title, instruction, duration_seconds, type (exercise/rest/mfr_cooldown), sets (optional), reps (optional), cue (optional).

**Antworte als REINES JSON (kein Markdown):**
{
  "name": "Snack Name",
  "subtitle": "Kurzer motivierender Untertitel",
  "description": "Was der User konkret tut",
  "duration_minutes": X,
  "type": "strength_snack|mobility_snack|hiit",
  "hormesis_type": "mechanical|thermal|metabolic|oxidative|hypoxic",
  "intensity": "low|medium|high",
  "readiness_gate": "${readinessState}",
  "sequence": [
    { "title": "...", "instruction": "...", "duration_seconds": X, "type": "exercise", "sets": 3, "reps": "...", "cue": "..." },
    ...
  ],
  "longevity_benefit": "Was der User gewinnt (z.B. VO2max ↑, BDNF ↑)"
}`;
    };

    // Generate snacks for each readiness state
    const snacksToCreate = [];
    const readinessStates = ['red', 'yellow', 'green'];
    const snacksPerState = 2; // 2 Snacks pro State = 6 total

    for (const state of readinessStates) {
      for (let i = 0; i < snacksPerState; i++) {
        try {
          const prompt = generateMasterPrompt(state);
          
          const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                subtitle: { type: 'string' },
                description: { type: 'string' },
                duration_minutes: { type: 'integer', minimum: 1, maximum: 10 },
                type: { type: 'string', enum: ['strength_snack', 'mobility_snack', 'hiit', 'zone2', 'sprint', 'breathwork'] },
                hormesis_type: { type: 'string', enum: ['mechanical', 'thermal', 'metabolic', 'oxidative', 'hypoxic'] },
                intensity: { type: 'string', enum: ['low', 'medium', 'high'] },
                readiness_gate: { type: 'string', enum: ['red', 'yellow', 'green'] },
                sequence: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      instruction: { type: 'string' },
                      duration_seconds: { type: 'integer' },
                      type: { type: 'string' },
                      sets: { type: 'integer' },
                      reps: { type: 'string' },
                      cue: { type: 'string' }
                    }
                  }
                },
                longevity_benefit: { type: 'string' }
              }
            }
          });

          if (response && response.name) {
            snacksToCreate.push({
              ...response,
              is_active: true,
              required_equipment: 'none',
              color_class: state === 'red' ? 'red' : state === 'yellow' ? 'yellow' : 'emerald'
            });
          }
        } catch (err) {
          console.error(`Error generating snack for ${state} state (iteration ${i}):`, err);
        }
      }
    }

    // Create all snacks in DB
    if (snacksToCreate.length > 0) {
      await base44.entities.FitnessSnack.bulkCreate(snacksToCreate);
    }

    return Response.json({
      success: true,
      snacksCreated: snacksToCreate.length,
      snacks: snacksToCreate.map(s => ({ name: s.name, readiness_gate: s.readiness_gate, duration: s.duration_minutes }))
    });
  } catch (error) {
    console.error('Error in generateFitnessSnacksBlueprint:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});