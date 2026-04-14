import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * ttsWithCache - Zentrale TTS-Funktion mit Caching
 *
 * Zwei Modi:
 * 1. Frontend-Aufruf: User muss eingeloggt sein (auth check)
 * 2. Service-Aufruf (service_mode: true): Kein User-Auth nötig (für Automations & Admin-Batch)
 *
 * Input:  { text: string, service_mode?: boolean }
 * Output: { signed_url: string, cached: boolean }
 */

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function splitIntoChunks(text, maxChars = 500) {
  const pauseSections = text.split(/\.\.\./).map(s => s.trim()).filter(s => s);
  if (pauseSections.length > 1) return pauseSections;

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

async function generateChunkAudio(text, apiKey) {
  const isCoaching = text.includes('Phase') || text.includes('Training') || text.includes('Übung') || text.includes('Atme') || text.includes('Halt');
  const ttsPrompt = isCoaching
    ? `Lies diesen Text vor als Fitness-Coach. Nutze natürliche Pausen zwischen Sätzen. Sprich klar und motivierend. Deutsche Sprache: ${text}`
    : `Lies diesen Text vor in warmem, professionellem Ton auf Deutsch: ${text}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: ttsPrompt }] }],
        generationConfig: {
          temperature: 1,
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini TTS API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error('No audio data in Gemini response');
  return audioData;
}

function combineBase64PCM(base64Chunks) {
  const binaryChunks = base64Chunks.map(b64 => {
    const binary = atob(b64);
    return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
  });
  const totalLength = binaryChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of binaryChunks) { combined.set(chunk, offset); offset += chunk.length; }
  let binary = '';
  for (let i = 0; i < combined.length; i++) binary += String.fromCharCode(combined[i]);
  return btoa(binary);
}

function buildWavFromPCMBase64(pcmBase64) {
  const pcmBinary = atob(pcmBase64);
  const pcmBytes = new Uint8Array(pcmBinary.length);
  for (let i = 0; i < pcmBinary.length; i++) pcmBytes[i] = pcmBinary.charCodeAt(i);

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBytes, 44);
  let binary = '';
  for (let i = 0; i < wavBytes.length; i++) binary += String.fromCharCode(wavBytes[i]);
  return btoa(binary);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { text, service_mode } = await req.json();

    // Auth: Frontend-Aufrufe brauchen eingeloggten User, Service-Mode nicht
    if (!service_mode) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!text?.trim()) {
      return Response.json({ error: 'text is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const textHash = await hashText(text);
    console.log(`[TTS Cache] Hash: ${textHash.substring(0, 12)}... | Text: "${text.substring(0, 60)}..."`);

    // 1. Cache prüfen
    const cached = await base44.asServiceRole.entities.TTSCache.filter({ text_hash: textHash });
    if (cached?.length > 0) {
      console.log('[TTS Cache] HIT');
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: cached[0].file_uri,
        expires_in: 3600
      });
      return Response.json({ signed_url, cached: true, file_uri: cached[0].file_uri });
    }

    // 2. Cache miss → Audio generieren
    console.log('[TTS Cache] MISS – generating audio');
    const chunks = splitIntoChunks(text.trim(), 500);
    console.log(`[TTS Cache] ${chunks.length} chunk(s)`);

    const audioChunks = [];
    for (const chunk of chunks) {
      const pcmBase64 = await generateChunkAudio(chunk, apiKey);
      audioChunks.push(pcmBase64);
    }

    const combinedPCM = audioChunks.length === 1 ? audioChunks[0] : combineBase64PCM(audioChunks);
    const wavBase64 = buildWavFromPCMBase64(combinedPCM);

    // 3. Upload
    const wavBinary = atob(wavBase64);
    const wavBytes = new Uint8Array(wavBinary.length);
    for (let i = 0; i < wavBinary.length; i++) wavBytes[i] = wavBinary.charCodeAt(i);
    const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', wavBlob, `tts_${textHash.substring(0, 12)}.wav`);

    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: formData.get('file') });
    console.log(`[TTS Cache] Uploaded: ${file_uri}`);

    // 4. In Cache speichern
    await base44.asServiceRole.entities.TTSCache.create({
      text_hash: textHash,
      file_uri,
      text_preview: text.trim().substring(0, 100)
    });

    // 5. Signed URL zurückgeben
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 3600 });

    return Response.json({ signed_url, cached: false, file_uri });

  } catch (error) {
    console.error('[TTS Cache] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});