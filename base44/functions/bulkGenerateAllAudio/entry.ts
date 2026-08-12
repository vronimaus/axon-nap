import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * bulkGenerateAllAudio — Pre-generates ALL audio texts into TTSCache
 *
 * CRITICAL: Uses the SAME hash (VOICE_VERSION), voice ('Kore'), prompt,
 * and chunking logic as ttsWithCache — so cache hits at runtime are guaranteed.
 *
 * Also constructs the EXACT narration strings the Tune-Up screens build
 * (MFRResetScreenDynamic, NeuroDrillScreen, IntegrationScreen) plus
 * all hardcoded static texts (RetestScreen, CompletionScreen, CoachingBridgeScreen).
 *
 * Input: { entity_types?: string[], dry_run?: boolean }
 */

// Must match ttsWithCache exactly
const VOICE_VERSION = 'kore-v1';

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim() + '|' + VOICE_VERSION);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
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
  const ttsPrompt = `Lies diesen Text auf Deutsch vor. Du bist ein ruhiger, klarer und autoritärer Coach — wie ein erfahrener Therapeut. Sprich mit ruhiger, selbstbewusster Stimme. Keine Übertriebene Begeisterung, sondern freundliche Klarheit. Kurze Pause zwischen Sätzen. Text: ${text}`;
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
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      })
    }
  );
  if (!response.ok) throw new Error(`Gemini TTS ${response.status}: ${(await response.text()).substring(0, 200)}`);
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
  const sampleRate = 24000, numChannels = 1, bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeStr(8, 'WAVE');
  writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true); writeStr(36, 'data'); view.setUint32(40, dataSize, true);
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBytes, 44);
  let binary = '';
  for (let i = 0; i < wavBytes.length; i++) binary += String.fromCharCode(wavBytes[i]);
  return btoa(binary);
}

async function generateAndCacheAudio(text, base44) {
  if (!text?.trim() || text.trim().length < 10) return { skipped: true };
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const textHash = await hashText(text);
  const existing = await base44.asServiceRole.entities.TTSCache.filter({ text_hash: textHash });
  if (existing?.length > 0) return { cached: true };

  const chunks = splitIntoChunks(text.trim(), 500);
  const audioChunks = [];
  for (const chunk of chunks) {
    const pcmBase64 = await generateChunkAudio(chunk, apiKey);
    audioChunks.push(pcmBase64);
  }
  const combinedPCM = audioChunks.length === 1 ? audioChunks[0] : combineBase64PCM(audioChunks);
  const wavBase64 = buildWavFromPCMBase64(combinedPCM);

  const wavBinary = atob(wavBase64);
  const wavBytes = new Uint8Array(wavBinary.length);
  for (let i = 0; i < wavBinary.length; i++) wavBytes[i] = wavBinary.charCodeAt(i);
  const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('file', wavBlob, `tts_${textHash.substring(0, 12)}.wav`);
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: formData.get('file') });

  await base44.asServiceRole.entities.TTSCache.create({
    text_hash: textHash,
    file_uri,
    text_preview: text.trim().substring(0, 100)
  });

  return { generated: true };
}

// ── Static screen texts (hardcoded in components) ──
const STATIC_TEXTS = [
  // RetestScreen STEP_AUDIO
  'Lass uns checken, was sich verändert hat. Bewege dich wie am Anfang. Erste Frage: Wie hoch ist dein Schmerz bei dieser Bewegung aktuell?',
  'Gut. Kommt dein Körper jetzt weiter in die Bewegung? Deutlich weiter, etwas weiter, gleich geblieben, oder schlechter?',
  'Letzte Frage: Wie stabil fühlte sich die Bewegung an? Perfekt und stabil, teilweise instabil, oder sehr instabil?',
  // CompletionScreen COMPLETION_AUDIO
  'Perfekt gemacht. Faszie freigemacht, Nervensystem kalibriert, Bewegung verankert. Wiederhole das drei Mal pro Woche. Wenn es stabil und flüssig läuft, steiger die Frequenz.',
  // CoachingBridgeScreen BRIDGE_TEXT
  'Okay, gut gemacht. Dein Körper ist jetzt offen — die Faszie ist frei, das Nervensystem ist kalibriert. Aber jetzt kommt\u2019s: dein Körper ist vergesslich. In zwei Stunden wäre alles wieder beim Alten, wenn wir jetzt nichts tun. Die nächste Übung ist der wichtigste Teil. Sie setzt einen Anker für dein Nervensystem — damit dein Körper sich an diesen Zustand erinnert und drin bleibt. Ohne die Übung vergeudet sich der Effekt. Mit ihr prägt sich das ein. Also: konzentriert, langsam, jede Wiederholung zählt.',
  // MFRResetScreenDynamic warning
  'Achtung, ich starte den Timer in 3 Sekunden',
];

// ── Construct exact narration texts from TuneUpCausalChain data ──
function buildTuneUpNarrationTexts(data) {
  const texts = [];
  const nodeName = data.node_name_de || `Node ${data.node_id || ''}`;

  // MFRResetScreenDynamic — pretest
  texts.push(`Beweglichkeitstest für ${nodeName}. ${data.hardware_reset?.pretest_instruction || 'Teste deine aktuelle Beweglichkeit.'}`);

  // MFRResetScreenDynamic — compression
  texts.push(`Faszien-Entlastung für ${nodeName}. ${data.hardware_reset?.technik || ''}. ${data.hardware_reset?.mechanismus || ''}`);

  // MFRResetScreenDynamic — info
  texts.push(`Die Wissenschaft dahinter. ${data.biomechanische_ursache || ''}. ${data.hardware_reset?.mechanismus || ''}. ${data.hardware_reset?.biologischer_zweck || ''}`);

  // NeuroDrillScreen
  const sw = data.software_update;
  if (sw) {
    texts.push(`${sw['übung'] || ''}. ${sw['ausführung'] || ''}. ${sw['warum'] || ''}`);
  }

  // IntegrationScreen
  const intg = data.integration;
  if (intg) {
    texts.push([
      'Deine Integrationsübung.',
      intg['wiederholungen'] || intg.wiederholungen || '',
      intg['tweak_1'] || intg.tweak_1 || '',
      intg['tweak_2'] || intg.tweak_2 || '',
      'Das ist die neuronale Verankerung. Dein Gehirn myelinisiert die neuen Bewegungsmuster, wenn du sie sofort nach dem MFR und Neuro-Training nutzt.'
    ].filter(Boolean).join(' '));
  }

  return texts.filter(t => t && t.trim().length > 10);
}

function extractTexts(entityName, data) {
  const texts = [];
  if (entityName === 'Exercise') {
    [data.description, data.axon_moment, data.breathing_instruction, data.purpose_explanation,
     data.goal_explanation, data.benefits, data.cues?.join('. ')].forEach(t => t && texts.push(t));
  }
  if (entityName === 'MFRNode') {
    [data.user_instruction, data.expert_tip, data.neuro_instruction, data.pretest_instruction].forEach(t => t && texts.push(t));
  }
  if (entityName === 'AxonScenario') {
    [data.hardware_description, data.software_description, data.strength_description, data.synergy_explanation].forEach(t => t && texts.push(t));
  }
  if (entityName === 'TuneUpCausalChain') {
    // Construct the EXACT narration strings the screens use — not just raw fields
    texts.push(...buildTuneUpNarrationTexts(data));
  }
  if (entityName === 'FitnessSnack') {
    [data.description, data.longevity_benefit].forEach(t => t && texts.push(t));
    data.sequence?.forEach(s => { if (s.instruction) texts.push(s.instruction); if (s.cue) texts.push(s.cue); });
  }
  if (entityName === 'Routine') {
    [data.description, data.expert_explanation, data.completion_message].forEach(t => t && texts.push(t));
    data.sequence?.forEach(s => {
      if (s.exercise_description) texts.push(s.exercise_description);
      if (s.axon_moment) texts.push(s.axon_moment);
      if (s.instruction) texts.push(s.instruction);
    });
  }
  return [...new Set(texts)].filter(t => t && t.trim().length > 10);
}

const ENTITY_CONFIG = ['TuneUpCausalChain', 'Exercise', 'MFRNode', 'AxonScenario', 'Routine', 'FitnessSnack'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin-Zugriff erforderlich' }, { status: 403 });
    }

    const { entity_types, dry_run = false } = await req.json().catch(() => ({}));
    const toProcess = entity_types ? ENTITY_CONFIG.filter(e => entity_types.includes(e)) : ENTITY_CONFIG;

    console.log(`[BulkAudio] Start: ${toProcess.join(', ')} | dry_run=${dry_run}`);
    const results = {};
    let totalGenerated = 0, totalCached = 0, totalErrors = 0;

    for (const entityName of toProcess) {
      const records = await base44.asServiceRole.entities[entityName].list('-created_date', 500);
      let entityTexts = 0, generated = 0, cached = 0, errors = 0;

      for (const record of records) {
        const texts = extractTexts(entityName, record);
        entityTexts += texts.length;

        if (dry_run) continue;

        for (const text of texts) {
          try {
            const result = await generateAndCacheAudio(text, base44);
            if (result.cached) cached++;
            else if (result.generated) generated++;
            await new Promise(r => setTimeout(r, 300));
          } catch (err) {
            console.error(`[BulkAudio] ${entityName}: "${text.substring(0, 50)}" → ${err.message}`);
            errors++;
          }
        }
      }

      results[entityName] = { records: records.length, texts: entityTexts, generated, cached, errors };
      totalGenerated += generated; totalCached += cached; totalErrors += errors;
      console.log(`[BulkAudio] ${entityName}: ${records.length} records, ${entityTexts} texts, ${generated} new, ${cached} cached, ${errors} errors`);
    }

    // Process static screen texts
    let staticGenerated = 0, staticCached = 0, staticErrors = 0;
    for (const text of STATIC_TEXTS) {
      if (dry_run) continue;
      try {
        const result = await generateAndCacheAudio(text, base44);
        if (result.cached) staticCached++;
        else if (result.generated) staticGenerated++;
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`[BulkAudio] Static: "${text.substring(0, 50)}" → ${err.message}`);
        staticErrors++;
      }
    }
    results['StaticScreenTexts'] = { texts: STATIC_TEXTS.length, generated: staticGenerated, cached: staticCached, errors: staticErrors };
    totalGenerated += staticGenerated; totalCached += staticCached; totalErrors += staticErrors;

    return Response.json({
      success: true,
      dry_run,
      results,
      summary: {
        total_generated: totalGenerated,
        total_cached: totalCached,
        total_errors: totalErrors,
      }
    });

  } catch (error) {
    console.error('[BulkAudio] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});