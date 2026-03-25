import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight } from 'lucide-react';
import InteractiveBodyMapInput from '@/components/diagnosis/InteractiveBodyMapInput';

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const REGION_MAP = {
  'Nacken/obere Halswirbelsäule': { label: 'Nacken', tag: 'HWS',
    root: 'Brustwirbelsäule & Schulterblatt', symptom: 'Nackensteifheit', chain: 'Dorsale Kette',
    steps: ['MFR Subokzipital (N1)', 'Neuro-Drill: Augenverfolgung', 'Skapula-Aktivierung'] },
  'Hinterkopf': { label: 'Hinterkopf', tag: 'HWS',
    root: 'Überaktive Nackenextensoren', symptom: 'Kopfspannung', chain: 'Dorsale Kette',
    steps: ['MFR Schädelbasis', 'Neuro-Drill: Kopfrotation', 'Deep-Neck-Flexor Aktivierung'] },
  'Kopf/Stirn': { label: 'Kopf / Stirn', tag: 'NEU',
    root: 'Kiefer / Augenmuskulatur', symptom: 'Kopfschmerz frontal', chain: 'Craniale Faszie',
    steps: ['MFR Temporalis', 'Neuro-Drill: Sakkadentraining', 'Atemintegration'] },
  'Ohr/Kiefergelenk': { label: 'Kiefer (TMJ)', tag: 'TMJ',
    root: 'Nacken & BWS-Kopplung', symptom: 'Kieferschmerz / Knacken', chain: 'Craniale Kette',
    steps: ['MFR Masseter / Pterygoid', 'Kieferöffnungs-Drill', 'Zungenposition Reset'] },
  'Hals vorne': { label: 'Hals vorne', tag: 'HWS',
    root: 'Vorwärtskopfhaltung', symptom: 'Halsspannung', chain: 'Ventrale Kette',
    steps: ['Deep-Neck-Flexor Aktivierung', 'Chin-Tuck Drill', 'BWS Extension'] },
  'Schulter vorne/Acromion': { label: 'Schulter', tag: 'SHD',
    root: 'Skapula-Dynamik & Pectoralis Minor', symptom: 'Schulterimpingement', chain: 'Laterale Armkette',
    steps: ['MFR Pec Minor (N3)', 'Serratus-Aktivierung', 'Wall-Slide Integration'] },
  'Schulter hinten/Acromion': { label: 'Schulter hinten', tag: 'SHD',
    root: 'Rotatorenmanschette & Infraspinatus', symptom: 'Hintere Schulter', chain: 'Posteriore Armkette',
    steps: ['MFR Infraspinatus', 'Außenrotations-Drill', 'Face-Pull Integration'] },
  'Schulterblatt': { label: 'Schulterblatt', tag: 'SHD',
    root: 'Schwacher Serratus anterior', symptom: 'Skapula alata', chain: 'Stabilisierungs-Kette',
    steps: ['MFR Rhomboiden', 'Serratus-Aktivierung', 'Push-Up-Plus Drill'] },
  'oberer Rücken/Nacken': { label: 'Oberer Rücken', tag: 'BWS',
    root: 'Chronische BWS-Flexion (Sitzen)', symptom: 'Oberrückenspannung', chain: 'Dorsale Kette',
    steps: ['MFR Thorakal (N5)', 'BWS Extensions-Drill', 'Rotation Integration'] },
  'oberer Rücken': { label: 'Rücken oben', tag: 'BWS',
    root: 'Fehlende BWS-Rotation', symptom: 'Steifheit oberer Rücken', chain: 'Dorsale Kette',
    steps: ['MFR Erector spinae', 'Rotations-Mobilisation', 'Thread-the-Needle'] },
  'mittlerer Rücken': { label: 'Rücken Mitte', tag: 'BWS',
    root: 'BWS/LWS-Übergangszone', symptom: 'Ziehendes Gefühl Mitte Rücken', chain: 'Dorsale Kette',
    steps: ['MFR TL-Junction', 'Quadratus-Lumborum-Release', 'Hip-Hinge Drill'] },
  'unterer Rücken/Lendenwirbelsäule': { label: 'LWS / Rücken unten', tag: 'LWS',
    root: 'Eingeschränkte Hüftmobilität (Psoas)', symptom: 'LWS-Schmerz', chain: 'Ventrale Faszienkette',
    steps: ['MFR Psoas (N6)', 'Gluteus-Aktivierung', 'Deadbug Neuro-Integration'] },
  'Becken/Hüfte': { label: 'Hüfte', tag: 'HFT',
    root: 'Eingeschränkte Hüftrotation (6 Ebenen)', symptom: 'Hüftspannung / -schmerz', chain: 'Zentrale Kette',
    steps: ['MFR TFL / Piriformis (N7)', 'Hip-90/90 Mobilisation', 'Gluteus-Aktivierung'] },
  'Gesäß': { label: 'Gesäß / Piriformis', tag: 'HFT',
    root: 'Piriformis-Kompression / Gluteus-Schwäche', symptom: 'Gesäßschmerz / Ischias-ähnlich', chain: 'Posteriore Beinkette',
    steps: ['MFR Piriformis (N8)', 'Clamshell Drill', 'Single-Leg Hip-Hinge'] },
  'Oberschenkel vorne': { label: 'Oberschenkel vorne', tag: 'BNT',
    root: 'Überaktive Hüftbeuger / Rectus Femoris', symptom: 'Quadrizeps-Spannung', chain: 'Ventrale Beinkette',
    steps: ['MFR Rectus Femoris', 'Hüftextensions-Drill', 'Split-Squat Integration'] },
  'Oberschenkel hinten': { label: 'Oberschenkel hinten', tag: 'BNT',
    root: 'Hamstring-Überlastung oder neuraler Ursprung', symptom: 'Hinterer Oberschenkel', chain: 'Posteriore Beinkette',
    steps: ['Neural Floss Ischias', 'MFR Hamstring', 'Nordic Curl progressiv'] },
  'Knie vorne': { label: 'Knie', tag: 'KNE',
    root: 'Dysbalance Hüfte (oben) & Sprunggelenk (unten)', symptom: 'Knieschmerz', chain: 'Gesamte Beinkette',
    steps: ['MFR IT-Band / VMO', 'Hüft-Abduktions-Drill', 'Sprunggelenk-Mobilisation'] },
  'Kniekehle': { label: 'Kniekehle', tag: 'KNE',
    root: 'Hamstring-Ansatz / Popliteus', symptom: 'Hinterer Knieschmerz', chain: 'Posteriore Kette',
    steps: ['MFR Popliteus', 'Neural Floss', 'Eccentric Hamstring Curl'] },
  'Unterschenkel/Schienbein': { label: 'Schienbein', tag: 'FUS',
    root: 'Eingeschränkte Dorsalflexion', symptom: 'Schienbeinkante / Shin Splints', chain: 'Ventrale Beinkette',
    steps: ['MFR Tibialis anterior', 'Dorsalflexions-Drill', 'Einbeinstand Integration'] },
  'Wade': { label: 'Wade', tag: 'FUS',
    root: 'Soleus/Gastrocnemius-Spannung', symptom: 'Wadenspannung / Krämpfe', chain: 'Posteriore Beinkette',
    steps: ['MFR Soleus (N12)', 'Dorsalflexions-Mobilisation', 'Wadenheben exzentrisch'] },
  'Fuß/Knöchel vorne': { label: 'Fuß / Knöchel', tag: 'FUS',
    root: 'Dorsalflexions-Einschränkung blockiert Gesamtkette', symptom: 'Knöchelspannung', chain: 'Distale Kette',
    steps: ['MFR Plantarfaszie', 'Dorsalflexions-Drill', 'Single-Leg Balance'] },
  'Ferse/Achillessehne': { label: 'Achilles / Ferse', tag: 'FUS',
    root: 'Chronische Wadenspannung / Fußfehlstellung', symptom: 'Fersensporn / Achillestendinopathie', chain: 'Posteriore Beinkette',
    steps: ['MFR Achillessehne / Soleus', 'Exzentrisches Wadenheben', 'Fußgewölbe-Aktivierung'] },
  'Oberarm': { label: 'Oberarm', tag: 'ARM',
    root: 'Schulter- / Ellenbogen-Kompensation', symptom: 'Oberarmschmerz', chain: 'Laterale Armkette',
    steps: ['MFR Bizeps / Trizeps', 'Schulterrotations-Drill', 'Loaded Carry'] },
  'Ellenbogen-Beuge': { label: 'Ellenbogen', tag: 'ARM',
    root: 'Schulter- oder Handgelenks-Kette', symptom: 'Ellenbogenschmerz', chain: 'Mediale Armkette',
    steps: ['MFR Golfer / Tennis Elbow', 'Wrist-Extension-Drill', 'Eccentric Curl'] },
  'Ellenbogen': { label: 'Ellenbogen', tag: 'ARM',
    root: 'Über- oder Unterbelastung der Armkette', symptom: 'Ellenbogenspannung', chain: 'Laterale Armkette',
    steps: ['MFR Brachialis', 'Unterarm-Faszienrelease', 'Grip Strength Integration'] },
  'Unterarm/Handgelenk': { label: 'Unterarm / Handgelenk', tag: 'ARM',
    root: 'Repetitive Belastung / Schulter-Kompensation', symptom: 'Handgelenkspannung', chain: 'Distale Armkette',
    steps: ['MFR Unterarm-Flexoren', 'Handgelenks-Rotations-Drill', 'Wrist-CARs'] },
  'obere Brust/Schlüsselbein': { label: 'Brust oben', tag: 'BWS',
    root: 'Pectoralis Minor / Atemeinschränkung', symptom: 'Engegefühl oben', chain: 'Ventrale Kette',
    steps: ['MFR Pec Minor (N3)', 'Atemexpansions-Drill', 'Schulter-Außenrotation'] },
  'mittlere Brust': { label: 'Brust Mitte', tag: 'BWS',
    root: 'Chronische Flexionshaltung', symptom: 'Brustspannung', chain: 'Ventrale Kette',
    steps: ['MFR Brustfaszie', 'BWS Extensions-Drill', 'Öffnungs-Integration'] },
  'Bauch oben': { label: 'Oberbauch', tag: 'BWS',
    root: 'Zwerchfell-Einschränkung', symptom: 'Oberbauchspannung', chain: 'Ventrale Faszienkette',
    steps: ['Zwerchfell-Mobilisation', '360° Atemexpansion', 'Core-Stabilisation'] },
  'Bauch Mitte/Bauchnabel': { label: 'Bauchmitte', tag: 'BWS',
    root: 'Fasziale Adhäsion / Psoas', symptom: 'Bauchspannung', chain: 'Ventrale Kette',
    steps: ['MFR Psoas / Rectus', 'Hüftbeuger-Länge', 'Deadbug Integration'] },
  'Unterbauch/Becken': { label: 'Unterbauch', tag: 'BKN',
    root: 'Beckenboden / Hüftbeuger', symptom: 'Unterbauch- / Leistenschmerz', chain: 'Pelvische Kette',
    steps: ['MFR Ileopsoas', 'Beckenboden-Atemübung', 'Hip-Flexor-Mobilisation'] },
};

const FALLBACK_STEPS = ['Body-Map Scan', 'Faszialer Drucktest', 'Neuro-Verankerung'];

const TAG_COLORS = {
  HWS: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  NEU: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  TMJ: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  SHD: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  BWS: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  LWS: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  HFT: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  BNT: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
  KNE: 'bg-green-500/15 text-green-300 border-green-500/30',
  FUS: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ARM: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  BKN: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

/* ─── Sub-components ────────────────────────────────────────────────────────── */



function DiagnosisPanel({ regionData, selectedRegion, onCtaClick }) {
  const tagClass = TAG_COLORS[regionData.tag] || 'bg-slate-700/30 text-slate-300 border-slate-600';

  return (
    <motion.div
      key={selectedRegion}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Header chip */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest border rounded-full px-3 py-1 ${tagClass}`}>
          <span>{regionData.tag}</span>
        </span>
        <span className="text-lg font-black text-white">{regionData.label}</span>
      </div>

      {/* Root Cause Card */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Root Cause</p>
        <p className="text-white font-semibold text-sm leading-snug">{regionData.root}</p>
        <p className="text-slate-400 text-xs">Symptom: <span className="text-slate-300">{regionData.symptom}</span></p>
      </div>

      {/* Fascial Chain */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 px-4 py-3 flex items-center gap-3">
        <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Betroffene Kette</p>
          <p className="text-sm font-semibold text-cyan-300">{regionData.chain}</p>
        </div>
      </div>

      {/* Protocol Steps */}
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Dein Protokoll</p>
        <div className="space-y-2">
          {(regionData.steps || FALLBACK_STEPS).map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-cyan-400">{i + 1}</span>
              </div>
              <span className="text-slate-300 text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onCtaClick}
        className="w-full flex items-center justify-between gap-2 bg-white hover:bg-cyan-50 text-black font-black text-sm px-5 py-4 rounded-2xl transition-colors duration-200 cursor-pointer group"
      >
        <span>Vollständiges Protokoll starten</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
      </button>
    </motion.div>
  );
}

/* ─── Main Section ──────────────────────────────────────────────────────────── */
export default function SystemAuditSection({ onCtaClick }) {
  const [selectedRegion, setSelectedRegion] = useState(null);

  const handleBodyMapSubmit = (mapData) => {
    setSelectedRegion(mapData.region);
  };

  const regionData = selectedRegion
    ? (REGION_MAP[selectedRegion] || {
        label: selectedRegion, tag: 'NEU',
        root: 'AXON analysiert die kinetische Kette', symptom: selectedRegion, chain: 'Individuelle Kette', tag: 'NEU',
        steps: FALLBACK_STEPS,
      })
    : null;

  return (
    <section id="audit" className="py-24 px-6 bg-slate-950">
      <div className="max-w-5xl mx-auto">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-400 mb-3">Interaktiver System-Audit</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4 text-balance">
            Dein Schmerzpunkt ist<br />
            <span className="text-slate-400">nicht die Ursache.</span>
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-base leading-relaxed">
            Klicke auf deine Schmerzstelle — AXON zeigt Root Cause, betroffene Faszialkette und dein Protokoll.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
        >
          {/* Left: Body Map Module */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
            <div className="mb-4">
              <p className="text-white font-bold text-base mb-1">Wo drückt der Schuh?</p>
              <p className="text-slate-400 text-xs">Markiere deine Schmerzstelle — AXON zeigt Root-Cause + Protokoll.</p>
            </div>
            <InteractiveBodyMapInput onSubmit={handleBodyMapSubmit} />
          </div>

          {/* Right: Diagnosis Module */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 min-h-[420px]">
            <AnimatePresence mode="wait">
              {regionData
                ? <DiagnosisPanel regionData={regionData} selectedRegion={selectedRegion} onCtaClick={onCtaClick} />
                : <PlaceholderPanel />
              }
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </section>
  );
}