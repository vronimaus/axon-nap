import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { /* not authenticated */ }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const nodeId = body.node_id; // Optional: refiniert nur einen Node wenn spezifiziert

    // Load TuneUpCausalChain records
    let chains = [];
    if (nodeId) {
      chains = await base44.asServiceRole.entities.TuneUpCausalChain.filter({ node_id: nodeId });
    } else {
      chains = await base44.asServiceRole.entities.TuneUpCausalChain.list();
    }

    if (!chains.length) {
      return Response.json({ success: true, message: 'Keine TuneUpCausalChain-Einträge gefunden', updated: 0 });
    }

    let updatedCount = 0;

    for (const chain of chains) {
      try {
        const context = `
Knoten: ${chain.node_id} - ${chain.node_name_de}
Körperregion: ${chain.körperregion || ''}
Stecco CC: ${chain.stecco_cc || ''}
Zielkette: ${chain.target_chain || ''}
Symptom: ${chain.symptom || ''}
Biomechanische Ursache: ${chain.biomechanische_ursache || ''}
`;

        const prompt = `Du bist ein erfahrener neuro-athletischer Trainer und Bewegungs-Coach. Verfeinere die folgenden Anleitung-Texte für Audio-Ausgabe (TTS).

WICHTIG:
- Texte müssen natürlich klingen wenn laut vorgelesen (fließend, kein "Listenformat")
- Keine Präfixe wie "Übung:", "Ausführung:", "Integration:" verwenden
- Technische Begriffe minimieren oder verständlich erklären
- Du-Form durchgehend
- Kurz und prägnant, aber vollständig

KONTEXT:
${context}

AKTUELLE TEXTE:
${chain.software_update ? `
Neuro-Drill:
- Übung: ${chain.software_update.übung || ''}
- Ausführung: ${chain.software_update.ausführung || ''}
- Warum: ${chain.software_update.warum || ''}
` : ''}

${chain.integration ? `
Integration:
- Primäre Bewegung: ${chain.integration.primär_bewegung || ''}
- Wiederholungen: ${chain.integration.wiederholungen || ''}
- Tweak 1: ${chain.integration.tweak_1 || ''}
- Tweak 2: ${chain.integration.tweak_2 || ''}
` : ''}

${chain.hardware_reset ? `
MFR Reset:
- Pretest: ${chain.hardware_reset.pretest_instruction || ''}
- Technik: ${chain.hardware_reset.technik || ''}
- Mechanismus: ${chain.hardware_reset.mechanismus || ''}
` : ''}

AUFGABE: Verfeinere ALLE vorhandenen Felder für bessere Audio-Qualität. Antworte AUSSCHLIESSLICH mit diesem JSON-Format:

{
  "software_update": {
    "übung": "...",
    "ausführung": "...",
    "warum": "..."
  },
  "integration": {
    "primär_bewegung": "...",
    "wiederholungen": "...",
    "tweak_1": "...",
    "tweak_2": "..."
  },
  "hardware_reset": {
    "pretest_instruction": "...",
    "technik": "...",
    "mechanismus": "...",
    "biologischer_zweck": "...",
    "erwartetes_ergebnis": "..."
  }
}

Behalte die bestehende Information bei, verbessere aber die Ausdrucksweise für Audio-Ausgabe.`;

        const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              software_update: {
                type: 'object',
                properties: {
                  übung: { type: 'string' },
                  ausführung: { type: 'string' },
                  warum: { type: 'string' }
                }
              },
              integration: {
                type: 'object',
                properties: {
                  primär_bewegung: { type: 'string' },
                  wiederholungen: { type: 'string' },
                  tweak_1: { type: 'string' },
                  tweak_2: { type: 'string' }
                }
              },
              hardware_reset: {
                type: 'object',
                properties: {
                  pretest_instruction: { type: 'string' },
                  technik: { type: 'string' },
                  mechanismus: { type: 'string' },
                  biologischer_zweck: { type: 'string' },
                  erwartetes_ergebnis: { type: 'string' }
                }
              }
            }
          }
        });

        // Merge generated data with existing chain
        const update = {
          software_update: {
            ...(chain.software_update || {}),
            ...(generated.software_update || {})
          },
          integration: {
            ...(chain.integration || {}),
            ...(generated.integration || {})
          },
          hardware_reset: {
            ...(chain.hardware_reset || {}),
            ...(generated.hardware_reset || {})
          }
        };

        await base44.asServiceRole.entities.TuneUpCausalChain.update(chain.id, update);
        updatedCount++;
        console.log(`✓ Refined TuneUp texts for node ${chain.node_id}`);
      } catch (err) {
        console.error(`✗ Error refining node ${chain.node_id}:`, err.message);
      }
    }

    return Response.json({ 
      success: true, 
      message: `${updatedCount} TuneUp Audio-Texte verfeinert`,
      updated: updatedCount 
    });
  } catch (error) {
    console.error('refineTuneUpAudioTexts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});