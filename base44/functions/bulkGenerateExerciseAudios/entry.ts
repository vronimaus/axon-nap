import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Bulk Generate Exercise Audios (Global Cache Population)
 * 
 * Generates and caches audio files for ALL exercises in the database.
 * Runs every 2 hours to keep TTSCache populated.
 * Direct Gemini TTS integration (no user auth required).
 */

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateAudioForExercise(base44, exercise, apiKey) {
  try {
    const textParts = [];
    
    if (exercise.name) textParts.push(exercise.name);
    if (exercise.sets_reps_tempo) textParts.push(`${exercise.sets_reps_tempo}.`);
    if (exercise.axon_moment) textParts.push(`Das ist wichtig: ${exercise.axon_moment}`);
    if (exercise.instruction) textParts.push(exercise.instruction);
    if (exercise.cues?.length) textParts.push(`Tipps: ${exercise.cues.join('. ')}`);
    if (exercise.breathing_instruction) textParts.push(`Atmung: ${exercise.breathing_instruction}`);
    
    const fullText = textParts.join('. ');
    if (!fullText.trim()) return null;

    const textHash = await hashText(fullText);

    // Check if already cached
    const cached = await base44.asServiceRole.entities.TTSCache.filter({ text_hash: textHash });
    if (cached?.length > 0) {
      console.log(`[Bulk Audio Gen] ✓ ${exercise.name} (cached)`);
      return true;
    }

    // Call Gemini TTS directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `Lies diesen Text vor als Fitness-Coach. Nutze natürliche Pausen. Sprich klar auf Deutsch: ${fullText}` }]
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
      console.error(`[Bulk Audio Gen] Gemini error for ${exercise.name}: ${response.status}`);
      return false;
    }

    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      console.error(`[Bulk Audio Gen] No audio data for ${exercise.name}`);
      return false;
    }

    // Convert base64 to Blob and upload to private storage
    const wavBinary = atob(audioData);
    const wavBytes = new Uint8Array(wavBinary.length);
    for (let i = 0; i < wavBinary.length; i++) wavBytes[i] = wavBinary.charCodeAt(i);
    const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });

    const formData = new FormData();
    formData.append('file', wavBlob, `tts_${textHash.substring(0, 12)}.wav`);

    const uploadResp = await base44.integrations.Core.UploadPrivateFile({ file: formData.get('file') });
    if (!uploadResp?.file_uri) {
      console.error(`[Bulk Audio Gen] Upload failed for ${exercise.name}`);
      return false;
    }

    // Save to cache with file_uri
    await base44.asServiceRole.entities.TTSCache.create({
      text_hash: textHash,
      file_uri: uploadResp.file_uri,
      text_preview: fullText.substring(0, 100)
    });

    console.log(`[Bulk Audio Gen] ✓ ${exercise.name}`);
    return true;
    
  } catch (error) {
    console.error(`[Bulk Audio Gen] Error for ${exercise.name}:`, error.message);
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    console.log('[Bulk Audio Gen] Starting bulk exercise audio generation...');

    // Fetch ALL exercises
    const exercises = await base44.asServiceRole.entities.Exercise.list('-updated_date', 1000);
    
    if (!exercises || exercises.length === 0) {
      return Response.json({ error: 'No exercises found' }, { status: 404 });
    }

    console.log(`[Bulk Audio Gen] Found ${exercises.length} exercises`);

    let successCount = 0;
    let failedCount = 0;

    // Generate audio for each exercise with rate limiting
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      const result = await generateAudioForExercise(base44, exercise, apiKey);
      if (result) {
        successCount++;
      } else {
        failedCount++;
      }
      
      // Every 10 exercises, log progress and pause
      if ((i + 1) % 10 === 0) {
        console.log(`[Bulk Audio Gen] Progress: ${i + 1}/${exercises.length} (${Math.round((i + 1) / exercises.length * 100)}%)`);
        await new Promise(r => setTimeout(r, 1500)); // 1.5s pause to avoid rate limits
      } else {
        await new Promise(r => setTimeout(r, 500)); // 500ms between requests
      }
    }

    const summary = {
      success: true,
      total_exercises: exercises.length,
      audios_generated: successCount,
      failed: failedCount,
      message: `Global exercise audio cache populated: ${successCount}/${exercises.length} audios ready`
    };

    console.log('[Bulk Audio Gen] Complete:', summary);

    return Response.json(summary);

  } catch (error) {
    console.error('[Bulk Audio Gen] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});