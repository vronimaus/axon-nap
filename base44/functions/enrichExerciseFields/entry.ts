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
    const needsFill = (v) => {
      if (!v || (Array.isArray(v) && v.length === 0)) return true;
      if (typeof v === 'string') {
        const trimmed = v.trim().toLowerCase();
        if (trimmed === '') return true;
        // Recognize placeholder/auto-generated content
        if (trimmed === 'auto-created from routine' || trimmed.startsWith('auto-created')) return true;
      }
      if (typeof v === 'object' && !Array.isArray(v)) {
        if (Object.keys(v).length === 0 || !v.label || !v.description) return true;
      }
      return false;
    };

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
    if (needsFill(ex.progression_basic)) missingFields.push('progression_basic');
    if (needsFill(ex.progression_advanced)) missingFields.push('progression_advanced');

    if (missingFields.length === 0) {
      return Response.json({ success: true, message: 'Alle Felder bereits befüllt', updated: {} });
    }

    // Only include existing (non-missing) fields as context so the LLM isn't confused
    const existingLines = [
      `Übung: ${ex.name}`,
      `Exercise ID: ${ex.exercise_id}`,
      `Kategorie: ${ex.category}`,
      `Schwierigkeit: ${ex.difficulty}`,
      `Progressions-Level: ${ex.progression_level}`,
      ex.stecco_chain ? `Faszien-Kette (Stecco): ${ex.stecco_chain}` : null,
      ex.fms_pattern ? `FMS Pattern: ${ex.fms_pattern}` : null,
      !needsFill(ex.description) ? `Beschreibung (Ausführung): ${ex.description}` : null,
      !needsFill(ex.axon_moment) ? `AXON Moment: ${ex.axon_moment}` : null,
      !needsFill(ex.purpose_explanation) ? `Purpose Explanation: ${ex.purpose_explanation}` : null,
      !needsFill(ex.breathing_instruction) ? `Atemführung: ${ex.breathing_instruction}` : null,
      !needsFill(ex.cues) ? `Cues: ${ex.cues.join(', ')}` : null,
      !needsFill(ex.benefits) ? `Benefits: ${ex.benefits}` : null,
      !needsFill(ex.goal_explanation) ? `Ziel-Erklärung: ${ex.goal_explanation}` : null,
      ex.neuro_impact_type?.length ? `Neuro Impact: ${ex.neuro_impact_type.join(', ')}` : null,
      ex.mechanical_impact_type?.length ? `Mechanischer Impact: ${ex.mechanical_impact_type.join(', ')}` : null,
      ex.mcgill_safety ? `McGill Safety: ${ex.mcgill_safety}` : null,
    ].filter(Boolean);

    const context = existingLines.join('\n');

    const fieldDescriptions = {
      description: '"description": Direkte Ansprache (Du-Form), z.B. "Stell dich aufrecht hin." Klar, präzise, in 3-5 Schritten. Auf Deutsch.',
      benefits: '"benefits": Konkrete, spürbare Vorteile für den User in 2-3 Sätzen. Alltagsrelevant & motivierend formuliert (Du-Form).',
      goal_explanation: '"goal_explanation": Warum ist diese Übung wichtig? 2-3 Sätze, wissenschaftlich aber verständlich (Du-Form).',
      axon_moment: '"axon_moment": EIN prägnanter Satz was der User jetzt in seinem Körper/Gehirn spüren soll. Beginnt mit "Du spürst..." oder "Dein Gehirn...". Max. 1-2 Sätze.',
      purpose_explanation: '"purpose_explanation": Erklärt den biomechanischen/neurologischen Zweck der Übung. Für gebildete Laien, 2-3 Sätze.',
      breathing_instruction: '"breathing_instruction": Konkrete Atemanweisung: wann einatmen, wann ausatmen, Rhythmus. Kurz und präzise (Du-Form).',
      cues: '"cues": Array von 3-5 kurzen Coaching-Cues. Jeder Cue max. 5-7 Wörter (Du-Form).',
      modification_suggestions_yellow: '"modification_suggestions_yellow": Was tun bei "gelb" (leichter Schmerz/Unwohlsein)? Konkrete Anpassungen. 1-3 Sätze.',
      modification_suggestions_red: '"modification_suggestions_red": Was tun bei "rot" (starker Schmerz, erschöpft)? z.B. Übung streichen oder durch MFR ersetzen. 1-3 Sätze.',
      progression_basic: '"progression_basic": Eine leichtere Variante als Objekt mit label, description, focus. (MUSS ausgeführt werden)',
      progression_advanced: '"progression_advanced": Eine schwerere Variante als Objekt mit label, description, focus. (MUSS ausgeführt werden)'
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
      } else if (f === 'progression_basic' || f === 'progression_advanced') {
        schemaProps[f] = {
          type: 'object',
          properties: {
            label: { type: 'string' },
            description: { type: 'string' },
            focus: { type: 'string' }
          },
          required: ['label', 'description', 'focus']
        };
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