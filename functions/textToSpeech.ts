import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function createWavFile(pcmData, sampleRate, numChannels, bitsPerSample) {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmData.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const wavHeader = new ArrayBuffer(headerSize);
  const view = new DataView(wavHeader);

  // "RIFF" chunk descriptor
  view.setUint8(0, 'R'.charCodeAt(0));
  view.setUint8(1, 'I'.charCodeAt(0));
  view.setUint8(2, 'F'.charCodeAt(0));
  view.setUint8(3, 'F'.charCodeAt(0));
  view.setUint32(4, fileSize - 8, true);
  view.setUint8(8, 'W'.charCodeAt(0));
  view.setUint8(9, 'A'.charCodeAt(0));
  view.setUint8(10, 'V'.charCodeAt(0));
  view.setUint8(11, 'E'.charCodeAt(0));

  // "fmt " sub-chunk
  view.setUint8(12, 'f'.charCodeAt(0));
  view.setUint8(13, 'm'.charCodeAt(0));
  view.setUint8(14, 't'.charCodeAt(0));
  view.setUint8(15, ' '.charCodeAt(0));
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  view.setUint8(36, 'd'.charCodeAt(0));
  view.setUint8(37, 'a'.charCodeAt(0));
  view.setUint8(38, 't'.charCodeAt(0));
  view.setUint8(39, 'a'.charCodeAt(0));
  view.setUint32(40, dataSize, true);

  // Combine header and PCM data
  const wavFile = new Uint8Array(fileSize);
  wavFile.set(new Uint8Array(wavHeader), 0);
  wavFile.set(pcmData, headerSize);

  return wavFile;
}

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
                  voiceName: 'Enceladus' // Deep, warm female voice
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
    
    // Convert PCM to WAV format for browser compatibility
    const pcmData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const wavData = createWavFile(pcmData, 24000, 1, 16);
    
    // Convert to base64 in chunks to avoid stack overflow
    let wavBase64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < wavData.length; i += chunkSize) {
      const chunk = wavData.slice(i, i + chunkSize);
      wavBase64 += btoa(String.fromCharCode.apply(null, chunk));
    }

    return Response.json({ 
      audio: wavBase64,
      mimeType: 'audio/wav'
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});