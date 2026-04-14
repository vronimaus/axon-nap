import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * autoGenerateEntityAudio - Automatische Audiogenerierung bei Entity-Änderungen
 *
 * Wird von Entity-Automationen aufgerufen (create + update).
 * Extrahiert relevante Textfelder je Entity-Typ und generiert Audio direkt (ohne HTTP-Aufruf).
 *
 * Input (von Automation Payload):
 * {
 *   event: { type, entity_name, entity_id },
 *   data: { ...entity_fields }
 * }
 * Oder direkter Aufruf:
 * { entity_name: string, entity_data: {...} }
 */

// ── TTS Core (inline, kein HTTP-Hop) ─────────────────────────────────────────

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateAndCacheAudio(text, base44) {
  if (!text?.trim() || text.trim().length < 10) return { skipped: true };

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const textHash = await hashText(text);

  // Cache check
  const existing = await base44.asServiceRole.entities.TTSCache.filter({ text_hash: textHash });
  if (existing?.length > 0) return { cached: true };

  // Generate via Gemini TTS
  const isCoaching = /Übung|Phase|Atme|Halt|Training|Massage|Druck|Sekunde/i.test(text);
  const prompt = isCoaching
    ? `Lies diesen Text vor als Fitness-Coach. Nutze natürliche Pausen. Sprich klar und motivierend auf Deutsch: ${text}`
    : `Lies diesen Text vor in warmem, professionellem Ton auf Deutsch: ${text}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1,
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }
        }
      })
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini TTS ${res.status}: ${err.substring(0, 200)}`);
  }

  const ttsData = await res.json();
  const pcmBase64 = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!pcmBase64) throw new Error('Kein Audio in Gemini-Antwort');

  // PCM → WAV
  const pcmBinary = atob(pcmBase64);
  const pcmBytes = new Uint8Array(pcmBinary.length);
  for (let i = 0; i < pcmBinary.length; i++) pcmBytes[i] = pcmBinary.charCodeAt(i);

  const sampleRate = 24000;
  const byteRate = sampleRate * 2;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
  ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, dataSize, true);
  new Uint8Array(buffer).set(pcmBytes, 44);

  const wavBytes = new Uint8Array(buffer);
  const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('file', wavBlob, `tts_${textHash.substring(0, 12)}.wav`);

  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: formData.get('file') });

  await base44.asServiceRole.entities.TTSCache.create({
    text_hash: textHash,
    file_uri,
    text_preview: text.trim().substring(0, 100)
  });

  return { generated: true, file_uri };
}

// ── Text-Extraktion je Entity-Typ ─────────────────────────────────────────────

function extractTexts(entityName, data) {
  const texts = [];

  if (entityName === 'Exercise') {
    [data.description, data.axon_moment, data.breathing_instruction,
     data.purpose_explanation, data.goal_explanation, data.benefits,
     data.modification_suggestions_yellow, data.modification_suggestions_red,
     data.cues?.length > 0 ? data.cues.join('. ') : null
    ].forEach(t => t && texts.push(t));
  }

  if (entityName === 'MFRNode') {
    [data.user_instruction, data.expert_tip, data.neuro_instruction,
     data.pretest_instruction, data.integration_movement
    ].forEach(t => t && texts.push(t));
  }

  if (entityName === 'AxonScenario') {
    [data.hardware_description, data.software_description,
     data.strength_description, data.synergy_explanation, data.full_protocol
    ].forEach(t => t && texts.push(t));
  }

  if (entityName === 'TuneUpCausalChain') {
    [data.hardware_reset?.technik, data.hardware_reset?.biologischer_zweck,
     data.hardware_reset?.erwartetes_ergebnis,
     data.software_update?.ausführung, data.software_update?.neurologisches_ziel,
     data.integration?.primär_bewegung,
     data.sensory_priming_action, data.parasympathetic_vagus_drill
    ].forEach(t => t && texts.push(t));
  }

  if (entityName === 'FitnessSnack') {
    [data.description, data.longevity_benefit, data.rhonda_patrick_principle
    ].forEach(t => t && texts.push(t));
    data.sequence?.forEach(s => {
      if (s.instruction) texts.push(s.instruction);
      if (s.cue) texts.push(s.cue);
    });
  }

  if (entityName === 'Routine') {
    [data.description, data.expert_explanation, data.completion_message
    ].forEach(t => t && texts.push(t));
    data.sequence?.forEach(s => {
      if (s.exercise_description) texts.push(s.exercise_description);
      if (s.axon_moment) texts.push(s.axon_moment);
      if (s.instruction) texts.push(s.instruction);
      if (s.notes) texts.push(s.notes);
    });
  }

  return [...new Set(texts)].filter(t => t && t.trim().length > 10);
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Automation-Payload oder direkter Aufruf
    const entityName = payload.event?.entity_name || payload.entity_name;
    const entityData = payload.data || payload.entity_data;

    if (!entityName || !entityData) {
      return Response.json({ error: 'entity_name und data/entity_data sind erforderlich' }, { status: 400 });
    }

    const texts = extractTexts(entityName, entityData);

    if (texts.length === 0) {
      console.log(`[AutoAudio] ${entityName}: keine Texte zu vertonen`);
      return Response.json({ success: true, generated: 0, cached: 0, message: 'Keine Texte gefunden' });
    }

    console.log(`[AutoAudio] ${entityName}: ${texts.length} Texte`);

    let generated = 0, cached = 0, skipped = 0, errors = 0;

    for (const text of texts) {
      try {
        const result = await generateAndCacheAudio(text, base44);
        if (result.cached) cached++;
        else if (result.generated) generated++;
        else skipped++;
        await new Promise(r => setTimeout(r, 350)); // Rate limiting
      } catch (err) {
        console.error(`[AutoAudio] Fehler: "${text.substring(0, 50)}" → ${err.message}`);
        errors++;
      }
    }

    console.log(`[AutoAudio] ${entityName} fertig: ${generated} neu, ${cached} Cache, ${errors} Fehler`);

    return Response.json({ success: true, entity_name: entityName, total_texts: texts.length, generated, cached, skipped, errors });

  } catch (error) {
    console.error('[AutoAudio] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});