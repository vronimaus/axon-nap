import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Gemini TTS Backend Function
 * 
 * WORKING SETUP (Feb 2026):
 * - Uses Gemini 2.5 Flash TTS model
 * - Voice: Charon (fast, neutral male voice for better performance)
 * - Returns raw PCM data (24kHz, 16-bit, mono)
 * - Frontend uses Web Audio API to decode and play
 * 
 * Performance: ~10-15s for 500 chars
 */

Deno.serve(async (req) => {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Smart truncation at sentence end if text too long
    let trimmedText = text;
    if (text.length > 800) {
      const truncated = text.substring(0, 800);
      const lastPeriod = truncated.lastIndexOf('.');
      trimmedText = lastPeriod > 400 ? truncated.substring(0, lastPeriod + 1) : truncated;
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
            parts: [{ text: `Lies diesen Text vor in warmem, professionellem Ton auf Deutsch: ${trimmedText}` }]
          }],
          generationConfig: {
            temperature: 1,
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Charon' // Faster, neutral male voice
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

    // Return raw PCM data for Web Audio API processing in frontend
    return Response.json({ 
      audio: audioData,
      sampleRate: 24000,
      channels: 1,
      bitsPerSample: 16
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});