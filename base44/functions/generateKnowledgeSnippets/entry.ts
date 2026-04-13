import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const NODES = [
  { id: 'N1', name: 'Kopf & Kiefer', bodyPart: 'head and jaw' },
  { id: 'N2', name: 'Schulter-Arm', bodyPart: 'shoulder and arm' },
  { id: 'N3', name: 'Brust-Thorax', bodyPart: 'chest and thorax' },
  { id: 'N4', name: 'Dorsaler Rücken', bodyPart: 'upper back' },
  { id: 'N5', name: 'Lumbal-Sakral', bodyPart: 'lower back and sacrum' },
  { id: 'N6', name: 'Knie', bodyPart: 'knee' },
  { id: 'N7', name: 'Hüfte-Becken', bodyPart: 'hip and pelvis' },
  { id: 'N8', name: 'Fuß-Knöchel', bodyPart: 'foot and ankle' },
  { id: 'N9', name: 'Wade', bodyPart: 'calf' },
  { id: 'N10', name: 'Ellbogen', bodyPart: 'elbow' },
  { id: 'N11', name: 'Hand-Finger', bodyPart: 'hand and fingers' },
  { id: 'N12', name: 'Atem-Zwerchfell', bodyPart: 'diaphragm and breathing' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const snippets = [];

    for (const node of NODES) {
      // Generate text via InvokeLLM
      const textResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein Neuro-Athletik-Experte. Schreibe einen kurzen, verständlichen Wissensmäppchen-Text zu diesem Körperbereich:

Bereich: ${node.name}
Anatomische Region: ${node.bodyPart}

Der Text soll:
- 2-3 Sätze Summary (Kurzzusammenfassung)
- 3-4 Sätze detaillierter Content
- Fokus auf: Anatomie, typische Probleme, warum es wichtig ist
- Schreib auf Deutsch
- Prägnant, verständlich, nicht zu wissenschaftlich

Antworte im JSON-Format:
{
  "summary": "...",
  "content": "..."
}`,
      });

      // Generate anatomical illustration via GenerateImage
      const imageResponse = await base44.integrations.Core.GenerateImage({
        prompt: `Dark cyber anatomical illustration of ${node.bodyPart}. Medical anatomy style, dark blue and cyan neon highlights, minimalist, professional medical illustration, transparent background. High contrast, modern cyberpunk aesthetic.`,
      });

      // Parse LLM response (handles markdown code blocks)
      let textStr = typeof textResponse === 'string' ? textResponse : JSON.stringify(textResponse);
      textStr = textStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const textData = JSON.parse(textStr);
      
      snippets.push({
        node_id: node.id,
        node_name_de: node.name,
        title: `${node.name} verstehen`,
        summary: textData.summary,
        content: textData.content,
        image_url: imageResponse.url,
        category: 'anatomy',
        is_active: true,
      });

      console.log(`✓ Generated snippet for ${node.name}`);
    }

    // Create snippets one by one (avoid timeout)
    let created = 0;
    for (const snippet of snippets) {
      try {
        await base44.asServiceRole.entities.KnowledgeSnippet.create(snippet);
        created++;
      } catch (e) {
        console.error(`Failed to create snippet for ${snippet.node_id}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      created: created,
      snippets: snippets.map(s => ({ node_id: s.node_id, title: s.title })),
    });
  } catch (error) {
    console.error('[generateKnowledgeSnippets]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});