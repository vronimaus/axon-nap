import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { diagnosis_session_id } = await req.json();

    if (!diagnosis_session_id) {
      return Response.json({ error: 'diagnosis_session_id required' }, { status: 400 });
    }

    // Fetch diagnosis session
    let diagnosisSession;
    try {
      diagnosisSession = await base44.asServiceRole.entities.DiagnosisSession.filter(
        { id: diagnosis_session_id }
      );
      diagnosisSession = diagnosisSession[0];
    } catch {
      diagnosisSession = null;
    }

    if (!diagnosisSession) {
      return Response.json({ error: 'DiagnosisSession not found' }, { status: 404 });
    }

    // Fetch all routines and FAQs for matching
    const allRoutines = await base44.entities.Routine.list('-updated_date', 100);
    const allFaqs = await base44.entities.FAQ.list('-updated_date', 100);

    // Prepare context for AI
    const routinesContext = allRoutines
      .filter(r => r.published !== false)
      .map(r => `ID: ${r.id}, Name: ${r.routine_name}, Category: ${r.category}, Duration: ${r.total_duration}min, Description: ${r.description}`)
      .join('\n');

    const faqsContext = allFaqs
      .filter(f => f.published !== false)
      .map(f => `ID: ${f.faq_id}, Q: ${f.question}, Category: ${f.category}`)
      .join('\n');

    // Call LLM for plan generation
    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Experte für Rehabilitations-Planung im AXON Protocol.

Diagnose-Informationen:
- Symptom-Ort: ${diagnosisSession.symptom_location}
- Symptom-Beschreibung: ${diagnosisSession.symptom_description}
- Diagnose-Typ: ${diagnosisSession.diagnosis_type}
- Getestete Ketten: ${diagnosisSession.tested_chains?.join(', ')}
- Empfehlungen aus Diagnose: ${diagnosisSession.recommendations?.join(', ')}

Problem-Zusammenfassung: ${diagnosisSession.symptom_location} - ${diagnosisSession.symptom_description}

Verfügbare Routines (für Empfehlungen):
${routinesContext}

Verfügbare FAQs (für Empfehlungen):
${faqsContext}

Generiere einen strukturierten Rehab-Plan als JSON mit:
1. 3 Phasen (je 3-7 Tage), progressiv aufbauend
2. Pro Phase: 4-6 Rehabilitations-Übungen
3. 3 empfohlene MFR/Mobility Routines (nur IDs aus der Liste oben!)
4. 3 empfohlene FAQs (nur IDs aus der Liste oben!)

Für jede Empfehlung: nur die ID + ein 1-2 Satz reason warum es relevant ist.

Format: {
  "phases": [
    {
      "phase_number": 1,
      "title": "...",
      "description": "...",
      "duration_days": 5,
      "exercises": [
        {
          "exercise_id": "...",
          "name": "...",
          "sets_reps_tempo": "2x8 @ 2-1-2",
          "instruction": "...",
          "notes": "...",
          "category": "mobility"
        }
      ]
    }
  ],
  "recommended_mfr_routines": [
    {
      "routine_id": "...",
      "routine_name": "...",
      "reason": "..."
    }
  ],
  "recommended_faqs": [
    {
      "faq_id": "...",
      "question": "...",
      "reason": "..."
    }
  ]
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          phases: { 
            type: 'array',
            items: { type: 'object' }
          },
          recommended_mfr_routines: { 
            type: 'array',
            items: { type: 'object' }
          },
          recommended_faqs: { 
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    });

    // Validate response structure
    if (!planData.phases || !Array.isArray(planData.phases) || planData.phases.length === 0) {
      return Response.json({ 
        error: 'LLM response missing valid phases array' 
      }, { status: 502 });
    }

    // Validate referenced IDs exist
    const invalidRoutines = [];
    for (const routine of planData.recommended_mfr_routines || []) {
      const exists = allRoutines.find(r => r.id === routine.routine_id);
      if (!exists) invalidRoutines.push(routine.routine_id);
    }
    if (invalidRoutines.length > 0) {
      return Response.json({ 
        error: `Routines not found: ${invalidRoutines.join(', ')}` 
      }, { status: 400 });
    }

    const invalidFaqs = [];
    for (const faq of planData.recommended_faqs || []) {
      const exists = allFaqs.find(f => f.faq_id === faq.faq_id);
      if (!exists) invalidFaqs.push(faq.faq_id);
    }
    if (invalidFaqs.length > 0) {
      return Response.json({ 
        error: `FAQs not found: ${invalidFaqs.join(', ')}` 
      }, { status: 400 });
    }

    // Create rehab plan
    const plan = await base44.entities.RehabPlan.create({
      user_email: user.email,
      diagnosis_session_id,
      problem_summary: `${diagnosisSession.symptom_location} - ${diagnosisSession.symptom_description}`,
      phases: planData.phases,
      recommended_mfr_routines: planData.recommended_mfr_routines,
      recommended_faqs: planData.recommended_faqs,
      plan_generated_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      status: 'active'
    });

    return Response.json({ 
      success: true, 
      plan_id: plan.id,
      plan 
    });

  } catch (error) {
    console.error('generateRehabPlan error:', error);

    // Detailed error logging
    if (error.message.includes('JSON')) {
      return Response.json({ 
        error: 'LLM returned invalid JSON - plan generation failed' 
      }, { status: 502 });
    }

    return Response.json({ 
      error: error.message || 'Unknown error during plan generation',
      type: 'PLAN_GENERATION_ERROR'
    }, { status: 500 });
  }
});