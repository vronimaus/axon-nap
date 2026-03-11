import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { diagnosis_session_id, problem_summary, region, pain_intensity } = payload;

    if (!diagnosis_session_id || !problem_summary) {
      return Response.json(
        { error: 'Missing required fields: diagnosis_session_id, problem_summary' },
        { status: 400 }
      );
    }

    // Generate a basic 3-phase rehab plan using LLM
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Experte für Rehabilitation und Bewegungstherapie. Erstelle einen detaillierten 3-Phasen-Rehabilitationsplan basierend auf folgende Informationen:

Problem: ${problem_summary}
Betroffene Region: ${region}
Schmerzintensität: ${pain_intensity}/10

Der Plan sollte in JSON-Format sein mit folgendem Aufbau:
{
  "phases": [
    {
      "phase_number": 1,
      "title": "Akut-Linderung",
      "description": "...",
      "duration_days": 7-14,
      "exercises": [
        {
          "exercise_id": "mfr_...",
          "name": "...",
          "sets_reps_tempo": "...",
          "instruction": "...",
          "notes": "...",
          "category": "mfr|neuro|mobility|strength"
        }
      ]
    },
    {
      "phase_number": 2,
      "title": "Aufbau & Stabilität",
      "description": "...",
      "duration_days": 14-21,
      "exercises": [...]
    },
    {
      "phase_number": 3,
      "title": "Integration & Prävention",
      "description": "...",
      "duration_days": 7-14,
      "exercises": [...]
    }
  ]
}

Beachte:
- MFR-Techniken für die betroffene Region
- Neurologische Drills zur Verankerung
- Funktionale Übungen zur Stabilisierung
- Klare, umsetzbare Anweisungen für den Nutzer`,
      response_json_schema: {
        type: 'object',
        properties: {
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                phase_number: { type: 'integer' },
                title: { type: 'string' },
                description: { type: 'string' },
                duration_days: { type: 'integer' },
                exercises: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      exercise_id: { type: 'string' },
                      name: { type: 'string' },
                      sets_reps_tempo: { type: 'string' },
                      instruction: { type: 'string' },
                      notes: { type: 'string' },
                      category: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!llmResponse?.phases) {
      throw new Error('LLM did not return valid phases structure');
    }

    // Create RehabPlan entity
    const rehabPlan = await base44.entities.RehabPlan.create({
      user_email: user.email,
      diagnosis_session_id,
      problem_summary,
      status: 'active',
      current_phase: 1,
      phase_start_date: new Date().toISOString().split('T')[0],
      plan_generated_date: new Date().toISOString().split('T')[0],
      phases: llmResponse.phases,
      feedback_history: [],
      expert_notes: `Plan erstellt für ${region} mit Schmerzintensität ${pain_intensity}/10`,
      recommended_mfr_routines: [],
      recommended_faqs: [],
      live_adjust_log: [],
      session_status: 'active'
    });

    console.log(`RehabPlan created: ${rehabPlan.id} for user ${user.email}`);

    return Response.json({
      success: true,
      plan_id: rehabPlan.id,
      message: 'Rehabplan erfolgreich erstellt'
    });
  } catch (error) {
    console.error('generateRehabPlan error:', error);
    return Response.json(
      { error: error.message || 'Fehler beim Erstellen des Rehabplans' },
      { status: 500 }
    );
  }
});