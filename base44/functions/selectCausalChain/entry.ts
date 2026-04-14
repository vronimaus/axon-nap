import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * selectCausalChain - Phase 2 LLM-Experten-Filter
 *
 * Lädt alle TuneUpCausalChains aus der DB und lässt das LLM
 * die 1-3 passendsten Ketten für die gemeldeten Symptome auswählen.
 *
 * Input:
 * {
 *   symptom_description: string,       // Was der User beschreibt
 *   body_region?: string,              // Z.B. "Nacken", "unterer Rücken", "Knie"
 *   pain_intensity?: number,           // 1-10
 *   readiness_status?: string,         // "low" | "moderate" | "high"
 *   user_context?: {                   // Optional: Profildaten
 *     activity_level?, primary_sport?, injury_history?
 *   }
 * }
 *
 * Output:
 * {
 *   selected_chains: [{
 *     chain_id: string,            // DB-ID der TuneUpCausalChain
 *     node_id: string,
 *     node_name_de: string,
 *     target_chain: string,
 *     symptom: string,
 *     selection_reason: string,    // LLM-Erklärung warum diese Kette
 *     priority: number,            // 1=primär, 2=sekundär, 3=ergänzend
 *     confidence: number,          // 0.0-1.0
 *     expected_outcome: string,    // Was der User nach der Session spüren wird
 *     hardware_reset: object,
 *     software_update: object,
 *     integration: object
 *   }],
 *   selection_rationale: string,    // Gesamte Begründung des LLM
 *   approach_type: string,         // "hardware_dominant" | "software_dominant" | "balanced"
 *   session_sequence: string[]     // Empfohlene Reihenfolge der node_ids
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      symptom_description,
      body_region,
      pain_intensity,
      readiness_status,
      user_context
    } = await req.json();

    if (!symptom_description && !body_region) {
      return Response.json({ error: 'symptom_description oder body_region erforderlich' }, { status: 400 });
    }

    // Alle Ketten laden
    const allChains = await base44.asServiceRole.entities.TuneUpCausalChain.list('-created_date', 200);

    if (allChains.length === 0) {
      return Response.json({ error: 'Keine TuneUpCausalChains in der DB' }, { status: 404 });
    }

    console.log(`[selectCausalChain] Loaded ${allChains.length} chains for "${symptom_description || body_region}"`);

    // Index als Proxy-ID (LLM arbeitet mit kleinen Zahlen besser als mit MongoDB-IDs)
    const indexToId = Object.fromEntries(allChains.map((c, idx) => [String(idx), c.id]));

    // Kompakter Katalog für den LLM-Prompt (kein Overkill)
    const chainCatalog = allChains.map((c, idx) => {
      const hw = c.hardware_reset || {};
      const sw = c.software_update || {};
      const integ = c.integration || {};
      return `INDEX:${idx} | Node:${c.node_id} | Region:${c.körperregion || '?'} | Kette:${c.target_chain || '?'}
  SYMPTOM: ${c.symptom || '-'}
  URSACHE: ${(c.biomechanische_ursache || '-').substring(0, 120)}
  MFR: ${(hw.technik || '-').substring(0, 100)}
  NEURO: ${sw.übung || '-'}
  INTEGRATION: ${integ.primär_bewegung || '-'}
  ERGEBNIS: ${hw.erwartetes_ergebnis || '-'}`;
    }).join('\n\n');

    // User-Kontext aufbauen
    const contextLines = [];
    if (body_region) contextLines.push(`Körperregion: ${body_region}`);
    if (pain_intensity) contextLines.push(`Schmerzintensität: ${pain_intensity}/10`);
    if (readiness_status) contextLines.push(`Readiness: ${readiness_status}`);
    if (user_context?.activity_level) contextLines.push(`Aktivitätslevel: ${user_context.activity_level}`);
    if (user_context?.primary_sport) contextLines.push(`Sport: ${user_context.primary_sport}`);
    if (user_context?.injury_history) contextLines.push(`Verletzungshistorie: ${user_context.injury_history}`);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein erfahrener AXON Neuro-Athletic Experte und Faszienspezialist (Stecco-Methode + Gary Gray 3DMAPS).
Deine Aufgabe: Wähle aus dem Katalog die 1-3 am besten passenden kausalen Ketten für die beschriebenen Symptome.

SYMPTOM-BESCHREIBUNG: "${symptom_description || body_region}"
${contextLines.length > 0 ? 'KONTEXT:\n' + contextLines.join('\n') : ''}

REGELN FÜR DIE AUSWAHL:
1. Primäre Kette: Die Kette, deren Symptom-Beschreibung am besten zu den Beschwerden passt
2. Sekundäre Kette (optional): Anatomisch angrenzende Kette, die die Primäre verstärkt
3. Ergänzende Kette (optional): Nur wenn sehr hohe Relevanz (z.B. kompensatorische Spannung)
4. Bei niedrigem Pain (1-4): Fokus auf Mobilität → bevorzuge Chains mit sanftem MFR
5. Bei hohem Pain (7-10): Bevorzuge Chains mit starkem "erwartetes_ergebnis" Schmerzreduktions-Mechanismus
6. Gib den INDEX-Wert (z.B. "0", "3", "12") als chain_id zurück – NICHT die lange MongoDB-ID

VERFÜGBARE KETTEN:
${chainCatalog}`,
      response_json_schema: {
        type: 'object',
        properties: {
          selected_chains: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                chain_id: { type: 'string', description: 'Der INDEX-Wert aus dem Katalog als String, z.B. "0", "3", "12"' },
                priority: { type: 'integer', description: '1=primär, 2=sekundär, 3=ergänzend' },
                selection_reason: { type: 'string', description: 'Warum passt diese Kette zu den Symptomen?' },
                confidence: { type: 'number', description: '0.0-1.0' },
                expected_outcome: { type: 'string', description: 'Was wird der User nach der Session spüren?' }
              },
              required: ['chain_id', 'priority', 'selection_reason', 'confidence', 'expected_outcome']
            }
          },
          selection_rationale: { type: 'string', description: 'Gesamte Begründung der Auswahl in 3-5 Sätzen' },
          approach_type: {
            type: 'string',
            enum: ['hardware_dominant', 'software_dominant', 'balanced'],
            description: 'Welcher Ansatz dominiert bei diesen Symptomen?'
          },
          session_sequence: {
            type: 'array',
            items: { type: 'string' },
            description: 'Empfohlene Reihenfolge der chain_ids für die Session'
          }
        },
        required: ['selected_chains', 'selection_rationale', 'approach_type', 'session_sequence']
      }
    });

    // Index → echte DB-ID übersetzen und Ketten anreichern
    const chainMap = Object.fromEntries(allChains.map(c => [c.id, c]));
    const enrichedSelections = (result.selected_chains || [])
      .map(s => ({ ...s, chain_id: indexToId[s.chain_id] || s.chain_id }))
      .filter(s => chainMap[s.chain_id])
      .slice(0, 3)
      .map(s => {
        const chain = chainMap[s.chain_id];
        return {
          chain_id: s.chain_id,
          node_id: chain.node_id,
          node_name_de: chain.node_name_de,
          körperregion: chain.körperregion,
          target_chain: chain.target_chain,
          stecco_cc: chain.stecco_cc,
          symptom: chain.symptom,
          biomechanische_ursache: chain.biomechanische_ursache,
          priority: s.priority,
          selection_reason: s.selection_reason,
          confidence: s.confidence,
          expected_outcome: s.expected_outcome,
          hardware_reset: chain.hardware_reset,
          software_update: chain.software_update,
          integration: chain.integration,
          finales_outcome: chain.finales_outcome,
          sensory_priming_action: chain.sensory_priming_action,
          parasympathetic_vagus_drill: chain.parasympathetic_vagus_drill
        };
      });

    if (enrichedSelections.length === 0) {
      // Fallback: Region-basierte Suche
      console.warn('[selectCausalChain] LLM returned no valid IDs, using region fallback');
      const regionLower = (body_region || symptom_description || '').toLowerCase();
      const fallback = allChains.filter(c =>
        (c.körperregion || '').toLowerCase().includes(regionLower.substring(0, 6)) ||
        (c.symptom || '').toLowerCase().includes(regionLower.substring(0, 6))
      ).slice(0, 2).map(chain => ({
        chain_id: chain.id,
        node_id: chain.node_id,
        node_name_de: chain.node_name_de,
        körperregion: chain.körperregion,
        target_chain: chain.target_chain,
        stecco_cc: chain.stecco_cc,
        symptom: chain.symptom,
        biomechanische_ursache: chain.biomechanische_ursache,
        priority: 1,
        selection_reason: 'Regions-basierter Fallback',
        confidence: 0.5,
        expected_outcome: chain.hardware_reset?.erwartetes_ergebnis || 'Verbesserung der Beweglichkeit',
        hardware_reset: chain.hardware_reset,
        software_update: chain.software_update,
        integration: chain.integration
      }));
      return Response.json({
        selected_chains: fallback,
        selection_rationale: 'Fallback: Regions-basierte Auswahl',
        approach_type: 'balanced',
        session_sequence: fallback.map(c => c.chain_id),
        fallback_used: true
      });
    }

    console.log(`[selectCausalChain] Selected ${enrichedSelections.length} chains: ${enrichedSelections.map(c => c.node_id).join(', ')}`);

    return Response.json({
      selected_chains: enrichedSelections,
      selection_rationale: result.selection_rationale,
      approach_type: result.approach_type,
      session_sequence: (result.session_sequence || [])
        .map(idx => indexToId[idx] || idx)
        .filter(id => chainMap[id])
        .concat(enrichedSelections.map(c => c.chain_id))
        .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
    });

  } catch (error) {
    console.error('[selectCausalChain] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});