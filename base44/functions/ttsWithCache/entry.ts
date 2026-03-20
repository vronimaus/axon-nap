import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * TTS with Caching
 * 
 * - Hashes the input text
 * - Checks TTSCache entity for existing audio
 * - If cached: returns a fresh signed URL for the stored file
 * - If not cached: generates audio via Gemini TTS, uploads to private storage,
 *   stores hash+uri in TTSCache, returns signed URL
 * 
 * Supports long texts by splitting into chunks and concatenating PCM audio.
 */

// Simple hash function using Web Crypto API
async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Split text into chunks of max ~500 chars at sentence boundaries
function splitIntoChunks(text, maxChars = 500) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > maxChars) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

// Call Gemini TTS for a single chunk, returns base64 PCM string
async function generateChunkAudio(text, apiKey) {
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
              prebuiltVoiceConfig: { voiceName: 'Charon' }
            }
          }
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error('No audio data in Gemini response');
  return audioData; // base64 encoded PCM
}

// Combine multiple base64 PCM chunks into one base64 string
function combineBase64PCM(base64Chunks) {
  const binaryChunks = base64Chunks.map(b64 => {
    const binary = atob(b64);
    return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
  });

  const totalLength = binaryChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of binaryChunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert back to base64
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

// Build a minimal WAV file from raw PCM base64 (16-bit, 24kHz, mono)
function buildWavFromPCMBase64(pcmBase64) {
  const pcmBinary = atob(pcmBase64);
  const pcmBytes = new Uint8Array(pcmBinary.length);
  for (let i = 0; i < pcmBinary.length; i++) {
    pcmBytes[i] = pcmBinary.charCodeAt(i);
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBytes.length;
  const headerSize = 44;

  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBytes, headerSize);

  // Convert to base64
  let binary = '';
  for (let i = 0; i < wavBytes.length; i++) binary += String.fromCharCode(wavBytes[i]);
  return btoa(binary);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const textHash = await hashText(text);
    console.log(`[TTS Cache] Hash: ${textHash.substring(0, 12)}...`);

    // 1. Check cache
    const cached = await base44.asServiceRole.entities.TTSCache.filter({ text_hash: textHash });
    if (cached?.length > 0) {
      console.log('[TTS Cache] HIT – returning cached audio');
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: cached[0].file_uri,
        expires_in: 3600
      });
      return Response.json({ signed_url, cached: true });
    }

    // 2. Cache miss – generate audio
    console.log('[TTS Cache] MISS – generating new audio');
    const chunks = splitIntoChunks(text.trim(), 500);
    console.log(`[TTS Cache] Split into ${chunks.length} chunks`);

    const audioChunks = [];
    for (const chunk of chunks) {
      const pcmBase64 = await generateChunkAudio(chunk, apiKey);
      audioChunks.push(pcmBase64);
    }

    // 3. Combine all chunks and build WAV
    const combinedPCM = audioChunks.length === 1 ? audioChunks[0] : combineBase64PCM(audioChunks);
    const wavBase64 = buildWavFromPCMBase64(combinedPCM);

    // 4. Upload to private storage
    const wavBinary = atob(wavBase64);
    const wavBytes = new Uint8Array(wavBinary.length);
    for (let i = 0; i < wavBinary.length; i++) wavBytes[i] = wavBinary.charCodeAt(i);
    const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });

    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: wavBlob });
    console.log(`[TTS Cache] Uploaded to: ${file_uri}`);

    // 5. Save to cache entity
    await base44.asServiceRole.entities.TTSCache.create({
      text_hash: textHash,
      file_uri: file_uri,
      text_preview: text.trim().substring(0, 100)
    });

    // 6. Return signed URL
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 3600
    });

    return Response.json({ signed_url, cached: false });

  } catch (error) {
    console.error('[TTS Cache] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});