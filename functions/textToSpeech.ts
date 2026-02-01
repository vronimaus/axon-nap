import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Gemini TTS Streaming Backend Function
 * 
 * Streams audio chunks in real-time using Server-Sent Events (SSE)
 * - Splits text into sentences for progressive playback
 * - Each sentence generates a separate audio chunk
 * - Voice: Charon (fast, neutral German voice)
 */

Deno.serve(async (req) => {
  try {
    console.log('[TTS Stream] Request received');
    const { text } = await req.json();
    
    if (!text) {
      console.error('[TTS Stream] No text provided');
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log('[TTS Stream] Text length:', text.length);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[TTS Stream] GEMINI_API_KEY not configured');
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Split text into sentences (smarter splitting)
    const sentences = text
      .replace(/([.!?])\s+/g, '$1|')
      .split('|')
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());

    console.log('[TTS Stream] Split into', sentences.length, 'sentences');

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            console.log(`[TTS Stream] Processing sentence ${i + 1}/${sentences.length}, length: ${sentence.length}`);

            // Call Gemini TTS for this sentence
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    role: 'user',
                    parts: [{ text: `Lies diesen Text vor in warmem, professionellem Ton auf Deutsch: ${sentence}` }]
                  }],
                  generationConfig: {
                    temperature: 1,
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: {
                          voiceName: 'Charon'
                        }
                      }
                    }
                  }
                })
              }
            );

            if (!response.ok) {
              console.error(`[TTS Stream] API error for sentence ${i + 1}:`, response.status);
              continue;
            }

            const data = await response.json();
            
            if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
              console.error(`[TTS Stream] No audio data for sentence ${i + 1}`);
              continue;
            }

            const audioData = data.candidates[0].content.parts[0].inlineData.data;
            console.log(`[TTS Stream] Audio received for sentence ${i + 1}, length: ${audioData.length}`);

            // Send audio chunk as SSE
            const chunk = {
              index: i,
              total: sentences.length,
              audio: audioData,
              sampleRate: 24000,
              channels: 1,
              bitsPerSample: 16
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }

          // Send completion event
          controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
          controller.close();
          console.log('[TTS Stream] Stream completed');
        } catch (error) {
          console.error('[TTS Stream] Stream error:', error.message);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('[TTS Stream] Unexpected error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});