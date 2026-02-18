import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ── Prefix-Logik ─────────────────────────────────────────────────────────────

const CATEGORY_TO_PREFIX = {
  // Breathwork
  breath: 'BR', breathwork: 'BR', neuro_fix: 'BR',
  // Neuro
  neuro_drill: 'NR', neuro: 'NR',
  // Mobility / CARs
  mobilisation: 'MB', mobility: 'MB', mobility_integration: 'MB', cars: 'MB',
  // MFR
  mfr: 'MFR', faszien: 'MFR',
  // Strength / push / pull / hinge / squat / carry / core etc → BW default
  push: 'BW', pull: 'BW', squat: 'BW', hinge: 'BW', carry: 'BW',
  core: 'BW', plank: 'BW', row: 'BW', dip: 'BW', other: 'BW',
  // Kettlebell
  kettlebell: 'KB', ballistic: 'KB', grind: 'KB',
};

const KNOWN_PREFIXES = ['KB', 'BW', 'RB', 'SL', 'MB', 'NR', 'BR', 'MFR'];

function alreadyNewFormat(id) {
  if (!id) return false;
  return KNOWN_PREFIXES.some(p => id.startsWith(p + '_'));
}

function guessPrefix(exercise) {
  const cat = (exercise.category || '').toLowerCase();
  const name = (exercise.name || '').toLowerCase();
  const id = (exercise.exercise_id || '').toLowerCase();

  // Name/ID hints
  if (id.includes('kb_') || id.startsWith('kb')) return 'KB';
  if (name.includes('kettlebell') || name.includes(' kb ') || id.includes('swing') || id.includes('snatch') || id.includes('clean') || id.includes('press') && id.includes('kb')) return 'KB';
  if (name.includes('band') || id.includes('band') || cat.includes('band')) return 'RB';
  if (name.includes('slider') || id.includes('slider') || id.includes('slide')) return 'SL';
  if (name.includes('box breathing') || name.includes('atemübung') || name.includes('breathing') || cat.includes('breath')) return 'BR';
  if (cat.includes('neuro') || name.includes('sakkade') || name.includes('vestibul') || name.includes('drill')) return 'NR';
  if (cat.includes('mfr') || name.includes('node') || name.includes('faszien') || name.includes('massage')) return 'MFR';
  if (cat.includes('mobil') || name.includes('cars') || name.includes('car ') || name.includes('mob')) return 'MB';

  return CATEGORY_TO_PREFIX[cat] || 'BW';
}

// Group abbreviation from name/category
function guessGroup(exercise) {
  const cat = (exercise.category || '').toLowerCase();
  const name = (exercise.name || '').toLowerCase();

  if (name.includes('ankle') || name.includes('sprunggelenk') || name.includes('fuss') || name.includes('fuß')) return 'FUS';
  if (name.includes('hip') || name.includes('hüft')) return 'HIP';
  if (name.includes('shoulder') || name.includes('schulter')) return 'SHO';
  if (name.includes('spine') || name.includes('wirbel') || name.includes('bws') || name.includes('lws')) return 'SPI';
  if (name.includes('neck') || name.includes('nacken')) return 'NAC';
  if (name.includes('knee') || name.includes('knie')) return 'KNI';
  if (name.includes('squat') || name.includes('kniebeuge')) return 'SQU';
  if (name.includes('hinge') || name.includes('deadlift') || name.includes('rdl')) return 'HIN';
  if (name.includes('push') || name.includes('press') || name.includes('liegestütz')) return 'PSH';
  if (name.includes('pull') || name.includes('row') || name.includes('klimmzug') || name.includes('rudern')) return 'PUL';
  if (name.includes('core') || name.includes('plank') || name.includes('rumpf')) return 'COR';
  if (name.includes('breath') || name.includes('atem')) return 'ATM';
  if (name.includes('eye') || name.includes('auge') || name.includes('sakkad') || name.includes('visual')) return 'AUG';
  if (name.includes('balance') || name.includes('gleichgewicht') || name.includes('vestibul')) return 'BAL';
  if (name.includes('swing')) return 'SWI';
  if (name.includes('snatch')) return 'SNA';
  if (name.includes('clean')) return 'CLE';
  if (name.includes('getup') || name.includes('get up') || name.includes('turkish')) return 'TGU';
  if (cat.includes('mobil')) return 'MOB';
  if (cat.includes('neuro')) return 'NEU';
  if (cat.includes('mfr') || name.includes('node')) return 'NOD';

  return 'GEN';
}

function suggestNewId(exercise, allExercises) {
  if (alreadyNewFormat(exercise.exercise_id)) return exercise.exercise_id;

  const prefix = guessPrefix(exercise);
  const group = guessGroup(exercise);

  // Find existing new-format IDs with same prefix+group to auto-increment
  const pattern = `${prefix}_${group}_`;
  const existing = allExercises
    .map(e => e.exercise_id || '')
    .filter(id => id.startsWith(pattern))
    .map(id => parseInt(id.replace(pattern, ''), 10))
    .filter(n => !isNaN(n));

  const maxNum = existing.length > 0 ? Math.max(...existing) : 0;
  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}_${group}_${nextNum}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseMappingTab() {
  const queryClient = useQueryClient();
  const [editedIds, setEditedIds] = useState({}); // { dbId: newExerciseId }
  const [applying, setApplying] = useState({}); // { dbId: true }
  const [showDuplicates, setShowDuplicates] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // all | legacy | duplicates

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list('-updated_date', 500),
  });

  // Build suggested mappings
  const mapped = useMemo(() => {
    return exercises.map(ex => ({
      ...ex,
      suggestedId: suggestNewId(ex, exercises),
      isLegacy: !alreadyNewFormat(ex.exercise_id),
    }));
  }, [exercises]);

  // Find duplicates by exercise_id — only groups where names are similar (real duplicates)
  const idCounts = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      const id = ex.exercise_id || '';
      if (!acc[id]) acc[id] = [];
      acc[id].push(ex);
      return acc;
    }, {});
  }, [exercises]);

  // Normalize name for comparison
  const normalizeName = (name = '') => name.toLowerCase().replace(/[^a-z0-9]/g, '');

  const duplicateGroups = useMemo(() => {
    return Object.entries(idCounts).filter(([, arr]) => {
      if (arr.length < 2) return false;
      // Only treat as duplicates if at least 2 entries share a very similar name
      const names = arr.map(e => normalizeName(e.name));
      return names.some((n, i) =>
        names.some((m, j) => i !== j && (n === m || (n.length > 5 && m.includes(n.slice(0, 8)))))
      );
    });
  }, [idCounts]);

  // Filter + sort by old exercise_id
        const filtered = useMemo(() => {
          let result = mapped;
          if (filterMode === 'legacy') result = mapped.filter(e => e.isLegacy);
          if (filterMode === 'duplicates') result = mapped.filter(e => idCounts[e.exercise_id]?.length > 1);
          return [...result].sort((a, b) => (a.exercise_id || '').localeCompare(b.exercise_id || ''));
        }, [mapped, filterMode, idCounts]);

  // Apply single ID change
  const applyId = async (ex) => {
    const newId = editedIds[ex.id] ?? ex.suggestedId;
    if (!newId || newId === ex.exercise_id) return;
    setApplying(prev => ({ ...prev, [ex.id]: true }));
    try {
      await base44.entities.Exercise.update(ex.id, { exercise_id: newId });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success(`✓ ${ex.exercise_id} → ${newId}`);
    } catch (e) {
      toast.error('Fehler: ' + e.message);
    } finally {
      setApplying(prev => { const n = { ...prev }; delete n[ex.id]; return n; });
    }
  };

  // Merge duplicates: keep best entry (most filled fields), delete others
  const mergeDuplicates = async (group) => {
    const [, entries] = group;
    // Score: count non-null/non-empty fields
    const score = (ex) => Object.values(ex).filter(v => v !== null && v !== undefined && v !== '').length;
    const sorted = [...entries].sort((a, b) => score(b) - score(a));
    const keeper = sorted[0];
    const toDelete = sorted.slice(1);

    // Merge fields from others into keeper (fill empty fields)
    const merged = { ...keeper };
    for (const other of toDelete) {
      for (const [k, v] of Object.entries(other)) {
        if (!merged[k] && v) merged[k] = v;
      }
    }

    try {
      await base44.entities.Exercise.update(keeper.id, merged);
      for (const del of toDelete) {
        await base44.entities.Exercise.delete(del.id);
      }
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success(`Merged: ${toDelete.length} Duplikat(e) gelöscht, Daten zusammengeführt`);
    } catch (e) {
      toast.error('Merge-Fehler: ' + e.message);
    }
  };

  // Apply ALL legacy suggestions at once (with rate-limit delay)
  const applyAll = async () => {
    const legacy = mapped.filter(e => e.isLegacy);
    let success = 0;
    for (const ex of legacy) {
      const newId = editedIds[ex.id] ?? ex.suggestedId;
      if (newId && newId !== ex.exercise_id) {
        await base44.entities.Exercise.update(ex.id, { exercise_id: newId });
        success++;
        await new Promise(r => setTimeout(r, 300)); // avoid rate limit
      }
    }
    queryClient.invalidateQueries({ queryKey: ['exercises'] });
    toast.success(`${success} IDs übernommen`);
  };

  if (isLoading) return <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-slate-400">Laden...</div>;

  const legacyCount = mapped.filter(e => e.isLegacy).length;

  return (
    <div className="space-y-6">



      {/* ── ID Mapping Table ─────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-cyan-400">ID Mapping</h3>
            <p className="text-sm text-slate-400 mt-1">{legacyCount} Legacy-IDs → neue Schema-IDs</p>
          </div>
          {legacyCount > 0 && (
            <Button
              onClick={applyAll}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Alle {legacyCount} übernehmen
            </Button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'all', label: `Alle (${mapped.length})` },
            { key: 'legacy', label: `Legacy (${legacyCount})` },
            { key: 'duplicates', label: `Duplikate (${duplicateGroups.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterMode(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filterMode === key
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs">Name</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs">Alte ID</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs">Neue ID</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ex => {
                const suggestedId = editedIds[ex.id] ?? ex.suggestedId;
                const isDuplicate = idCounts[ex.exercise_id]?.length > 1;
                const isUnchanged = suggestedId === ex.exercise_id;
                const isApplying = applying[ex.id];

                return (
                  <tr key={ex.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${isDuplicate ? 'bg-red-500/5' : ''}`}>
                    <td className="py-2 px-3">
                      <span className="text-slate-200 text-xs">{ex.name}</span>
                      {isDuplicate && <span className="ml-1 text-red-400 text-xs">⚠</span>}
                    </td>
                    <td className="py-2 px-3">
                      <code className="text-xs font-mono text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                        {ex.exercise_id || '—'}
                      </code>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={suggestedId}
                        onChange={e => setEditedIds(prev => ({ ...prev, [ex.id]: e.target.value }))}
                        className={`font-mono text-xs px-2 py-1 rounded bg-slate-800 border text-white w-48 focus:outline-none focus:border-cyan-500 transition-colors ${
                          isUnchanged ? 'border-slate-700 text-slate-500' : 'border-cyan-500/50 text-cyan-300'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => applyId(ex)}
                        disabled={isUnchanged || isApplying}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                          isUnchanged
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                        }`}
                      >
                        {isApplying ? '...' : <><Check className="w-3 h-3" /> OK</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}