import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

// Equipment-Keyword → Emoji + Label + optional info description
const EQUIPMENT_PATTERNS = [
  {
    keywords: ['kettlebell', 'kb', 'goblet'],
    icon: '🏋️', label: 'Kettlebell',
    info: 'Eine Kugelhantel mit Griff. Ideal für ballistische Bewegungen (Swing, Clean, Press). Kauftipp: 16-24 kg für Männer, 8-16 kg für Frauen.'
  },
  {
    keywords: ['barbell', 'langhantel'],
    icon: '🏋️', label: 'Langhantel',
    info: 'Klassische Olympia-Stange (20 kg). Grundlage für Squat, Deadlift, Bench Press. Benötigt Gewichtsscheiben und idealerweise ein Rack.'
  },
  {
    keywords: ['dumbbell', 'kurzhantel', 'hantel'],
    icon: '🏋️', label: 'Kurzhantel',
    info: 'Kurze Hantel für unilaterales Training. Ermöglicht natürlichere Bewegungen als die Langhantel. Als verstellbares Set besonders platzsparend.'
  },
  {
    keywords: ['resistance band', 'band', 'widerstandsband', 'theraband'],
    icon: '🪢', label: 'Widerstandsband',
    info: 'Elastisches Band in verschiedenen Stärken (leicht bis schwer). Vielseitig einsetzbar für Mobility, Aktivierung und assistiertes Training. Günstig und platzsparend.'
  },
  {
    keywords: ['pull-up bar', 'klimmzugstange', 'pullup bar', 'pull up bar'],
    icon: '🔩', label: 'Klimmzugstange',
    info: 'Stange für Klimmzüge, Hängeübungen und Core-Training. Variante: Türrahmen-Stange (ohne Bohren) oder Wandmontage für mehr Stabilität.'
  },
  {
    keywords: ['foam roller', 'faszienrolle', 'rolle'],
    icon: '🔵', label: 'Faszienrolle',
    info: 'Hartschaumrolle für myofasziale Selbstmassage (MFR). Löst Verklebungen im Bindegewebe. Alternativ: Lacrosse-Ball für punktuelle Punkte.'
  },
  {
    keywords: ['mat', 'matte', 'yogamatte'],
    icon: '🟩', label: 'Trainingsmatte',
    info: 'Unterlagsmatte für Boden- und Mobility-Übungen. Mindestdicke 6 mm, für Knieübungen 10 mm empfohlen.'
  },
  {
    keywords: ['box', 'plyo box', 'plyobox', 'kasten'],
    icon: '📦', label: 'Plyo Box',
    info: 'Stabile Box für Box-Jumps, Step-Ups und Depth-Jumps. Höhen: 30/45/60 cm. Holz oder Schaumstoff (sicherer für Anfänger).'
  },
  {
    keywords: ['ring', 'gymnastics ring', 'turnring'],
    icon: '⭕', label: 'Turnringe',
    info: 'Holz- oder Kunststoffringe zum Aufhängen. Ideal für Dips, Rows, Muscle-Ups und Körperspannungsübungen. Höhenverstellbar und transportabel.'
  },
  {
    keywords: ['cable', 'kabelzug', 'kabel'],
    icon: '🔗', label: 'Kabelzug',
    info: 'Seilzugmaschine im Fitnessstudio. Erlaubt konstante Spannung über den gesamten Bewegungsweg. Heimersatz: Widerstandsband an einem festen Punkt.'
  },
  {
    keywords: ['bench', 'bank', 'hantelbank'],
    icon: '🛋️', label: 'Hantelbank',
    info: 'Verstellbare Flachbank für Drück- und Stützübungen. Flat = 0°, Incline = 30-45°, Decline = -15°. Sollte mindestens 200 kg tragen können.'
  },
  {
    keywords: ['trx', 'suspension', 'sling trainer'],
    icon: '🪢', label: 'TRX / Slingtrainer',
    info: 'Suspensionstrainer aus Gurten. Das eigene Körpergewicht wird durch Winkelveränderung als Widerstand genutzt. Einfach an Tür oder Deckenbalken befestigen.'
  },
  {
    keywords: ['jump rope', 'springseil', 'seilspringen'],
    icon: '🪢', label: 'Springseil',
    info: 'Klassisches Seil für Ausdauer und Koordination. Speed-Rope (dünnes Seil) für schnelle Rotationen, gewichtetes Seil für mehr Armarbeit.'
  },
  {
    keywords: ['wall', 'wand'],
    icon: '🧱', label: 'Wand',
    info: 'Für wandgestützte Übungen (Wall Slides, Wall Sit, Handstand-Vorbereitung). Jede glatte, stabile Wand eignet sich.'
  },
  {
    keywords: ['brock schnur', 'brock-schnur', 'brock string', 'brockschnur'],
    icon: '🧵', label: 'Brock-Schnur',
    info: 'Die Brock-Schnur ist ein einfaches Neuro-Trainings-Tool: Eine ca. 1,5–2 m lange Schnur mit 3–5 farbigen Perlen in unterschiedlichen Abständen. Du hältst ein Ende an der Nasenspitze, das andere ist an der Wand befestigt. Beim Fokussieren der Perlen wird die Konvergenz (Einwärtsbewegung der Augen) trainiert — ein wichtiger Faktor für Gleichgewicht, Koordination und Kopfschmerzprävention. Kauftipp: ca. 5–10 € online erhältlich oder selbst basteln mit Wolle + Perlen.'
  },
];

function extractEquipmentFromPlan(plan) {
  if (!plan?.phases) return [];

  const texts = [];
  for (const phase of plan.phases) {
    for (const ex of (phase.exercises || [])) {
      texts.push(
        ex.name || '',
        ex.instruction || '',
        ex.notes || '',
        ex.sets_reps_tempo || '',
        ex.description || '',
        (ex.required_equipment || []).join(' ')
      );
    }
  }
  const combined = texts.join(' ').toLowerCase();

  const found = [];
  const addedLabels = new Set();

  for (const eq of EQUIPMENT_PATTERNS) {
    if (addedLabels.has(eq.label)) continue;
    const matches = eq.keywords.some(kw => combined.includes(kw.toLowerCase()));
    if (matches) {
      found.push(eq);
      addedLabels.add(eq.label);
    }
  }

  return found;
}

export default function EquipmentBadges({ plan }) {
  const equipment = useMemo(() => extractEquipmentFromPlan(plan), [plan]);
  const [activeInfo, setActiveInfo] = useState(null);

  if (!equipment.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Benötigtes Equipment</p>
      <div className="flex flex-wrap gap-2">
        {equipment.map(eq => (
          <button
            key={eq.label}
            onClick={() => eq.info ? setActiveInfo(eq) : null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 transition-all ${eq.info ? 'hover:border-cyan-500/50 hover:bg-slate-800 cursor-pointer' : 'cursor-default'}`}
          >
            <span className="text-base leading-none">{eq.icon}</span>
            <span className="text-xs font-semibold text-slate-300 leading-none">{eq.label}</span>
            {eq.info && <span className="text-[10px] text-cyan-500 leading-none ml-0.5">ℹ</span>}
          </button>
        ))}
      </div>

      {/* Info Modal */}
      {activeInfo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveInfo(null)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeInfo.icon}</span>
                <h3 className="text-base font-bold text-white">{activeInfo.label}</h3>
              </div>
              <button
                onClick={() => setActiveInfo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{activeInfo.info}</p>
          </div>
        </div>
      )}
    </div>
  );
}