import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Agent Audio Optimizer
 * 
 * Pre-processes agent responses for optimal TTS delivery:
 * - Detects agent output (diagnosis_reasoning, performance_coach)
 * - Optimizes text for audio (short sentences, natural pacing)
 * - Inserts pause markers (...) for natural speech rhythm
 * - Calls ttsWithCache to generate cached audio files
 * 
 * Used by agent handlers before sending audio to frontend.
 */

// Detect if text is from diagnosis_reasoning agent
function isDiagnosisResponse(text) {
  return text.includes('[SHOW_DIAGNOSIS_CARD]') || 
         text.includes('[TRIGGER_CHAIN_SCAN]') || 
         text.includes('[CREATE_REHAB_PLAN]') ||
         text.includes('3-Schritt Protokoll') ||
         text.includes('Schmerzintensität');
}

// Detect if text is from performance_coach agent
function isPerformanceResponse(text) {
  return text.includes('[SHOW_GOAL_ANALYSIS]') || 
         text.includes('[SHOW_EXERCISES]') || 
         text.includes('[CREATE_PLAN]') ||
         text.includes('HARDWARE') || 
         text.includes('SOFTWARE') || 
         text.includes('INTEGRATION');
}

// Extract the actual content (remove trigger tokens)
function extractContent(text) {
  return text
    .replace(/\[SHOW_DIAGNOSIS_CARD\]/g, '')
    .replace(/\[TRIGGER_CHAIN_SCAN\]/g, '')
    .replace(/\[CREATE_REHAB_PLAN\]/g, '')
    .replace(/\[SHOW_GOAL_ANALYSIS\]/g, '')
    .replace(/\[SHOW_EXERCISES\]/g, '')
    .replace(/\[CREATE_PLAN\]/g, '')
    .trim();
}

// Optimize diagnosis response for audio
function optimizeDiagnosisAudio(text) {
  let optimized = extractContent(text);
  
  // Break up long sentences at logical points
  optimized = optimized
    // Add pause after explanations
    .replace(/\. ([A-Z])/g, '... $1')
    // Keep protocol steps clear with pauses
    .replace(/Hardware \(90[^.]*\)\. /g, 'Hardware (90 Sekunden)... ')
    .replace(/Software \(30[^.]*\)\. /g, 'Software (30 Sekunden)... ')
    .replace(/Integration \([^.]*\)\. /g, 'Integration... ');
  
  return optimized;
}

// Optimize performance response for audio
function optimizePerformanceAudio(text) {
  let optimized = extractContent(text);
  
  // Format exercises for clear audio delivery
  optimized = optimized
    // Add pauses between phases
    .replace(/🧠 SOFTWARE/g, '... 🧠 SOFTWARE')
    .replace(/💪 INTEGRATION/g, '... 💪 INTEGRATION')
    .replace(/⚙️ HARDWARE/g, '... ⚙️ HARDWARE')
    // Break up repetitive patterns
    .replace(/(\d)x(\d)/g, '$1 mal $2')
    // Add pause before instructions
    .replace(/: /g, '... ');
  
  return optimized;
}

// Main optimization pipeline
function optimizeForTTS(text) {
  if (isDiagnosisResponse(text)) {
    return {
      type: 'diagnosis',
      content: optimizeDiagnosisAudio(text),
      isTTSOptimized: true
    };
  }
  
  if (isPerformanceResponse(text)) {
    return {
      type: 'performance',
      content: optimizePerformanceAudio(text),
      isTTSOptimized: true
    };
  }
  
  // Generic response — minimal optimization
  return {
    type: 'generic',
    content: text.replace(/\. ([A-Z])/g, '... $1'), // Add pause markers
    isTTSOptimized: true
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, generateAudio = false } = await req.json();
    
    if (!text || !text.trim()) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    // Step 1: Optimize the text for TTS
    const optimized = optimizeForTTS(text);
    console.log(`[Agent Audio Optimizer] Type: ${optimized.type}, Optimized: ${optimized.isTTSOptimized}`);

    // Step 2: If audio generation requested, call ttsWithCache
    let audioUrl = null;
    if (generateAudio) {
      const { signed_url } = await base44.functions.invoke('ttsWithCache', {
        text: optimized.content
      });
      audioUrl = signed_url;
      console.log(`[Agent Audio Optimizer] Audio generated and cached`);
    }

    return Response.json({
      optimized: optimized.content,
      type: optimized.type,
      audioUrl: audioUrl,
      success: true
    });

  } catch (error) {
    console.error('[Agent Audio Optimizer] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});