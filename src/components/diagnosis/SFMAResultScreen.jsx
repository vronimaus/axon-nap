import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle } from 'lucide-react';

const CAUSE_MAP = {
  schmerz: {
    nacken: 'Myofasziale Hyperalgesie im M. trapezius pars descendens oder M. levator scapulae — häufig durch anhaltende Haltungsbelastung ausgelöst.',
    schulter: 'Nozizeptiver Input aus myofaszialen Triggerpunkten im M. deltoideus oder der Rotatorenmanschette — oft belastungsinduziert.',
    rücken: 'Erhöhter intramuskulärer Druck in den Mm. erector spinae oder iliolumbale Bandspannung — häufig haltungsbedingt.',
    lws: 'Kompression und nozizeptive Aktivierung im M. erector spinae — typisch bei prolongiertem Sitzen oder repetitiver Belastung.',
    hüfte: 'Myofasziale Triggerpunkte im M. piriformis oder M. tensor fasciae latae — häufig durch prolongiertes Sitzen und Hüftflexoren-Verkürzung.',
    knie: 'Reizung des Tractus iliotibialis oder des medialen Kapsel-Band-Apparats — häufig durch Fehlbelastung oder biomechanisches Malalignment.',
    fuß: 'Nozizeptive Aktivierung der Plantarfaszie oder myofasziale Triggerpunkte im M. gastrocnemius — häufig durch Laufbelastung.',
    default: 'Myofasziale Hyperalgesie in der betroffenen Region — wahrscheinlich durch mechanische Überlastung oder Haltungsveränderungen ausgelöst.'
  },
  steifigkeit: {
    nacken: 'Fasziale Adhäsion und reduzierte Gleitfähigkeit der HWS-Segmente — typisch für erhöhte Hyaluronsäure-Viskosität bei Inaktivität.',
    schulter: 'Posteriore Kapselkontraktur oder fasziale Verkürzung im glenohumeralen Bereich — eingeschränkte Außenrotation und Abduktion.',
    rücken: 'Thixotrope Verhärtung der thorakolumbalen Faszie — häufig nach prolongiertem Sitzen oder Fehlbelastung.',
    lws: 'Fasziale Verkürzung der posterioren Kette mit eingeschränkter lumbaler Extension — typisch für myofasziale Restriktion.',
    hüfte: 'Verkürzung des M. iliopsoas mit eingeschränkter Hüftextension — begleitet von faszialer Adhäsion im Tractus iliotibialis.',
    knie: 'Fasziale Verkürzung im M. quadriceps oder der ischiocruralen Gruppe — reduzierte arthrokinematische Beweglichkeit.',
    fuß: 'Eingeschränkte Dorsalextension durch fasziale Verkürzung der Wadenmuskulatur — oft durch Hyaluronsäure-Akkumulation in der plantaren Faszie.',
    default: 'Fasziale Adhäsion oder thixotrope Verhärtung in der betroffenen Region — häufig durch Inaktivität oder repetitive Fehlbelastung.'
  }
};

function getCause(type, region) {
  const regionLower = (region || '').toLowerCase();
  const typeKey = type === 'schmerz' ? 'schmerz' : 'steifigkeit';
  const map = CAUSE_MAP[typeKey];
  for (const key of Object.keys(map)) {
    if (key !== 'default' && regionLower.includes(key)) return map[key];
  }
  return map.default;
}

function getIntensityColor(nrs) {
  if (nrs >= 7) return 'text-red-400';
  if (nrs >= 4) return 'text-amber-400';
  return 'text-cyan-400';
}

function getIntensityLabel(nrs) {
  if (nrs >= 7) return 'Stark';
  if (nrs >= 4) return 'Moderat';
  return 'Leicht / Steifigkeit';
}

export default function SFMAResultScreen({ region, type, nrs, isRedFlag, onContinue }) {
  // type kommt als 'steifigkeit' oder 'schmerz' (aus symptomType im QuickCheck)
  const displayType = type === 'steifigkeit' || type === 'stiffness' ? 'steifigkeit' : 'schmerz';
  const cause = getCause(displayType, region);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-4"
    >
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          <p className="text-[10px] font-bold tracking-widest uppercase text-white">Biomechanische Analyse</p>
          <span className="ml-auto text-[9px] font-mono text-cyan-400 tracking-widest uppercase">{region}</span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Typ</p>
              <p className="text-lg font-bold text-white capitalize">{displayType}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Intensität</p>
              <p className={`text-lg font-bold ${getIntensityColor(nrs)}`}>
                {nrs > 0 ? `Stufe ${nrs}` : '—'} <span className="text-sm font-normal">({getIntensityLabel(nrs)})</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Wahrscheinliche Ursache</p>
            <p className="text-sm text-slate-200 leading-relaxed">{cause}</p>
          </div>

          {isRedFlag && (
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">
                Aufgrund deiner Angaben empfehlen wir zunächst ein Sicherheitsprotokoll.
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