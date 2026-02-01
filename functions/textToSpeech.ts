import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
                  voiceName: 'Aoede' // Warm female voice
                }
              }
            }
          }
        })
      }
    );

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      console.error('Gemini TTS response:', data);
      return Response.json({ error: 'No audio data received' }, { status: 500 });
    }

    const audioData = data.candidates[0].content.parts[0].inlineData.data;
    const mimeType = data.candidates[0].content.parts[0].inlineData.mimeType;

    // Return base64 audio data
    return Response.json({ 
      audio: audioData,
      mimeType: mimeType || 'audio/wav'
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});