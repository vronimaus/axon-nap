import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CAUSE_MAP = {
  schmerz: {
    nacken: 'Dein Nacken zeigt überbelastete Muskeln im Schulter-Nacken-Bereich — typisch bei Bildschirmarbeit oder Stress. Die Muskeln ziehen sich zusammen und verstärken den Druck. Ein gezielter MFR-Reset aktiviert die Ruffini-Rezeptoren und entspannt das Gewebe.',
    schulter: 'Verspannte Muskulatur rund um die Schulter — meist durch einseitige Belastung (Laptop, Sport) oder das unbewusste "Hochziehen" bei Stress. Der MFR-Druck setzt das parasympathische Nervensystem in Bewegung und baut Spannung ab.',
    rücken: 'Dein Rücken reagiert auf Druck in den tiefen Muskeln — häufig durch Haltung oder eine schwache Körpermitte, die zu viel kompensieren muss. Das verhärtete Bindegewebe braucht mechanischen Druck (Thixotropie), um wieder geschmeidig zu werden.',
    lws: 'Unterer Rücken unter Druck — typisch nach längerem Sitzen oder Überbelastung. Die Muskeln sind in einer ständigen Anspannung, was den Schmerzkreislauf aufrecht erhält. MFR bricht diesen Zyklus durch.',
    hüfte: 'Ein verspannter Muskel tief in der Gesäßregion oder ein verkürzter Hüftbeuger — klassisch bei Büromenschen. Das harte Gewebe limitiert die Hüftbeweglichkeit und erzeugt Kompensationsmuster.',
    knie: 'Ein gereizter Sehnenstreifen außen am Oberschenkel oder suboptimale Knieführung — oft durch Überlastung oder ungewohnte Bewegungsmuster. Das Bindegewebe braucht gezielten Druck, um wieder elastisch zu werden.',
    fuß: 'Gereizte Plantarfaszie oder verspannte Wadenmuskulatur — häufig durch langes Stehen, Laufen oder falsches Schuhwerk. Das Gewebe verhärtet und limitiert die Sprunggelenksbeweglichkeit.',
    default: 'Das Muskel- und Bindegewebe in dieser Region ist übermäßig angespannt und verhärtet. Die Ursache liegt oft in Haltung, einseitiger Belastung oder chronischem Stress. Ein MFR-Reset löst die Verspannung durch mechanischen Druck.',
  },
  steifigkeit: {
    nacken: 'Dein Nacken hat sich durch Inaktivität oder langes Sitzen "festgezogen". Das Bindegewebe ist weniger elastisch geworden. Ein gezielter MFR-Reset reaktiviert die Gewebeelastizität — du wirst sofort mehr Bewegungsfreiheit spüren.',
    schulter: 'Die Schulter zeigt eingeschränkte Beweglichkeit durch verhärtetes Bindegewebe nach Inaktivität. Die gute Nachricht: Ein gezielter Release bringt schnell und spürbar Erleichterung.',
    rücken: 'Der Rücken fühlt sich steif und schwer an — das Gewebe hat sich nach längerem Sitzen oder Inaktivität zusammengezogen. Es braucht gezielten mechanischen Druck (MFR), um wieder flüssig zu werden.',
    lws: 'Der untere Rücken fühlt sich blockiert an — ein klassisches Zeichen von Gewebeverhärtung durch zu viel Sitzen. MFR reaktiviert die Gewebeelastizität direkt.',
    hüfte: 'Eingeschränkte Hüftbeweglichkeit durch verkürzte Hüftbeuger — fast immer ein Ergebnis von zu viel Sitzen. Das Gewebe "vergisst" seine volle Beweglichkeit. Ein Reset bringt die Flexibilität sofort zurück.',
    knie: 'Das Knie bewegt sich schwerer — meist durch Verspannungen in Oberschenkel oder Unterschenkel. Diese Muskeln limitieren aktiv die Kniebewegung. Ein gezielter Release löst diese Blockade.',
    fuß: 'Eingeschränkte Sprunggelenksbeweglichkeit durch verspannte Wadenmuskulatur. Das verhärtete Gewebe limitiert aktiv deine Bewegungsfreiheit. MFR reaktiviert die Elastizität direkt.',
    default: 'Das Bindegewebe ist durch Inaktivität weniger elastisch geworden und limitiert deine Bewegung. Ein gezielter MFR-Reset reaktiviert die Gewebeelastizität — du wirst sofort Unterschiede spüren.',
  },
};

function getCause(symptomType, region) {
  const regionLower = (region || '').toLowerCase();
  const typeKey = symptomType === 'steifigkeit' ? 'steifigkeit' : 'schmerz';
  const map = CAUSE_MAP[typeKey];
  for (const key of Object.keys(map)) {
    if (key !== 'default' && regionLower.includes(key)) return map[key];
  }
  return map.default;
}

const MOVEMENT_LABELS = { 1: 'Frei', 2: 'Zäh', 3: 'Eingeschränkt', 4: 'Blockiert' };

function MetricBox({ label, value, max }) {
  return (
    <div className="bg-slate-800/40 border border-cyan-500/30 rounded-xl p-4 text-center">
      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-3">{label}</p>
      <p className="text-3xl font-black text-white">{value}<span className="text-xs font-normal text-slate-400">/{max}</span></p>
      {label === 'Bewegung' && <p className="text-[10px] text-slate-400 mt-2">{MOVEMENT_LABELS[value] || '—'}</p>}
    </div>
  );
}

export default function SFMAResultScreen({ region, type, nrs, movement_level, pain_rest, pain_move, isRedFlag, onContinue, selectedChains = null, isLoadingChains = false }) {
  const [snippets, setSnippets] = useState([]);
  const [loadingSnippets, setLoadingSnippets] = useState(false);

  const isStiffnessOnly = (pain_rest === 0 || pain_rest == null) && (pain_move === 0 || pain_move == null);
  const displayType = isStiffnessOnly ? 'steifigkeit' : 'schmerz';
  const cause = getCause(displayType, region);

  // Load KnowledgeSnippets for selected chains
  useEffect(() => {
    if (!selectedChains || selectedChains.length === 0 || isLoadingChains) return;
    
    setLoadingSnippets(true);
    const nodeIds = selectedChains.map(c => c.node_id).filter(Boolean);
    
    Promise.all(
      nodeIds.map(nodeId =>
        base44.entities.KnowledgeSnippet.filter({ node_id: nodeId, is_active: true })
          .catch(() => [])
      )
    )
      .then(results => {
        const snippetList = results.flat();
        setSnippets(snippetList);
      })
      .catch(() => setSnippets([]))
      .finally(() => setLoadingSnippets(false));
  }, [selectedChains, isLoadingChains]);

  // Detect pattern: pain only on movement
  const onlyOnMove = (pain_rest === 0 || pain_rest == null) && pain_move > 0;
  const worseOnMove = pain_move > pain_rest;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-4"
    >
      <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/50 overflow-hidden">
        <div className="border-b border-cyan-500/30 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <p className="text-[10px] font-bold tracking-widest uppercase text-white">AXON Analyse</p>
          </div>
          <span className="text-[9px] font-mono text-cyan-400 tracking-widest uppercase">{region}</span>
        </div>

        <div className="p-5 space-y-4">

          {/* Bewegung + Schmerz-Werte */}
          <div className="grid grid-cols-3 gap-3">
            <MetricBox label="Bewegung" value={movement_level} max={4} />
            <MetricBox label="Ruhe" value={pain_rest ?? 0} max={8} />
            <MetricBox label="Belastung" value={pain_move ?? 0} max={8} />
          </div>

          {/* Ursache - monochrom Cyan */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-cyan-500/30">
            <p className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold mb-3">Was dahinter steckt</p>
            <p className="text-sm text-slate-200 leading-relaxed">{cause}</p>
          </div>

          {isRedFlag && (
            <div className="bg-slate-800/30 rounded-xl p-3 border border-cyan-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                Aufgrund deiner Angaben zeigen wir dir zunächst ein Sicherheitsprotokoll.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* LLM-ausgewählte Ketten anzeigen */}
      {!isRedFlag && selectedChains?.length > 0 && (
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-4 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-600 mb-2">AXON Analyse — Kausalfaktor</p>
          {selectedChains.slice(0, 2).map((chain, i) => (
            <div key={chain.chain_id || i} className="flex items-start gap-3">
              <span className="text-[9px] font-mono text-slate-600 mt-0.5 w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-300 truncate">{chain.node_name_de}</p>
                <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">{chain.selection_reason}</p>
              </div>
              <span className="text-[9px] text-cyan-700 font-mono shrink-0">{Math.round((chain.confidence || 0) * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Knowledge Snippets für ausgewählte Nodes */}
      {!isRedFlag && snippets.length > 0 && (
        <div className="space-y-3">
          {snippets.map((snippet) => (
            <motion.div
              key={snippet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-cyan-500/20 bg-slate-900/40 overflow-hidden"
            >
              {snippet.image_url && (
                <img
                  src={snippet.image_url}
                  alt={snippet.node_name_de}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-3">
                <p className="text-xs font-bold text-cyan-400 mb-1.5">{snippet.title}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
                  {snippet.summary}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isRedFlag && isLoadingChains && (
        <div className="rounded-2xl border border-slate-700/40 p-4 text-center">
          <p className="text-[10px] text-slate-500 animate-pulse">Analysiere Faszien-Ketten…</p>
        </div>
      )}

      <Button
        onClick={onContinue}
        disabled={isLoadingChains}
        className="w-full h-12 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 font-bold tracking-wide disabled:opacity-50"
      >
        {isRedFlag ? 'Sicherheitsprotokoll ansehen' : isLoadingChains ? 'Analysiere…' : 'Zum Tune-Up'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}