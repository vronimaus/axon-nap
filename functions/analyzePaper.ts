import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { text, file_url } = await req.json();

    if (!text && !file_url) {
      return Response.json({ error: 'Text or file_url required' }, { status: 400 });
    }

    // Wenn ein Paper-PDF hochgeladen wurde, extrahiere zuerst den Text
    let paperContent = text;
    if (file_url) {
      try {
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: file_url,
          json_schema: {
            type: "object",
            properties: {
              full_text: { type: "string" }
            }
          }
        });
        
        if (extractResult.status === 'success' && extractResult.output?.full_text) {
          paperContent = extractResult.output.full_text;
        }
      } catch (e) {
        console.error('Failed to extract PDF text:', e);
        // Fahre mit dem ursprünglichen Text fort, falls vorhanden
      }
    }

    if (!paperContent) {
      return Response.json({ error: 'Could not extract paper content' }, { status: 400 });
    }

    // Analysiere das Paper mit LLM
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Wissenschaftsexperte für Trainingswissenschaft, Physiotherapie und Neuro-Athletik. Analysiere das folgende wissenschaftliche Paper und extrahiere die wichtigsten Informationen für AXON (eine Neuro-Athletic Training App).

Paper-Inhalt:
${paperContent}

Extrahiere folgende Informationen:
1. Titel der Studie
2. Autor(en) und Publikationsjahr
3. Kurze Zusammenfassung (2-3 Sätze)
4. 3-5 wichtigste Erkenntnisse (als Bullet Points)
5. Relevanz für AXON (welche Features/Bereiche betrifft es?)
6. Zielgruppe (für wen ist das relevant?)
7. Konkrete Handlungsempfehlungen für AXON-Nutzer
8. Spezifische Protokolle oder Methoden (falls vorhanden)
9. Kategorisierung (wähle aus: hiit, fascia, neuro, strength, mobility, recovery, hormones, nutrition, other)
10. 3-5 relevante Tags

Gib die Informationen strukturiert zurück.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          source: { type: "string" },
          year: { type: "integer" },
          category: { type: "string" },
          summary: { type: "string" },
          key_findings: { type: "string" },
          axon_relevance: { type: "string" },
          target_audience: {
            type: "array",
            items: { type: "string" }
          },
          recommended_actions: { type: "string" },
          protocol_details: { type: "string" },
          tags: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: analysis,
      original_file_url: file_url
    });

  } catch (error) {
    console.error('Error analyzing paper:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});