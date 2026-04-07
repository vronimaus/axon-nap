import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Copy, Check, Wind, Thermometer, BedDouble, Ban } from 'lucide-react';
import { createPageUrl } from '@/utils';

// Regionsbasierte Überbrückungsmaßnahmen
const BRIDGE_MEASURES = {
  default: {
    lagerung: 'Vermeide Positionen die den Schmerz verstärken. Finde eine neutrale, entlastende Position.',
    temperatur: 'Akuter Schmerz (<72h): Kälte 15 Min. | Chronisch/Verspannung: Wärme 20 Min.',
    vermeiden: 'Keine ruckartigen Bewegungen. Kein "Durcharbeiten" durch den Schmerz.',
    atem: '4-7-8 Technik: 4s einatmen, 7s halten, 8s ausatmen — 3x wiederholen.'
  },
  nacken: {
    lagerung: 'Nackenrolle oder zusammengerolltes Handtuch unter die HWS legen. Bildschirm auf Augenhöhe bringen.',
    temperatur: 'Wärme auf den Nacken (20 Min.) entspannt die Muskulatur. Bei Kribbeln: kein Wärme — Arzt aufsuchen.',
    vermeiden: 'Kein Kopf-vorwärts-Scrollen am Handy. Nicht auf dem Bauch schlafen. Keine Rotationsdehnungen.',
    atem: 'Zungenstoß: Zunge an Gaumen drücken, langsam durch die Nase atmen — senkt HWS-Spannung direkt.'
  },
  ruecken: {
    lagerung: 'Rückenlage mit Kissen unter den Knien (90°). Oder Seitenlage mit Kissen zwischen den Knien.',
    temperatur: 'Akuter LWS-Schmerz: Kälte. Chronische Verspannung: Wärme. Nie Wärme bei Ischias-Verdacht.',
    vermeiden: 'Kein langes Sitzen ohne Aufstehen. Keine Vorbeuge ohne Kniebeuge. Schwere Gegenstände nicht heben.',
    atem: 'Bauch-Atmung 4-4-4: 4s einatmen (Bauch wölbt sich), 4s halten, 4s ausatmen — reduziert LWS-Kompression.'
  },
  schulter: {
    lagerung: 'Arm in Seitenlage mit Kissen abstützen. Vermeide Arm über Kopf oder hinter dem Rücken.',
    temperatur: 'Akut: Kälte 15 Min. stündlich. Chronisch: Wärme 20 Min. vor Bewegung.',
    vermeiden: 'Kein Tragen von Gewichten. Keine Überkopf-Bewegungen. Keinen Rucksack auf der betroffenen Seite.',
    atem: 'Box-Breathing: 4s ein, 4s halten, 4s aus, 4s halten — aktiviert Parasympathikus, senkt Schmerzwahrnehmung.'
  },
  knie: {
    lagerung: 'Bein hochlagern (über Herzhöhe). Kein langes Stehen oder Sitzen mit gebeugtem Knie.',
    temperatur: 'Geschwollenes Knie: immer Kälte (20 Min., kein Direktkontakt). Kein Wärme bei Schwellung.',
    vermeiden: 'Keine Treppen wenn vermeidbar. Kein Kniebeugen unter Schmerz. Keine Rotationsbewegungen.',
    atem: '4-7-8 Atmung zur Schmerzdämpfung: aktiviert Endorphin-Ausschüttung über den Vagusnerv.'
  },
  hufte: {
    lagerung: 'Seitenlage auf der gesunden Seite, Kissen zwischen Knie und Knöchel.',
    temperatur: 'Akut: Kälte. Chronisch (Verkürzung/Steifigkeit): Wärme vor sanfter Bewegung.',
    vermeiden: 'Kein langes Sitzen (Hüftbeuger verkürzen). Kein Überkreuzen der Beine. Keine einseitige Belastung.',
    atem: 'Lange Ausatmung (doppelt so lang wie Einatmung) — aktiviert M. iliopsoas-Entspannung reflektorisch.'
  }
};

const getRegionKey = (region) => {
  const r = (region || '').toLowerCase();
  if (r.includes('nacken') || r.includes('hals') || r.includes('hws') || r.includes('zervikal')) return 'nacken';
  if (r.includes('rücken') || r.includes('lws') || r.includes('lendenwirbel') || r.includes('gesäß')) return 'ruecken';
  if (r.includes('schulter')) return 'schulter';
  if (r.includes('knie')) return 'knie';
  if (r.includes('hüfte') || r.includes('becken')) return 'hufte';
  return 'default';
};

const FLAG_LABELS = {
  numbness: 'Taubheit / Kribbeln',
  radiation: 'Ausstrahlung in Arm oder Bein',
  trauma: 'Sturz / Unfall / Trauma',
  bladder: 'Blasen- oder Darmprobleme',
  fever: 'Fieber gleichzeitig',
  night: 'Schmerz nachts schlimmer'
};

export default function RedFlagResultScreen({ region, nrs, flags = [], onGoToDiagnosis }) {
  const [copied, setCopied] = useState(false);
  const [showBridge, setShowBridge] = useState(false);

  const measures = BRIDGE_MEASURES[getRegionKey(region)] || BRIDGE_MEASURES.default;
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const physioText = `AXON Schmerzprotokoll — Für Physio/Arzt
─────────────────────────────────────────
Datum: ${today}
Schmerzlokalisation: ${region}
Intensität: ${nrs}/10 (NRS-Skala)
Erkannte Muster: ${flags.map(f => FLAG_LABELS[f] || f).join(', ') || 'Hohe Schmerzintensität (NRS ≥ 7)'}

AXON Empfehlung: Differentialdiagnose empfohlen
vor Aufnahme eines Trainingsprogramms.

Disclaimer: Erstellt durch AXON-nap App.
Dies ist keine medizinische Diagnose, sondern
eine strukturierte Ersteinschätzung auf Basis
der Nutzerangaben.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(physioText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-5 pb-10"
    >
      {/* BLOCK 0: Direkter Kontext-Hinweis — sofort sichtbar ohne Klick */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">⏸</span>
        <p className="text-sm text-amber-200 leading-relaxed">
          Deine Angaben zeigen ein Muster, bei dem wir kurz stoppen. <span className="font-semibold text-white">Nicht weil etwas schlimm ist</span> — sondern damit du sicher und effektiv trainieren kannst.
        </p>
      </div>

      {/* BLOCK 1: Warum wir das empfehlen */}
      <div className="glass rounded-2xl border border-amber-500/30 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Warum dieser Stopp?</p>
            <h3 className="text-lg font-bold text-white">Professionelle Abklärung sinnvoll</h3>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          Du hast einen Schmerz von <span className="text-amber-400 font-bold">{nrs}/10</span> im Bereich <span className="text-white font-semibold">{region}</span> angegeben
          {flags.length > 0 && ', verbunden mit Symptomen die auf eine tiefere Ursache hindeuten könnten'}.
          {' '}Dieses Muster legt nahe, dass eine Ursache vorliegen könnte, die zuerst medizinisch ausgeschlossen werden sollte — bevor wir sicher mit Bewegungsarbeit beginnen.
        </p>

        {flags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Erkannte Muster:</p>
            {flags.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {FLAG_LABELS[f] || f}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500 mt-4 italic">
          Dies ist keine medizinische Diagnose, sondern eine strukturierte Ersteinschätzung auf Basis deiner Angaben.
        </p>
      </div>

      {/* BLOCK 2: Überbrückung bis zum Termin */}
      <div className="glass rounded-2xl border border-cyan-500/20 p-5">
        <button
          onClick={() => setShowBridge(!showBridge)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Wind className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Bis zum Termin</p>
              <p className="text-white font-bold">Was dir jetzt helfen kann</p>
            </div>
          </div>
          <span className="text-slate-400 text-xl">{showBridge ? '−' : '+'}</span>
        </button>

        {showBridge && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-5 space-y-4"
          >
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
              <BedDouble className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Lagerung</p>
                <p className="text-slate-300 text-sm leading-relaxed">{measures.lagerung}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
              <Thermometer className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Wärme oder Kälte?</p>
                <p className="text-slate-300 text-sm leading-relaxed">{measures.temperatur}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
              <Ban className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Was vermeiden</p>
                <p className="text-slate-300 text-sm leading-relaxed">{measures.vermeiden}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Wind className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Atemtechnik</p>
                <p className="text-slate-300 text-sm leading-relaxed">{measures.atem}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* BLOCK 3: Physio-Brief */}
      <div className="glass rounded-2xl border border-slate-600 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dein Physio-Brief</p>
            <p className="text-white font-bold">Für den nächsten Termin</p>
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">
          {physioText}
        </div>

        <Button
          onClick={handleCopy}
          className={`w-full h-11 font-bold text-sm transition-all ${
            copied
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          {copied ? (
            <><Check className="w-4 h-4 mr-2" />Kopiert!</>
          ) : (
            <><Copy className="w-4 h-4 mr-2" />Text kopieren</>
          )}
        </Button>
      </div>

      {/* CTA: Trotzdem zum Reha-Plan? */}
      <div className="glass rounded-xl border border-slate-700 p-4 text-center">
        <p className="text-slate-400 text-xs mb-3">
          Bereits beim Arzt gewesen und grünes Licht bekommen? Dann können wir mit einem sanften Reha-Plan starten — deine Daten bleiben erhalten.
        </p>
        <Button
          onClick={onGoToDiagnosis}
          variant="outline"
          className="w-full border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-sm font-semibold"
        >
          Ja, ich war beim Arzt — Reha-Plan starten →
        </Button>
      </div>

      <p className="text-center text-xs text-slate-600 pb-4">
        AXON-nap ersetzt keine medizinische Behandlung.
      </p>
    </motion.div>
  );
}