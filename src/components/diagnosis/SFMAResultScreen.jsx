import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle } from 'lucide-react';

const CAUSE_MAP = {
  schmerz: {
    nacken: 'Dein Nacken zeigt Anzeichen überbelasteter Muskeln im Schulter-Nacken-Bereich — oft ausgelöst durch langes Sitzen, Bildschirmarbeit oder Stress. Die Muskeln ziehen sich zusammen und erzeugen Druckpunkte, die strahlen können.',
    schulter: 'Wahrscheinlich verspannte oder überbelastete Muskeln rund um die Schulter. Häufig entsteht das durch einseitige Belastung, zu viel Sitzen oder eine Schulter, die sich "hochzieht" — oft unbewusst.',
    rücken: 'Der Rücken reagiert typischerweise auf anhaltenden Druck in den tiefen Rückenmuskeln — oft durch schlechte Haltung, langes Sitzen oder eine schwache Körpermitte, die zu viel kompensieren muss.',
    lws: 'Der untere Rücken ist oft der erste, der bei längerem Sitzen oder Überbelastung "protestiert". Die Muskeln verhärten sich, was Druck auf die umgebenden Strukturen erzeugt.',
    hüfte: 'Oft steckt ein verspannter Piriformis-Muskel (tief in der Gesäßregion) oder ein verkürzter Hüftbeuger dahinter — klassisch bei Menschen, die viel sitzen.',
    knie: 'Häufig ist das IT-Band (ein Sehnenstreifen außen am Oberschenkel) gereizt oder die Knieführung stimmt nicht optimal — oft durch Überlastung oder ungewohnte Belastung.',
    fuß: 'Typisch für eine gereizte Plantarfaszie (das Bindegewebe unter dem Fuß) oder verspannte Wadenmuskulatur — häufig durch Laufen, langes Stehen oder falsches Schuhwerk.',
    default: 'Wahrscheinlich haben sich Muskeln in der betroffenen Region übermäßig angespannt — ein häufiges Muster nach Belastung, Stress oder einseitiger Nutzung.'
  },
  steifigkeit: {
    nacken: 'Dein Nacken fühlt sich eingerostet an — das Gewebe hat sich durch Inaktivität oder langes Sitzen "festgezogen". Die Beweglichkeit ist da, aber das System braucht einen Anstoß zum Loslassen.',
    schulter: 'Die Schulter zeigt eingeschränkte Beweglichkeit — oft durch verdicktes Bindegewebe, das sich nach Inaktivität oder Überlastung zusammenzieht. Ein gezielter Release bringt schnell Erleichterung.',
    rücken: 'Der Rücken fühlt sich steif und schwer an — das Bindegewebe hat sich nach längerem Sitzen oder Fehlbelastung verhärtet. Es braucht Druck und Bewegung, um wieder geschmeidig zu werden.',
    lws: 'Der untere Rücken "zieht" oder fühlt sich blockiert an — typisch nach langem Sitzen. Das Gewebe rund um die Lendenwirbel braucht gezielte Mobilisierung.',
    hüfte: 'Eingeschränkte Hüftbeweglichkeit deutet auf verkürzte Hüftbeuger hin — fast immer ein Ergebnis von zu viel Sitzen. Die Hüfte "vergisst" ihre volle Beweglichkeit.',
    knie: 'Das Knie bewegt sich schwerer als gewohnt — oft liegt das an Verspannungen im Ober- oder Unterschenkel, die die Kniebewegung einschränken.',
    fuß: 'Eingeschränkte Sprunggelenksbeweglichkeit — häufig durch verspannte Wadenmuskeln oder Achillessehne, die den Fuß in seiner Bewegung limitieren.',
    default: 'Das Gewebe in der betroffenen Region hat sich zusammengezogen und braucht gezielte Mobilisierung — ein häufiges Muster nach Inaktivität, langen Sitzphasen oder einseitiger Belastung.'
  }
};

function getCause(symptomType, region) {
  const regionLower = (region || '').toLowerCase();
  const typeKey = (symptomType === 'steifigkeit' || symptomType === 'stiffness') ? 'steifigkeit' : 'schmerz';
  const map = CAUSE_MAP[typeKey];
  for (const key of Object.keys(map)) {
    if (key !== 'default' && regionLower.includes(key)) return map[key];
  }
  return map.default;
}

function getIntensityColor(nrs) {
  if (nrs >= 7) return 'text-red-400';
  if (nrs >= 4) return 'text-amber-400';
  return 'text-emerald-400';
}

export default function SFMAResultScreen({ region, type, nrs, stiffness_level, isRedFlag, onContinue }) {
  const isStiffness = type === 'steifigkeit' || type === 'stiffness';
  const displayType = isStiffness ? 'Steifigkeit' : 'Schmerz';
  const displayIntensity = isStiffness ? stiffness_level : nrs;
  const cause = getCause(type, region);

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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Symptom</p>
              <p className="text-lg font-bold text-white">{displayType}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Intensität</p>
              <p className={`text-lg font-bold ${isStiffness ? 'text-cyan-400' : getIntensityColor(nrs)}`}>
                {displayIntensity ? `Stufe ${displayIntensity}/10` : '—'}
              </p>
            </div>
          </div>

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