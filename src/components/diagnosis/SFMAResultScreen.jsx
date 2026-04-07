import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle } from 'lucide-react';

const CAUSE_MAP = {
  schmerz: {
    nacken: 'Dein Nacken zeigt überbelastete Muskeln im Schulter-Nacken-Bereich — häufig durch langes Sitzen, Bildschirmarbeit oder Stress. Die Muskeln ziehen sich zusammen und erzeugen Druckstellen, die ausstrahlen können.',
    schulter: 'Wahrscheinlich verspannte Muskeln rund um die Schulter — oft durch einseitige Belastung oder das unbewusste "Hochziehen" der Schulter bei Stress.',
    rücken: 'Der Rücken reagiert auf anhaltenden Druck in den tiefen Rückenmuskeln — häufig durch Haltung, langes Sitzen oder eine schwache Körpermitte, die zu viel kompensieren muss.',
    lws: 'Der untere Rücken "protestiert" bei längerem Sitzen oder Überbelastung. Die Muskeln verhärten sich, was Druck auf die umgebenden Strukturen erzeugt.',
    hüfte: 'Oft steckt ein verspannter Muskel tief in der Gesäßregion oder ein verkürzter Hüftbeuger dahinter — klassisch bei Menschen, die viel sitzen.',
    knie: 'Häufig ist ein Sehnenstreifen außen am Oberschenkel gereizt oder die Knieführung stimmt nicht optimal — oft durch Überlastung oder ungewohnte Belastung.',
    fuß: 'Typisch für eine gereizte Plantarfaszie oder verspannte Wadenmuskulatur — häufig durch Laufen, langes Stehen oder falsches Schuhwerk.',
    default: 'Wahrscheinlich haben sich Muskeln in der betroffenen Region übermäßig angespannt — ein häufiges Muster nach Belastung, Stress oder einseitiger Nutzung.',
  },
  steifigkeit: {
    nacken: 'Dein Nacken hat sich durch Inaktivität oder langes Sitzen "festgezogen". Die Beweglichkeit ist grundsätzlich da, aber das Gewebe braucht einen gezielten Anstoß zum Loslassen.',
    schulter: 'Die Schulter zeigt eingeschränkte Beweglichkeit durch Bindegewebe, das sich nach Inaktivität oder Überlastung zusammenzieht. Ein gezielter Release bringt schnell Erleichterung.',
    rücken: 'Der Rücken fühlt sich steif und schwer an — das Gewebe hat sich nach längerem Sitzen oder Fehlbelastung verhärtet. Es braucht Druck und Bewegung, um wieder geschmeidig zu werden.',
    lws: 'Der untere Rücken fühlt sich blockiert an — typisch nach langem Sitzen. Das Gewebe braucht gezielte Mobilisierung.',
    hüfte: 'Eingeschränkte Hüftbeweglichkeit durch verkürzte Hüftbeuger — fast immer ein Ergebnis von zu viel Sitzen. Die Hüfte "vergisst" ihre volle Beweglichkeit.',
    knie: 'Das Knie bewegt sich schwerer — oft durch Verspannungen im Ober- oder Unterschenkel, die die Kniebewegung einschränken.',
    fuß: 'Eingeschränkte Sprunggelenksbeweglichkeit — häufig durch verspannte Wadenmuskulatur, die den Fuß in seiner Bewegung limitiert.',
    default: 'Das Gewebe hat sich zusammengezogen und braucht gezielte Mobilisierung — ein häufiges Muster nach Inaktivität, langen Sitzphasen oder einseitiger Belastung.',
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
const MOVEMENT_COLORS = { 1: 'text-emerald-400', 2: 'text-yellow-400', 3: 'text-orange-400', 4: 'text-red-400' };

function PainBadge({ label, value }) {
  const color = value === 0 ? 'text-slate-400' : value <= 2 ? 'text-emerald-400' : value <= 4 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 text-center">
      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}<span className="text-sm font-normal text-slate-500">/8</span></p>
    </div>
  );
}

export default function SFMAResultScreen({ region, type, nrs, movement_level, pain_rest, pain_move, isRedFlag, onContinue }) {
  const isStiffnessOnly = (pain_rest === 0 || pain_rest == null) && (pain_move === 0 || pain_move == null);
  const displayType = isStiffnessOnly ? 'steifigkeit' : 'schmerz';
  const cause = getCause(displayType, region);

  // Detect pattern: pain only on movement
  const onlyOnMove = (pain_rest === 0 || pain_rest == null) && pain_move > 0;
  const worseOnMove = pain_move > pain_rest;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-4"
    >
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          <p className="text-[10px] font-bold tracking-widest uppercase text-white">AXON Analyse</p>
          <span className="ml-auto text-[9px] font-mono text-cyan-400 tracking-widest uppercase">{region}</span>
        </div>

        <div className="p-5 space-y-4">

          {/* Bewegung + Schmerz-Werte */}
          <div className="grid grid-cols-3 gap-2">
            {/* Bewegungsqualität */}
            <div className="bg-slate-800/60 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Bewegung</p>
              <p className={`text-lg font-black ${MOVEMENT_COLORS[movement_level] || 'text-slate-400'}`}>
                {movement_level}/4
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{MOVEMENT_LABELS[movement_level] || '—'}</p>
            </div>
            <PainBadge label="Ruhe" value={pain_rest ?? 0} />
            <PainBadge label="Bewegung" value={pain_move ?? 0} />
          </div>

          {/* Schmerzmuster-Hinweis */}
          {onlyOnMove && (
            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30">
              <p className="text-xs text-blue-300 leading-relaxed">
                <span className="font-bold">Belastungsschmerz:</span> In Ruhe kein Schmerz — er entsteht erst bei Bewegung. Das deutet auf ein mechanisches Problem, kein entzündliches.
              </p>
            </div>
          )}
          {worseOnMove && !onlyOnMove && (
            <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30">
              <p className="text-xs text-amber-300 leading-relaxed">
                <span className="font-bold">Bewegungsverstärkung:</span> Schmerz steigt bei Belastung. Das Gewebe reagiert auf mechanischen Druck — ein klares Signal für den MFR-Reset.
              </p>
            </div>
          )}

          {/* Ursache */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Was dahinter steckt</p>
            <p className="text-sm text-slate-200 leading-relaxed">{cause}</p>
          </div>

          {isRedFlag && (
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">
                Aufgrund deiner Angaben zeigen wir dir zunächst ein Sicherheitsprotokoll.
              </p>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={onContinue}
        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-950 font-bold tracking-wide"
      >
        {isRedFlag ? 'Sicherheitsprotokoll ansehen' : 'Zum Tune-Up'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}