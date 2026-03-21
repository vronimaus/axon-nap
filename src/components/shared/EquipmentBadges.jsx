import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package } from 'lucide-react';

// Equipment type → Emoji Icon
const TYPE_ICONS = {
  kettlebell: '🏋️',
  resistance_band: '🪢',
  neuro_tool: '🧠',
  flossing_band: '🩹',
  slider: '🔵',
  mobility_tool: '🔄',
  other: '📦',
};

export default function EquipmentBadges({ plan }) {
  // Collect all unique required_equipment IDs from all phases/exercises
  const equipmentIds = React.useMemo(() => {
    if (!plan?.phases) return [];
    const ids = new Set();
    for (const phase of plan.phases) {
      for (const exercise of (phase.exercises || [])) {
        for (const eqId of (exercise.required_equipment || [])) {
          if (eqId) ids.add(eqId);
        }
      }
    }
    return [...ids];
  }, [plan]);

  const { data: allEquipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list(),
    staleTime: 1000 * 60 * 10,
    enabled: equipmentIds.length > 0,
  });

  // Match fetched equipment to the IDs found in the plan
  const matchedEquipment = React.useMemo(() => {
    if (!equipmentIds.length) return [];
    return allEquipment.filter(eq => equipmentIds.includes(eq.equipment_id));
  }, [allEquipment, equipmentIds]);

  // If no equipment is referenced, show "Kein Equipment nötig"
  if (equipmentIds.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/50">
        <Package className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-500 font-medium">Kein Equipment erforderlich</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Benötigtes Equipment</p>
      <div className="flex flex-wrap gap-2">
        {matchedEquipment.length > 0 ? (
          matchedEquipment.map(eq => (
            <div
              key={eq.equipment_id}
              title={eq.description || eq.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:border-slate-500 transition-colors"
            >
              <span className="text-base leading-none">
                {TYPE_ICONS[eq.type] || '📦'}
              </span>
              <span className="text-xs font-semibold text-slate-300 leading-none">{eq.name}</span>
            </div>
          ))
        ) : (
          // IDs found but not yet in DB → show generic badges
          equipmentIds.map(id => (
            <div
              key={id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60"
            >
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 leading-none">{id}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}