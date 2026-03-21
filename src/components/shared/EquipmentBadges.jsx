import React, { useMemo } from 'react';

// Equipment-Keyword → Emoji + Label
const EQUIPMENT_PATTERNS = [
  { keywords: ['kettlebell', 'kb', 'goblet'], icon: '🏋️', label: 'Kettlebell' },
  { keywords: ['barbell', 'langhantel', 'stange'], icon: '🏋️', label: 'Langhantel' },
  { keywords: ['dumbbell', 'kurzhantel', 'hantel'], icon: '🏋️', label: 'Kurzhantel' },
  { keywords: ['resistance band', 'band', 'widerstandsband', 'theraband'], icon: '🪢', label: 'Widerstandsband' },
  { keywords: ['pull-up bar', 'klimmzugstange', 'stange', 'pullup bar', 'pull up bar'], icon: '🔩', label: 'Klimmzugstange' },
  { keywords: ['foam roller', 'faszienrolle', 'rolle'], icon: '🔵', label: 'Faszienrolle' },
  { keywords: ['mat', 'matte', 'yogamatte'], icon: '🟩', label: 'Trainingsmatte' },
  { keywords: ['box', 'plyo box', 'plyobox', 'kasten'], icon: '📦', label: 'Plyo Box' },
  { keywords: ['ring', 'gymnastics ring', 'turnring'], icon: '⭕', label: 'Turnringe' },
  { keywords: ['cable', 'kabelzug', 'kabel'], icon: '🔗', label: 'Kabelzug' },
  { keywords: ['bench', 'bank', 'hantelbank'], icon: '🛋️', label: 'Hantelbank' },
  { keywords: ['trx', 'suspension', 'sling trainer'], icon: '🪢', label: 'TRX / Slingtrainer' },
  { keywords: ['jump rope', 'springseil', 'seilspringen'], icon: '🪢', label: 'Springseil' },
  { keywords: ['wall', 'wand'], icon: '🧱', label: 'Wand' },
];

function extractEquipmentFromPlan(plan) {
  if (!plan?.phases) return [];

  // Collect all text from the plan
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

  if (!equipment.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Benötigtes Equipment</p>
      <div className="flex flex-wrap gap-2">
        {equipment.map(eq => (
          <div
            key={eq.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60"
          >
            <span className="text-base leading-none">{eq.icon}</span>
            <span className="text-xs font-semibold text-slate-300 leading-none">{eq.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}