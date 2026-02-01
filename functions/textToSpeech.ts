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
    console.log('[TTS Backend] Request received');
    const { text } = await req.json();
    
    if (!text) {
      console.error('[TTS Backend] No text provided');
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log('[TTS Backend] Text length:', text.length);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[TTS Backend] GEMINI_API_KEY not configured');
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Smart truncation at sentence end if text too long
    let trimmedText = text;
    if (text.length > 800) {
      const truncated = text.substring(0, 800);
      const lastPeriod = truncated.lastIndexOf('.');
      trimmedText = lastPeriod > 400 ? truncated.substring(0, lastPeriod + 1) : truncated;
      console.log('[TTS Backend] Text truncated to:', trimmedText.length, 'chars');
    }

    console.log('[TTS Backend] Calling Gemini API...');
    
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
                  voiceName: 'Charon'
                }
              }
            }
          }
        })
      }
    );

    console.log('[TTS Backend] Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS Backend] Gemini API error:', errorText);
      return Response.json({ error: `Gemini API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    console.log('[TTS Backend] Response structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      hasContent: !!data.candidates?.[0]?.content,
      hasParts: !!data.candidates?.[0]?.content?.parts,
      partsLength: data.candidates?.[0]?.content?.parts?.length
    });
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      console.error('[TTS Backend] Unexpected response structure:', JSON.stringify(data, null, 2));
      return Response.json({ error: 'No audio data in response' }, { status: 500 });
    }

    const audioData = data.candidates[0].content.parts[0].inlineData.data;
    console.log('[TTS Backend] Audio data received, length:', audioData.length);

    // Return raw PCM data for Web Audio API processing in frontend
    return Response.json({ 
      audio: audioData,
      sampleRate: 24000,
      channels: 1,
      bitsPerSample: 16
    });

  } catch (error) {
    console.error('[TTS Backend] Unexpected error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});