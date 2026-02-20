// v2
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

  // Build context about the exercise
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
Modifikation Gelb: ${ex.modification_suggestions_yellow || 'nicht vorhanden'}
Modifikation Rot: ${ex.modification_suggestions_red || 'nicht vorhanden'}
`.trim();

  // Build prompt based on which fields are missing
  const fieldDescriptions = {
    benefits: `"benefits": String. Konkrete, spürbare Vorteile für den User in 2-3 Sätzen. Alltagsrelevant & motivierend formuliert. (z.B. "Du wirst weniger Nackenspannung spüren und dein Kopf fühlt sich klarer an.")`,
    goal_explanation: `"goal_explanation": String. Warum ist diese Übung im Rehab-/Trainingskontext wichtig? Was soll sie langfristig bewirken? 2-3 Sätze, wissenschaftlich aber verständlich.`,
    axon_moment: `"axon_moment": String. EIN prägnanter Satz, was der User jetzt gerade in seinem Körper/Gehirn spüren/verstehen soll. Beginnt oft mit "Du spürst..." oder "Dein Gehirn...". Max. 1-2 Sätze.`,
    purpose_explanation: `"purpose_explanation": String. Erklärt den biomechanischen/neurologischen Zweck der Übung. Für gebildete Laien, 2-3 Sätze.`,
    breathing_instruction: `"breathing_instruction": String. Konkrete Atemanweisung für diese Übung: wann einatmen, wann ausatmen, Rhythmus. Kurz und präzise.`,
    cues: `"cues": Array von Strings. 3-5 kurze, prägnante Coaching-Cues (Ausführungshinweise). Jeder Cue max. 5-7 Wörter. z.B. ["Schultern entspannen", "Kopf bleibt neutral"]`,
    modification_suggestions_yellow: `"modification_suggestions_yellow": String. Was soll der User tun, wenn er sich "gelb" fühlt (etwas Schmerz/Unwohlsein, aber machbar)? Konkrete Anpassungen: Sätze reduzieren, Range reduzieren, langsamer, etc. 1-3 Sätze.`,
    modification_suggestions_red: `"modification_suggestions_red": String. Was soll der User tun, wenn er sich "rot" fühlt (starker Schmerz, sehr erschöpft)? z.B. Übung streichen, durch MFR ersetzen, etc. 1-3 Sätze.`,
  };

  const requestedFields = missingFields.map(f => fieldDescriptions[f]).join('\n');

  const prompt = `Du bist ein Experte für Neuro-Athletic Training, myofasziale Therapie und Bewegungsrehabilitation (basierend auf Stecco, McGill, Myers, Pavel, Kelly Starrett).

AUFGABE: Befülle die fehlenden Felder für diese Übung. Antworte NUR mit einem JSON-Objekt.

ÜBUNGS-KONTEXT:
${context}

FEHLENDE FELDER (nur diese befüllen):
${requestedFields}

WICHTIG:
- Antworte NUR mit validem JSON, keine Erklärungen außerhalb
- Sprache: Deutsch
- Tone: professionell aber zugänglich, motivierend
- Basiere deine Antworten auf dem Übungs-Kontext
- "cues" muss ein Array von Strings sein, alle anderen Felder sind Strings

Antwort-Format (nur die fehlenden Felder):
{
${missingFields.map(f => `  "${f}": ...`).join(',\n')}
}`;

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
      })
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    console.error('Gemini error:', err);
    return Response.json({ error: 'LLM-Fehler: ' + err }, { status: 500 });
  }

  const geminiData = await geminiRes.json();
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

  let generated;
  try {
    generated = JSON.parse(raw);
  } catch (e) {
    console.error('JSON parse error:', e, 'Raw:', raw);
    return Response.json({ error: 'LLM-Antwort konnte nicht geparst werden', raw }, { status: 500 });
  }

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