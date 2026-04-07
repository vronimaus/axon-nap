import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all TuneUpCausalChain entries
    const causalChains = await base44.entities.TuneUpCausalChain.list(null, 100);
    
    if (!causalChains || causalChains.length === 0) {
      return Response.json({ message: 'No causal chains found', processed: 0 }, { status: 200 });
    }

    let processed = 0;
    let failed = 0;
    const errors = [];

    // Generate audio for each pretest_instruction
    for (const chain of causalChains) {
      try {
        if (!chain.hardware_reset?.pretest_instruction) {
          console.log(`Skipping ${chain.node_id}: no pretest_instruction`);
          continue;
        }

        const audioKey = `pretest_audio_${chain.node_id}`;
        
        // Use ttsWithCache to generate and cache audio
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generiere eine klare, angenehme deutsche TTS-Audio für diese Pre-Test-Anleitung (Sprechen Sie langsam, deutlich und motivierend): "${chain.hardware_reset.pretest_instruction}"`,
          response_json_schema: {
            type: "object",
            properties: {
              audio_generated: { type: "boolean" },
              status: { type: "string" }
            }
          }
        });

        // Call the ttsWithCache function to handle actual audio generation
        const audioRes = await base44.functions.invoke('ttsWithCache', {
          text: chain.hardware_reset.pretest_instruction,
          cacheKey: audioKey,
          voice: 'de-DE-Neural2-B'
        });

        if (audioRes?.data?.audioUrl) {
          processed++;
          console.log(`✓ Generated audio for ${chain.node_id}`);
        }
      } catch (error) {
        failed++;
        errors.push({ node_id: chain.node_id, error: error.message });
        console.error(`✗ Failed for ${chain.node_id}:`, error.message);
      }
    }

    return Response.json({
      message: 'Pretest audios generation completed',
      processed,
      failed,
      total: causalChains.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});