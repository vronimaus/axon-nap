import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * bulkGenerateAllAudio - Einmaliger Bulk-Run für bestehende Content-Entities
 * ADMIN ONLY
 *
 * Input: { entity_types?: string[], dry_run?: boolean }
 */

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
  const existing = await base44.asServiceRole.entities.TTSCache.filter({ text_hash: textHash });
  if (existing?.length > 0) return { cached: true };

  const isCoaching = /Übung|Phase|Atme|Halt|Training|Massage|Druck|Sekunde/i.test(text);
  const prompt = isCoaching
    ? `Lies diesen Text vor als Fitness-Coach. Natürliche Pausen, klar und motivierend auf Deutsch: ${text}`
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

  if (!res.ok) throw new Error(`Gemini TTS ${res.status}: ${(await res.text()).substring(0, 200)}`);
  const ttsData = await res.json();
  const pcmBase64 = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!pcmBase64) throw new Error('Kein Audio in Gemini-Antwort');

  const pcmBinary = atob(pcmBase64);
  const pcmBytes = new Uint8Array(pcmBinary.length);
  for (let i = 0; i < pcmBinary.length; i++) pcmBytes[i] = pcmBinary.charCodeAt(i);
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
  ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 24000, true);
  view.setUint32(28, 48000, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, dataSize, true);
  new Uint8Array(buffer).set(pcmBytes, 44);

  const wavBlob = new Blob([new Uint8Array(buffer)], { type: 'audio/wav' });
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
    [data.hardware_reset?.technik, data.hardware_reset?.erwartetes_ergebnis,
     data.software_update?.ausführung, data.integration?.primär_bewegung,
     data.sensory_priming_action, data.parasympathetic_vagus_drill].forEach(t => t && texts.push(t));
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

const ENTITY_CONFIG = ['Exercise', 'MFRNode', 'AxonScenario', 'TuneUpCausalChain', 'FitnessSnack', 'Routine'];

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

    for (const entityName of toProcess) {
      const records = await base44.asServiceRole.entities[entityName].list('-created_date', 500);
      let totalTexts = 0, generated = 0, cached = 0, errors = 0;

      for (const record of records) {
        const texts = extractTexts(entityName, record);
        totalTexts += texts.length;

        if (dry_run) continue;

        for (const text of texts) {
          try {
            const result = await generateAndCacheAudio(text, base44);
            if (result.cached) cached++;
            else if (result.generated) generated++;
            await new Promise(r => setTimeout(r, 400));
          } catch (err) {
            console.error(`[BulkAudio] ${entityName}: "${text.substring(0, 50)}" → ${err.message}`);
            errors++;
          }
        }
      }

      results[entityName] = { records: records.length, total_texts: totalTexts, generated, cached, errors, dry_run };
      console.log(`[BulkAudio] ${entityName}: ${records.length} Records, ${totalTexts} Texte, ${generated} neu, ${cached} Cache, ${errors} Fehler`);
    }

    return Response.json({
      success: true,
      dry_run,
      results,
      summary: {
        total_records: Object.values(results).reduce((s, r) => s + r.records, 0),
        total_texts: Object.values(results).reduce((s, r) => s + r.total_texts, 0),
        total_generated: Object.values(results).reduce((s, r) => s + r.generated, 0),
        total_cached: Object.values(results).reduce((s, r) => s + r.cached, 0),
        total_errors: Object.values(results).reduce((s, r) => s + r.errors, 0),
      }
    });

  } catch (error) {
    console.error('[BulkAudio] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});