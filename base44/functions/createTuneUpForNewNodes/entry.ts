import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { /* not authenticated */ }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newNodeIds = ['CU-A', 'CX-A', 'CX-P', 'GE-A', 'GE-P', 'TA-A', 'TA-P', 'PE-A'];

    // Load existing MFRNode data
    const allMFRNodes = await base44.asServiceRole.entities.MFRNode.list();
    const mfrMap = {};
    for (const node of allMFRNodes) {
      mfrMap[node.node_id || node.data?.node_id] = node.data ?? node;
    }

    // Check which nodes are already in TuneUp
    const existingTuneUp = await base44.asServiceRole.entities.TuneUpCausalChain.list();
    const existingIds = new Set(existingTuneUp.map(t => t.node_id || t.data?.node_id));

    const nodesToCreate = newNodeIds.filter(id => !existingIds.has(id) && mfrMap[id]);

    if (!nodesToCreate.length) {
      return Response.json({ 
        success: true, 
        message: 'Alle neuen Nodes haben bereits TuneUp-Einträge',
        created: 0 
      });
    }

    let createdCount = 0;

    for (const nodeId of nodesToCreate) {
      try {
        const mfrNode = mfrMap[nodeId];
        if (!mfrNode) continue;

        const nodeName = mfrNode.name_de || mfrNode['name_de'] || nodeId;
        const bodyArea = mfrNode.body_area || mfrNode['body_area'] || '';
        const userInstruction = mfrNode.user_instruction || mfrNode['user_instruction'] || '';

        // Generate TuneUp data using LLM
        const prompt = `Du bist ein Bewegungs-Coach. Erstelle einen vollständigen TuneUp-Eintrag für einen Stecco-Node.

NODE-DATEN:
- ID: ${nodeId}
- Name: ${nodeName}
- Körperregion: ${bodyArea}
- MFR-Anleitung: ${userInstruction}

AUFGABE: Generiere in JSON-Format:
1. hardware_reset: pretest_instruction, technik, mechanismus, biologischer_zweck, erwartetes_ergebnis
2. software_update: übung, ausführung, warum, neurologisches_ziel
3. integration: primär_bewegung, wiederholungen, tweak_1, tweak_2

Alle Texte MÜSSEN fließend, praktisch und detailliert sein.`;

        const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              hardware_reset: {
                type: 'object',
                properties: {
                  pretest_instruction: { type: 'string' },
                  technik: { type: 'string' },
                  mechanismus: { type: 'string' },
                  biologischer_zweck: { type: 'string' },
                  erwartetes_ergebnis: { type: 'string' }
                }
              },
              software_update: {
                type: 'object',
                properties: {
                  übung: { type: 'string' },
                  ausführung: { type: 'string' },
                  warum: { type: 'string' },
                  neurologisches_ziel: { type: 'string' }
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
              }
            }
          }
        });

        // Map node names based on body area
        const nameMap = {
          'CU-A': 'Ellenbogen',
          'CX-A': 'Vordere Hüfte',
          'CX-P': 'Hintere Hüfte',
          'GE-A': 'Vorderes Knie',
          'GE-P': 'Hinteres Knie',
          'TA-A': 'Vorderes Sprunggelenk',
          'TA-P': 'Hinteres Sprunggelenk',
          'PE-A': 'Fuß'
        };

        const chainMap = {
          'CU-A': 'Laterale Kette',
          'CX-A': 'Vorderkette',
          'CX-P': 'Hinterkette',
          'GE-A': 'Vorderkette',
          'GE-P': 'Hinterkette',
          'TA-A': 'Vorderkette',
          'TA-P': 'Hinterkette',
          'PE-A': 'Vorderkette'
        };

        const tuneUpData = {
          node_id: nodeId,
          node_name_de: nameMap[nodeId] || nodeName,
          körperregion: bodyArea,
          target_chain: chainMap[nodeId] || 'Funktionale Kette',
          symptom: `Einschränkung in ${nameMap[nodeId] || bodyArea}`,
          biomechanische_ursache: `Faszialer Blockade in ${nameMap[nodeId] || bodyArea} nach Stecco`,
          stecco_cc: nodeId,
          hardware_reset: generated.hardware_reset || {},
          software_update: generated.software_update || {},
          integration: generated.integration || {}
        };

        await base44.asServiceRole.entities.TuneUpCausalChain.create(tuneUpData);
        createdCount++;
        console.log(`✓ Created TuneUp entry for ${nodeId}`);
      } catch (err) {
        console.error(`✗ Error creating TuneUp for ${nodeId}:`, err.message);
      }
    }

    return Response.json({ 
      success: true, 
      message: `${createdCount} neue TuneUp-Einträge erstellt`,
      created: createdCount 
    });
  } catch (error) {
    console.error('createTuneUpForNewNodes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});