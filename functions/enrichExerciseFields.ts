// v4 - using base44 InvokeLLM
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { /* not authenticated */ }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const entityId = body.exercise_id;
    if (!entityId) return Response.json({ error: 'exercise_id required' }, { status: 400 });

    // Load the exercise record
    const ex = await base44.asServiceRole.entities.Exercise.get(entityId);

    // Determine which fields need filling
    const needsFill = (v) => !v || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

    const missingFields = [];
    if (needsFill(ex.description)) missingFields.push('description');
    if (needsFill(ex.benefits)) missingFields.push('benefits');
    if (needsFill(ex.goal_explanation)) missingFields.push('goal_explanation');
    if (needsFill(ex.axon_moment)) missingFields.push('axon_moment');
    if (needsFill(ex.purpose_explanation)) missingFields.push('purpose_explanation');
    if (needsFill(ex.breathing_instruction)) missingFields.push('breathing_instruction');
    if (needsFill(ex.cues)) missingFields.push('cues');
    if (needsFill(ex.modification_suggestions_yellow)) missingFields.push('modification_suggestions_yellow');
    if (needsFill(ex.modification_suggestions_red)) missingFields.push('modification_suggestions_red');

    if (missingFields.length === 0) {
      return Response.json({ success: true, message: 'Alle Felder bereits befüllt', updated: {} });
    }

    const context = `
Übung: ${ex.name}
Exercise ID: ${ex.exercise_id}
Kategorie: ${ex.category}
Schwierigkeit: ${ex.difficulty}
Progressions-Level: ${ex.progression_level}
Faszien-Kette (Stecco): ${ex.stecco_chain || 'nicht angegeben'}
FMS Pattern: ${ex.fms_pattern || 'nicht angegeben'}
Beschreibung (Ausführung): ${ex.description || 'nicht vorhanden'}
AXON Moment: ${ex.axon_moment || 'nicht vorhanden'}
Purpose Explanation: ${ex.purpose_explanation || 'nicht vorhanden'}
Atemführung: ${ex.breathing_instruction || 'nicht vorhanden'}
Cues: ${(ex.cues || []).join(', ') || 'nicht vorhanden'}
Benefits: ${ex.benefits || 'nicht vorhanden'}
Ziel-Erklärung: ${ex.goal_explanation || 'nicht vorhanden'}
Neuro Impact: ${(ex.neuro_impact_type || []).join(', ') || 'nicht angegeben'}
Mechanischer Impact: ${(ex.mechanical_impact_type || []).join(', ') || 'nicht angegeben'}
McGill Safety: ${ex.mcgill_safety || 'nicht angegeben'}
`.trim();

    const fieldDescriptions = {
      benefits: '"benefits": Konkrete, spürbare Vorteile für den User in 2-3 Sätzen. Alltagsrelevant & motivierend formuliert.',
      goal_explanation: '"goal_explanation": Warum ist diese Übung im Rehab-/Trainingskontext wichtig? 2-3 Sätze, wissenschaftlich aber verständlich.',
      axon_moment: '"axon_moment": EIN prägnanter Satz was der User jetzt in seinem Körper/Gehirn spüren soll. Beginnt mit "Du spürst..." oder "Dein Gehirn...". Max. 1-2 Sätze.',
      purpose_explanation: '"purpose_explanation": Erklärt den biomechanischen/neurologischen Zweck der Übung. Für gebildete Laien, 2-3 Sätze.',
      breathing_instruction: '"breathing_instruction": Konkrete Atemanweisung: wann einatmen, wann ausatmen, Rhythmus. Kurz und präzise.',
      cues: '"cues": Array von 3-5 kurzen Coaching-Cues. Jeder Cue max. 5-7 Wörter.',
      modification_suggestions_yellow: '"modification_suggestions_yellow": Was tun bei "gelb" (leichter Schmerz/Unwohlsein)? Konkrete Anpassungen. 1-3 Sätze.',
      modification_suggestions_red: '"modification_suggestions_red": Was tun bei "rot" (starker Schmerz, erschöpft)? z.B. Übung streichen oder durch MFR ersetzen. 1-3 Sätze.',
    };

    const requestedFields = missingFields.map(f => fieldDescriptions[f]).join('\n');

    const prompt = `Du bist Experte für Neuro-Athletic Training, myofasziale Therapie und Bewegungsrehabilitation (Stecco, McGill, Myers, Pavel, Starrett).

AUFGABE: Befülle die fehlenden Felder für diese Übung auf Deutsch. Antworte AUSSCHLIESSLICH mit einem JSON-Objekt.

ÜBUNGS-KONTEXT:
${context}

FEHLENDE FELDER:
${requestedFields}

WICHTIG: "cues" ist ein Array von Strings, alle anderen Felder sind Strings. Sprache: Deutsch. Tone: professionell, motivierend.`;

    // Build JSON schema for the missing fields
    const schemaProps = {};
    for (const f of missingFields) {
      if (f === 'cues') {
        schemaProps[f] = { type: 'array', items: { type: 'string' } };
      } else {
        schemaProps[f] = { type: 'string' };
      }
    }

    const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: schemaProps
      }
    });

    // Only update fields that were actually missing and generated
    const update = {};
    for (const field of missingFields) {
      if (generated[field] !== undefined && generated[field] !== null) {
        update[field] = generated[field];
      }
    }

    if (Object.keys(update).length > 0) {
      await base44.asServiceRole.entities.Exercise.update(entityId, update);
    }

    return Response.json({ success: true, updated: update, fields: Object.keys(update) });
  } catch (error) {
    console.error('enrichExerciseFields error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});