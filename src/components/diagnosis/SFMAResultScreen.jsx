import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle } from 'lucide-react';

// Statische regelbasierte Ursachen pro Region + Typ
const CAUSE_MAP = {
  schmerz: {
    nacken: 'Typisch für myofasziale Triggerpunkte im oberen Trapez oder Levator scapulae — oft ausgelöst durch Haltungsbelastung.',
    schulter: 'Wahrscheinlich myofasziale Triggerpunkte im Deltamuskel oder der Rotatorenmanschette — häufig durch Überlastung.',
    rücken: 'Typisch für Kompression der tiefen Rückenstrecker oder iliolumbale Bandspannung — oft haltungsbedingt.',
    lws: 'Hinweis auf erhöhten intramuskulären Druck im M. erector spinae — häufig durch Sitzen oder Überbelastung.',
    hüfte: 'Wahrscheinlich Triggerpunkte im M. piriformis oder TFL — oft durch Sitzbelastung oder Hüftflexoren-Verkürzung.',
    knie: 'Häufig Reizung des IT-Bands oder des medialen Kollateralbandbereichs — oft durch Überlastung oder Alignment-Probleme.',
    fuß: 'Typisch für Plantarfasziitis oder Triggerpunkte im M. gastrocnemius — häufig durch Laufbelastung.',
    default: 'Wahrscheinlich myofasziale Triggerpunkte in der betroffenen Region — oft durch Überlastung oder Haltungsbelastung.'
  },
  steifigkeit: {
    nacken: 'Reduzierte Beweglichkeit der HWS — oft durch fasziale Adhäsionen im oberen Trapez oder eingeschränkte Gelenkkapsel.',
    schulter: 'Eingeschränkte Schulterrotation — häufig durch posteriore Kapselkontraktur oder fasziale Verkürzung.',
    rücken: 'Fasziale Verkürzung der thorakalen Kette — häufig nach längerem Sitzen oder Fehlbelastung.',
    lws: 'Eingeschränkte LWS-Extension — typisch für fasziale Verkürzung der posterioren Kette.',
    hüfte: 'Eingeschränkte Hüftmobilität — oft durch verkürzte Hüftflexoren oder fasziale Adhäsionen im M. iliopsoas.',
    knie: 'Reduzierte Kniebeweglichkeit — häufig durch fasziale Verkürzung im Quadrizeps oder Hamstrings.',
    fuß: 'Eingeschränkte Sprunggelenksbeweglichkeit — oft durch fasziale Verkürzung in der Wadenmuskulatur.',
    default: 'Fasziale Verkürzung oder Adhäsion in der betroffenen Region — häufig nach Inaktivität oder Überbelastung.'
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

function getNRSColor(nrs) {
  if (nrs >= 7) return 'text-red-400';
  if (nrs >= 4) return 'text-amber-400';
  return 'text-emerald-400';
}

function getNRSLabel(nrs) {
  if (nrs >= 7) return 'Hoch';
  if (nrs >= 4) return 'Mittel';
  return 'Leicht';
}

export default function SFMAResultScreen({ region, type, nrs, isRedFlag, onContinue }) {
  const cause = getCause(type, region);
  const nrsColor = getNRSColor(nrs);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-4"
    >
      {/* Analyse Header */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          <p className="text-[10px] font-bold tracking-widest uppercase text-white">Analyse-Ergebnis</p>
          <span className="ml-auto text-[9px] font-mono text-cyan-400 tracking-widest uppercase">{region}</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Typ + Intensität */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Typ</p>
              <p className="text-lg font-bold text-white capitalize">{type}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Intensität</p>
              <p className={`text-lg font-bold ${nrsColor}`}>
                Stufe {nrs} <span className="text-sm font-normal">({getNRSLabel(nrs)})</span>
              </p>
            </div>
          </div>

          {/* Ursache */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Wahrscheinliche Ursache</p>
            <p className="text-sm text-slate-200 leading-relaxed">{cause}</p>
          </div>

          {/* Red Flag Hinweis */}
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

      {/* CTA */}
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