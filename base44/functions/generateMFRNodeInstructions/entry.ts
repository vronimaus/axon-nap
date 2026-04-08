import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { /* not authenticated */ }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let targetNodeId = null;
    try {
      const body = await req.json();
      targetNodeId = body.node_id; // Optional: generiert nur einen Node wenn spezifiziert
    } catch (e) {
      // No JSON body, that's ok
      console.log('No JSON body provided');
    }

    // Load all MFRNodes
    const allNodes = await base44.asServiceRole.entities.MFRNode.list();
    
    // New Stecco nodes that need instructions (no legacy N1-N12 mapping)
    const newNodes = ['CU-A', 'CX-A', 'CX-P', 'GE-A', 'GE-P', 'TA-A', 'TA-P', 'PE-A'];
    const nodesToProcess = allNodes.filter(n => {
      const nodeId = n.node_id || n.data?.node_id;
      const hasInstruction = n.user_instruction || n.data?.user_instruction;
      if (targetNodeId) {
        return nodeId === targetNodeId && !hasInstruction;
      }
      return newNodes.includes(nodeId) && !hasInstruction;
    });

    if (!nodesToProcess.length) {
      return Response.json({ 
        success: true, 
        message: 'Alle MFR-Nodes haben bereits Instruktionen',
        updated: 0 
      });
    }

    let updatedCount = 0;

    for (const node of nodesToProcess) {
      try {
        const nodeId = node.node_id || node.data?.node_id;
        const nameDe = node.name_de || node.data?.name_de || nodeId;
        const targetChain = node.target_chain || node.data?.target_chain || '';
        const bodyArea = node.body_area || node.data?.body_area || '';
        const exactPlacement = node.exact_placement_de || node.data?.exact_placement_de || '';
        const pretestInstruction = node.pretest_instruction || node.data?.pretest_instruction || '';
        const steccoCCName = node.stecco_cc_name || node.data?.stecco_cc_name || '';

        const context = `
Anatomischer Node: ${nodeId} - ${nameDe}
Körperregion: ${bodyArea}
Stecco CC: ${steccoCCName}
Zielkette/Funktion: ${targetChain}
Exakte Platzierung: ${exactPlacement}
Pretest: ${pretestInstruction}
`;

        const prompt = `Du bist ein erfahrener MFR-Coach, der Athleten Myofascial Release Techniken beibringt. Schreibe eine natürliche, fließende AUDIO-ANLEITUNG (TTS) für die MFR-Kompression dieses Nodes.

KONTEXT:
${context}

ANFORDERUNGEN FÜR AUDIO-TEXT:
- FLIESSEND UND GESPRÄCHIG wie ein echter Coach
- Du-Form durchgehend
- KEINE LISTEN, keine Aufzählungen
- Sätze mit "dann", "während", "sobald" verbinden
- Konkrete Bewegungsanweisungen (wo setzen, wie drücken, wie lang)
- Fokus-Cues für Druck/Gefühl
- Biologischer Zweck erklären (warum wirkt es)
- 3-4 Sätze max, prägnant

BEISPIEL-STYLE:
"Setz den Lacrosse-Ball zwei bis drei Zentimeter links neben deine Wirbelsäule auf Höhe deines unteren Rückens. Lehne dich gegen die Wand und lass dein Körpergewicht auf dem Ball ruhen. Atme tief ein und aus, während du kleine Bewegungen machst — kreisend, seitlich — um die Spannung zu lösen. Nach 90 Sekunden solltest du mehr Bewegungsfreiheit in dieser Region spüren."

Die Instruktion MUSS so detailliert sein, dass jemand, der die Technik nicht kennt, sie trotzdem ausführen kann.

Antworte AUSSCHLIESSLICH mit dem generierten Text (keine Formatierung, keine Anführungszeichen):`;

        const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt
        });

        if (generated && typeof generated === 'string') {
          const instruction = generated.trim().replace(/^["']|["']$/g, '');
          await base44.asServiceRole.entities.MFRNode.update(node.id, { 
            user_instruction: instruction 
          });
          updatedCount++;
          console.log(`✓ Generated instruction for ${nodeId}`);
        }
      } catch (err) {
        console.error(`✗ Error processing ${node.node_id}:`, err.message);
      }
    }

    return Response.json({ 
      success: true, 
      message: `${updatedCount} MFR-Node Instruktionen generiert`,
      updated: updatedCount 
    });
  } catch (error) {
    console.error('generateMFRNodeInstructions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});