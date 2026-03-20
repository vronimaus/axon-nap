import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AXON Smart Filter Engine
 * Deterministic exercise alternative finder — no AI needed, pure data logic.
 * Uses exercise tags (mechanical_impact_type, smart_tags, category, progression_level)
 * to instantly find the best regression or safe alternative.
 * 
 * Input: { current_exercise_id, pain_nodes: [], readiness_status: 'yellow'|'red', mode: 'regress'|'alternative' }
 * Output: { alternatives: [], best_match: {}, reasoning: string }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      current_exercise_id,
      pain_nodes = [],        // e.g. ['N10', 'N11']
      readiness_status = 'yellow', // 'yellow' | 'red'
      mode = 'regress',       // 'regress' = safer version, 'alternative' = different exercise
      target_sling = null     // optional: keep same sling (anterior/posterior/lateral)
    } = await req.json();

    if (!current_exercise_id) {
      return Response.json({ error: 'current_exercise_id required' }, { status: 400 });
    }

    // Load all exercises in ONE call — the central cache
    const allExercises = await base44.asServiceRole.entities.Exercise.list('-updated_date', 500);

    // Build lookup for O(1) access
    const exerciseLookup = {};
    for (const ex of allExercises) {
      if (ex.exercise_id) exerciseLookup[ex.exercise_id] = ex;
    }

    const current = exerciseLookup[current_exercise_id];
    if (!current) {
      return Response.json({ error: `Exercise "${current_exercise_id}" not found` }, { status: 404 });
    }

    const currentLevel = current.progression_level || 3;
    const currentCategory = current.category;
    const currentPrimarySling = current.smart_tags?.kinetic_chain_slings?.primary_sling;

    // ── SMART FILTER LOGIC ──────────────────────────────────────────────────
    const candidates = allExercises.filter(ex => {
      if (ex.exercise_id === current_exercise_id) return false;
      if (!ex.exercise_id) return false;

      const exLevel = ex.progression_level || 3;
      const compressionDemand = ex.smart_tags?.biomechanical_stress?.compression_demand ?? 5;
      const shearDemand = ex.smart_tags?.biomechanical_stress?.shear_demand ?? 5;
      const loadCategory = ex.smart_tags?.execution_parameters?.load_category;
      const contraindications = ex.smart_tags?.contraindications || [];

      // 1. Never suggest exercises with contraindications matching pain nodes
      const isContraindicated = contraindications.some(c =>
        pain_nodes.some(node => c.condition && c.condition.includes(node))
      );
      if (isContraindicated) return false;

      // 2. Check upgrade_blocked_if_pain_nodes
      const upgradeBlocked = ex.upgrade_blocked_if_pain_nodes || [];
      if (pain_nodes.some(node => upgradeBlocked.includes(node))) return false;

      // 3. Readiness-based stress limits
      if (readiness_status === 'red') {
        if (compressionDemand > 3) return false;
        if (shearDemand > 3) return false;
        if (loadCategory === 'heavy' || loadCategory === 'explosive') return false;
        if (exLevel > currentLevel) return false; // No progressions in red
      } else if (readiness_status === 'yellow') {
        if (compressionDemand > 5) return false;
        if (loadCategory === 'explosive') return false;
        if (exLevel > currentLevel + 1) return false; // Max 1 level up in yellow
      }

      // 4. Mode-specific filters
      if (mode === 'regress') {
        // Regression: must be easier or equal level
        if (exLevel >= currentLevel) return false;
      }

      return true;
    });

    // ── SCORING: rank candidates by relevance ──────────────────────────────
    const scored = candidates.map(ex => {
      let score = 0;
      const exSling = ex.smart_tags?.kinetic_chain_slings?.primary_sling;

      // Same category = high relevance
      if (ex.category === currentCategory) score += 30;

      // Same sling = good (keeps kinetic chain context)
      if (target_sling && exSling === target_sling) score += 20;
      else if (!target_sling && exSling === currentPrimarySling) score += 20;

      // Parent exercise match (e.g. pullup_negative → pullup_*)
      const currentParent = current.parent_exercise;
      if (currentParent && ex.parent_exercise === currentParent) score += 25;

      // Next progression match (explicit safe path)
      if (current.next_progression_id === ex.exercise_id) score += 40;

      // Prefer mobility/breath/neuro in red mode
      if (readiness_status === 'red') {
        if (['mobility', 'breath', 'neuro'].includes(ex.category)) score += 15;
      }

      // Lower compression = safer = higher priority in yellow/red
      const compressionDemand = ex.smart_tags?.biomechanical_stress?.compression_demand ?? 5;
      score += (10 - compressionDemand) * 2;

      // Prefer close progression level (not too easy, not too hard)
      const levelDiff = Math.abs((ex.progression_level || 3) - currentLevel);
      score -= levelDiff * 5;

      return { exercise: ex, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const top3 = scored.slice(0, 3).map(s => ({
      exercise_id: s.exercise.exercise_id,
      name: s.exercise.name,
      category: s.exercise.category,
      progression_level: s.exercise.progression_level,
      description: s.exercise.description,
      axon_moment: s.exercise.axon_moment,
      cues: s.exercise.cues || [],
      breathing_instruction: s.exercise.breathing_instruction,
      mechanical_impact_type: s.exercise.mechanical_impact_type || [],
      compression_demand: s.exercise.smart_tags?.biomechanical_stress?.compression_demand,
      relevance_score: s.score
    }));

    const best = top3[0] || null;

    // Build human-readable reasoning
    let reasoning = '';
    if (!best) {
      reasoning = `Keine geeignete Alternative für "${current.name}" gefunden. Empfehle Pause.`;
    } else if (readiness_status === 'red') {
      reasoning = `🔴 Status Rot: "${current.name}" pausiert. "${best.name}" ist eine sichere isometrische Alternative mit minimalem Kompressionsdruck.`;
    } else {
      reasoning = `🟡 Status Gelb: "${current.name}" durch "${best.name}" ersetzt — niedrigere Belastung, gleiche Kette aktiv.`;
    }

    console.log(`[smartFilterAlternatives] ${current_exercise_id} → ${best?.exercise_id || 'NONE'} (${candidates.length} candidates, status: ${readiness_status})`);

    return Response.json({
      success: true,
      current_exercise: {
        exercise_id: current.exercise_id,
        name: current.name,
        progression_level: current.progression_level
      },
      best_match: best,
      alternatives: top3,
      candidates_found: candidates.length,
      reasoning,
      filter_context: {
        readiness_status,
        mode,
        pain_nodes,
        target_sling: target_sling || currentPrimarySling
      }
    });

  } catch (error) {
    console.error('[smartFilterAlternatives] Error:', error.message);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});