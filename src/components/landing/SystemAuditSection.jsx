import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import InteractiveBodyMapInput from '@/components/diagnosis/InteractiveBodyMapInput';

const REGION_MAP = {
  // Nacken / Kopf
  'Nacken/obere Halswirbelsäule': { label: 'Nacken', emoji: '🧠',
    diagnosis: 'Nackensteifigkeit ist meist eine Schutzreaktion — nicht das eigentliche Problem.',
    solution: 'AXON testet die Schulter-Nacken-Kette und liefert einen präzisen Release + Neuro-Verankerung.' },
  'Hinterkopf': { label: 'Hinterkopf', emoji: '🧠',
    diagnosis: 'Spannungen am Hinterkopf entstehen oft durch überaktive Nackenextensoren.',
    solution: 'AXON prüft die Schädelbasis und gibt dir ein gezieltes Subokzipital-Release-Protokoll.' },
  'Kopf/Stirn': { label: 'Kopf / Stirn', emoji: '🧠',
    diagnosis: 'Kopfschmerzen frontal sind häufig auf Kieferfehlstellung oder Augenmuskeln zurückzuführen.',
    solution: 'AXON analysiert den kranialen Bereich und kombiniert MFR mit Neuro-Drills.' },
  'Ohr/Kiefergelenk': { label: 'Kiefer', emoji: '🦷',
    diagnosis: 'Kiefergelenks-Probleme sind oft mit Nacken- und Brustwirbelsäule verbunden.',
    solution: 'AXON identifiziert die Kausalkette und gibt dir ein myofasziales Protokoll.' },
  'Hals vorne': { label: 'Hals', emoji: '🧠',
    diagnosis: 'Vordere Hals-Spannungen entstehen oft durch Hohlkreuz oder Vorwärtskopfhaltung.',
    solution: 'AXON prüft die tiefe Halsbeuger-Kette und gibt ein Stabilisierungsprotokoll.' },

  // Schulter
  'Schulter vorne/Acromion': { label: 'Schulter', emoji: '💪',
    diagnosis: 'Schulterprobleme entstehen meist durch blockierte Skapula-Dynamik — der Arm ist nur das Symptom.',
    solution: 'AXON findet den spezifischen Druckpunkt (z.B. Pec Minor) und liefert ein Hardware+Software-Protokoll.' },
  'Schulter hinten/Acromion': { label: 'Schulter hinten', emoji: '💪',
    diagnosis: 'Hintere Schulter-Einschränkungen blockieren oft die gesamte Rotatorenmanschette.',
    solution: 'AXON prüft Infraspinatus und Teres minor und gibt dir ein gezieltes Release-Protokoll.' },

  // Rücken
  'oberer Rücken/Nacken': { label: 'Oberer Rücken', emoji: '🔧',
    diagnosis: 'Spannungen im oberen Rücken sind fast immer Folge von BWS-Flexionsmustern (Sitzen).',
    solution: 'AXON mobilisiert die thorakale Wirbelsäule mit MFR + Extensionsdrills.' },
  'oberer Rücken': { label: 'Rücken oben', emoji: '🔧',
    diagnosis: 'Der obere Rücken kompensiert oft für fehlende Brustwirbelsäulen-Rotation.',
    solution: 'AXON gibt dir ein Rotationsmobilisierungsprotokoll für die BWS.' },
  'mittlerer Rücken': { label: 'Rücken Mitte', emoji: '🔧',
    diagnosis: 'Mittlerer Rücken-Schmerz ist oft ein Übergangszonenproblem zwischen BWS und LWS.',
    solution: 'AXON identifiziert die Übergangszone und gibt ein faszielles Entlastungsprotokoll.' },
  'unterer Rücken/Lendenwirbelsäule': { label: 'Lendenwirbelsäule', emoji: '🔧',
    diagnosis: 'LWS-Schmerz entsteht zu 80% durch eingeschränkte Hüftmobilität — die LWS übernimmt Arbeit der Hüfte.',
    solution: 'AXON findet die Root Cause: Psoas-Release, Gluteus-Aktivierung, Neuro-Verankerung.' },
  'Schulterblatt': { label: 'Schulterblatt', emoji: '💪',
    diagnosis: 'Schulterblatt-Probleme deuten oft auf einen schwachen Serratus anterior hin.',
    solution: 'AXON prüft die Skapula-Stabilität und gibt dir ein gezieltes Kraftprotokoll.' },

  // Brust / Bauch
  'obere Brust/Schlüsselbein': { label: 'Brust oben', emoji: '🫁',
    diagnosis: 'Engegefühl in der oberen Brust begrenzt Schulter- und Atemfunktion.',
    solution: 'AXON gibt dir ein Pectoralis Minor-Release kombiniert mit Atemdrills.' },
  'mittlere Brust': { label: 'Brust Mitte', emoji: '🫁',
    diagnosis: 'Mittlere Brust-Spannungen entstehen oft durch chronische Flexionshaltung.',
    solution: 'AXON mobilisiert die Brustfaszie mit einem gezielten Extensionsprotokoll.' },
  'Bauch oben': { label: 'Oberbauch', emoji: '⚙️',
    diagnosis: 'Oberbauch-Spannungen können die Zwerchfellatmung und Faszie beeinträchtigen.',
    solution: 'AXON gibt dir ein Zwerchfell-Mobilisierungsprotokoll.' },
  'Bauch Mitte/Bauchnabel': { label: 'Bauchmitte', emoji: '⚙️',
    diagnosis: 'Bauch-Spannung kann von faszialen Strukturen oder Hüftbeuger-Overload kommen.',
    solution: 'AXON prüft die ventrale Faszienkette und gibt ein gezieltes Protokoll.' },
  'Unterbauch/Becken': { label: 'Unterbauch', emoji: '⚙️',
    diagnosis: 'Unterbauch-Schmerz ist oft ein Hinweis auf Hüftbeuger- oder Beckenbodenprobleme.',
    solution: 'AXON analysiert die Beckenboden-Hüftkette und gibt ein Mobilisierungsprotokoll.' },

  // Becken / Hüfte
  'Becken/Hüfte': { label: 'Hüfte', emoji: '⚙️',
    diagnosis: 'Die Hüfte ist das Fundament. Einschränkungen hier verursachen Kaskaden: LWS-Schmerz oben, Knieschmerz unten.',
    solution: 'AXON prüft alle 6 Rotationsebenen und erstellt einen gezielten Mobilisierungsplan.' },
  'Gesäß': { label: 'Gesäß', emoji: '⚙️',
    diagnosis: 'Gesäß-Schmerz ist oft eine Piriformis-Kompression oder Gluteus-Schwäche.',
    solution: 'AXON gibt dir ein Piriformis-Release + Gluteus-Aktivierungsprotokoll.' },

  // Arm
  'Oberarm': { label: 'Oberarm', emoji: '💪',
    diagnosis: 'Oberarm-Schmerzen entstehen oft durch Schulter- oder Ellenbogen-Kompensation.',
    solution: 'AXON prüft die gesamte obere Extremitätenkette.' },
  'Ellenbogen-Beuge': { label: 'Ellenbogen', emoji: '💪',
    diagnosis: 'Ellenbogenprobleme sind fast immer auf die Schulter- oder Handgelenks-Kette zurückzuführen.',
    solution: 'AXON identifiziert die Ursache in der kinetischen Kette.' },
  'Ellenbogen': { label: 'Ellenbogen', emoji: '💪',
    diagnosis: 'Ellenbogenprobleme entstehen oft durch Über- oder Unterbelastung in der Armkette.',
    solution: 'AXON gibt dir ein gezieltes Release-Protokoll für die Unterarm-Ellenbogen-Kette.' },
  'Unterarm/Handgelenk': { label: 'Unterarm / Handgelenk', emoji: '💪',
    diagnosis: 'Unterarm-Spannungen entstehen meist durch repetitive Belastung oder Schulter-Kompensation.',
    solution: 'AXON gibt dir ein Unterarm-Faszienrelease mit Neuro-Integration.' },

  // Bein
  'Oberschenkel vorne': { label: 'Oberschenkel', emoji: '🦵',
    diagnosis: 'Vorderer Oberschenkel-Schmerz ist oft ein Zeichen für überaktive Hüftbeuger.',
    solution: 'AXON gibt dir ein Rectus-Femoris-Release mit Hüftextensions-Aktivierung.' },
  'Oberschenkel hinten': { label: 'Oberschenkel hinten', emoji: '🦵',
    diagnosis: 'Hinterer Oberschenkel-Schmerz deutet auf Hamstring-Überlastung oder Ischias hin.',
    solution: 'AXON differenziert zwischen muskulären und neuralen Ursachen.' },
  'Knie vorne': { label: 'Knie', emoji: '🦵',
    diagnosis: 'Knieschmerzen sind fast immer Folge von Dysbalancen in Hüfte oder Sprunggelenk.',
    solution: 'AXON analysiert die gesamte untere Kette und setzt an der Ursache an.' },
  'Kniekehle': { label: 'Kniekehle', emoji: '🦵',
    diagnosis: 'Kniekehlen-Schmerz ist oft ein Hamstring-Ansatzproblem oder Baker-Zyste.',
    solution: 'AXON gibt dir ein gezieltes posteriores Knieprotokoll.' },
  'Unterschenkel/Schienbein': { label: 'Unterschenkel', emoji: '🦶',
    diagnosis: 'Schienbeinkantensyndrom entsteht durch eingeschränkte Sprunggelenks-Dorsiflexion.',
    solution: 'AXON gibt dir ein Tibialis-anterior-Release mit Dorsiflexions-Training.' },
  'Wade': { label: 'Wade', emoji: '🦶',
    diagnosis: 'Waden-Spannungen begrenzen die Dorsiflexion und blockieren die gesamte Kette.',
    solution: 'AXON gibt dir ein Soleus/Gastrocnemius-Release mit Neuro-Integration.' },
  'Fuß/Knöchel vorne': { label: 'Fuß / Knöchel', emoji: '🦶',
    diagnosis: 'Eingeschränkte Dorsalflexion blockiert die gesamte Bewegungskette bis zur LWS.',
    solution: 'AXON testet die Dorsalflexion und gibt dir einen Soleus/Achilles-Release.' },
  'Ferse/Achillessehne': { label: 'Achilles / Ferse', emoji: '🦶',
    diagnosis: 'Fersenprobleme entstehen oft durch chronische Wadenspannung oder Fußfehlstellung.',
    solution: 'AXON gibt dir ein Achillessehnen-Entlastungsprotokoll mit funktioneller Integration.' },
};

const FALLBACK = {
  label: 'Region',
  emoji: '📍',
  diagnosis: 'AXON analysiert deine Beschwerden und findet die tatsächliche Ursache in der kinetischen Kette.',
  solution: 'Du erhältst ein personalisiertes Protokoll aus MFR, Neuro-Drill und Bewegungsintegration.',
};

export default function SystemAuditSection({ onCtaClick }) {
  const [selectedRegion, setSelectedRegion] = useState(null);

  const handleBodyMapSubmit = (mapData) => {
    setSelectedRegion(mapData.region);
  };

  const regionData = selectedRegion
    ? (REGION_MAP[selectedRegion] || { ...FALLBACK, label: selectedRegion })
    : null;

  return (
    <section id="audit" className="py-20 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 mb-4">System-Audit</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Dein Schmerzpunkt verrät dir<br />
            <span className="text-slate-400">nicht die Ursache.</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            Markiere die Stelle, die dir gerade zu schaffen macht — AXON zeigt dir, was wirklich dahinter steckt.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-10 items-start">

          {/* Interactive Body Map */}
          <div className="w-full md:w-auto md:flex-shrink-0 md:max-w-xs">
            <InteractiveBodyMapInput onSubmit={handleBodyMapSubmit} />
          </div>

          {/* Info Panel */}
          <div className="flex-1 min-h-[260px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {!regionData ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center py-12 space-y-4"
                >
                  <div className="text-5xl">👆</div>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Markiere deine Schmerzstelle<br />um deine Diagnose zu sehen
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedRegion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{regionData.emoji}</span>
                    <h3 className="text-xl font-bold text-white">{regionData.label}</h3>
                  </div>

                  <div className="bg-slate-900/60 border border-red-500/20 rounded-2xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Was dein System sagt</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{regionData.diagnosis}</p>
                  </div>

                  <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">Die AXON Lösung</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{regionData.solution}</p>
                  </div>

                  <button
                    onClick={onCtaClick}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-cyan-50 text-black font-black text-sm px-6 py-4 rounded-2xl transition-all hover:scale-105 uppercase tracking-wide"
                  >
                    Vollständiges Protokoll für {regionData.label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}