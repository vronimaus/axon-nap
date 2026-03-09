import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Gemini TTS Backend Function
 * 
 * Processes a single text chunk (sentence or paragraph)
 * - Voice: Charon (fast, neutral German voice)
 * - Returns PCM audio data
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await req.json();
    
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Call Gemini TTS API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `Lies diesen Text vor in warmem, professionellem Ton auf Deutsch: ${text}` }]
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
      const errorText = await response.text();
      console.error('[TTS Backend] API error:', errorText);
      return Response.json({ error: `Gemini API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      return Response.json({ error: 'No audio data in response' }, { status: 500 });
    }

    const audioData = data.candidates[0].content.parts[0].inlineData.data;

    return Response.json({ 
      audio: audioData,
      sampleRate: 24000,
      channels: 1,
      bitsPerSample: 16
    });

  } catch (error) {
    console.error('[TTS Backend] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});