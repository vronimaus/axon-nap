import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Hash, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ── Konstanten ────────────────────────────────────────────────────────────────

const PREFIXES = ['BW', 'KB', 'RB', 'SL', 'MB', 'NR', 'BR', 'MFR'];

const PREFIX_LABELS = {
  BW: 'Bodyweight',
  KB: 'Kettlebell',
  RB: 'Resistance Band',
  SL: 'Sliders',
  MB: 'Mobility / CARs',
  NR: 'Neuro Drill',
  BR: 'Breathwork',
  MFR: 'Faszien / MFR',
};

const GROUPS = [
  { code: 'GEN', label: 'Allgemein' },
  { code: 'SQU', label: 'Squat' },
  { code: 'HIN', label: 'Hinge' },
  { code: 'PSH', label: 'Push' },
  { code: 'PUL', label: 'Pull' },
  { code: 'COR', label: 'Core' },
  { code: 'HIP', label: 'Hüfte' },
  { code: 'SHO', label: 'Schulter' },
  { code: 'SPI', label: 'Wirbelsäule' },
  { code: 'NAC', label: 'Nacken' },
  { code: 'KNI', label: 'Knie' },
  { code: 'FUS', label: 'Fuß/Sprunggelenk' },
  { code: 'BAL', label: 'Balance' },
  { code: 'ATM', label: 'Atmung' },
  { code: 'AUG', label: 'Augen/Sakkaden' },
  { code: 'NOD', label: 'MFR Node' },
  { code: 'SWI', label: 'Swing' },
  { code: 'SNA', label: 'Snatch' },
  { code: 'CLE', label: 'Clean' },
  { code: 'TGU', label: 'Turkish Get-Up' },
  { code: 'MOB', label: 'Mobility (allg.)' },
  { code: 'NEU', label: 'Neuro (allg.)' },
];

const KNOWN_PREFIXES = ['KB', 'BW', 'RB', 'SL', 'MB', 'NR', 'BR', 'MFR'];

function alreadyNewFormat(id) {
  if (!id) return false;
  return KNOWN_PREFIXES.some(p => id.startsWith(p + '_'));
}

function parseExistingId(id = '') {
  for (const p of KNOWN_PREFIXES) {
    if (id.startsWith(p + '_')) {
      const rest = id.slice(p.length + 1);
      const parts = rest.split('_');
      if (parts.length >= 1) {
        return { prefix: p, group: parts[0] };
      }
    }
  }
  return { prefix: '', group: '' };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseMappingTab() {
  const queryClient = useQueryClient();

  const [assignments, setAssignments] = useState({});
  const [saving, setSaving] = useState({});
  const [filterMode, setFilterMode] = useState('all');
  const [editingName, setEditingName] = useState({}); // { [id]: newName }
  const [deletingId, setDeletingId] = useState(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list('-updated_date', 500),
  });

  // Sort by exercise_id (groups exercises together by prefix_group)
  const sorted = useMemo(() => {
    return [...exercises].sort((a, b) => (a.exercise_id || '').localeCompare(b.exercise_id || ''));
  }, [exercises]);

  const filtered = useMemo(() => {
    if (filterMode === 'legacy') return sorted.filter(e => !alreadyNewFormat(e.exercise_id));
    if (filterMode === 'assigned') return sorted.filter(e => assignments[e.id]);
    return sorted;
  }, [sorted, filterMode, assignments]);

  const legacyCount = sorted.filter(e => !alreadyNewFormat(e.exercise_id)).length;
  const assignedCount = Object.keys(assignments).length;

  const getAssignment = (ex) => {
    if (assignments[ex.id]) return assignments[ex.id];
    if (alreadyNewFormat(ex.exercise_id)) return parseExistingId(ex.exercise_id);
    return { prefix: '', group: '' };
  };

  const setField = (dbId, field, value) => {
    setAssignments(prev => ({
      ...prev,
      [dbId]: { ...(prev[dbId] || {}), [field]: value },
    }));
  };

  // ── Assign numbers ───────────────────────────────────────────────────────────
  const assignNumbers = async () => {
    const toProcess = sorted.map(ex => {
      const { prefix, group } = getAssignment(ex);
      return { ex, prefix, group };
    }).filter(({ prefix, group }) => prefix && group);

    const grouped = {};
    for (const item of toProcess) {
      const key = `${item.prefix}_${item.group}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    const updates = [];
    for (const [, items] of Object.entries(grouped)) {
      items.sort((a, b) => (a.ex.name || '').localeCompare(b.ex.name || ''));
      items.forEach((item, idx) => {
        const newId = `${item.prefix}_${item.group}_${String(idx + 1).padStart(3, '0')}`;
        if (newId !== item.ex.exercise_id) {
          updates.push({ id: item.ex.id, newId });
        }
      });
    }

    if (updates.length === 0) {
      toast.info('Keine Änderungen notwendig');
      return;
    }

    setSaving({ _all: true });
    let success = 0;
    const BATCH_SIZE = 5;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(({ id, newId }) =>
        base44.entities.Exercise.update(id, { exercise_id: newId })
      ));
      success += batch.length;
      if (i + BATCH_SIZE < updates.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    queryClient.invalidateQueries({ queryKey: ['exercises'] });
    setAssignments({});
    setSaving({});
    toast.success(`${success} IDs mit Nummern vergeben`);
  };

  // ── Save prefix+group ────────────────────────────────────────────────────────
  const saveAssignment = async (ex) => {
    const { prefix, group } = getAssignment(ex);
    if (!prefix || !group) return;
    const newId = `${prefix}_${group}`;
    setSaving(prev => ({ ...prev, [ex.id]: true }));
    try {
      await base44.entities.Exercise.update(ex.id, { exercise_id: newId });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setAssignments(prev => { const n = { ...prev }; delete n[ex.id]; return n; });
      toast.success(`✓ ${ex.name} → ${newId}`);
    } catch (e) {
      toast.error('Fehler: ' + e.message);
    } finally {
      setSaving(prev => { const n = { ...prev }; delete n[ex.id]; return n; });
    }
  };

  // ── Rename exercise ──────────────────────────────────────────────────────────
  const saveName = async (ex) => {
    const newName = editingName[ex.id];
    if (!newName || newName === ex.name) {
      setEditingName(prev => { const n = { ...prev }; delete n[ex.id]; return n; });
      return;
    }
    setSaving(prev => ({ ...prev, [`name_${ex.id}`]: true }));
    try {
      await base44.entities.Exercise.update(ex.id, { name: newName });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setEditingName(prev => { const n = { ...prev }; delete n[ex.id]; return n; });
      toast.success(`✓ Umbenannt zu "${newName}"`);
    } catch (e) {
      toast.error('Fehler: ' + e.message);
    } finally {
      setSaving(prev => { const n = { ...prev }; delete n[`name_${ex.id}`]; return n; });
    }
  };

  // ── Delete exercise ──────────────────────────────────────────────────────────
  const deleteExercise = async (ex) => {
    setDeletingId(ex.id);
    try {
      await base44.entities.Exercise.delete(ex.id);
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success(`✓ "${ex.name}" gelöscht`);
    } catch (e) {
      toast.error('Fehler: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-slate-400">Laden...</div>;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-cyan-400">Exercise ID Mapping</h3>
            <p className="text-sm text-slate-400 mt-1">
              Prefix + Gruppe zuweisen, dann Nummern automatisch vergeben lassen.
            </p>
          </div>
          <Button
            onClick={assignNumbers}
            disabled={!!saving._all}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-sm flex items-center gap-2"
          >
            <Hash className="w-4 h-4" />
            {saving._all ? 'Vergebe Nummern...' : 'Nummern vergeben'}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mb-5 bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-xs text-slate-400">
          <span className="text-cyan-400 font-semibold">Workflow:</span>{' '}
          1. Prefix + Gruppe wählen → Speichern → 2. „Nummern vergeben" → IDs werden automatisch durchnummeriert (z.B. <code className="text-cyan-300">BW_SQU_001</code>). Sortierung nach ID.
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'all', label: `Alle (${sorted.length})` },
            { key: 'legacy', label: `Legacy (${legacyCount})` },
            { key: 'assigned', label: `Geändert (${assignedCount})` },
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
                <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs w-48">ID</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs">Name</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs w-32">Prefix</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs w-40">Gruppe</th>
                <th className="py-2 px-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ex => {
                const { prefix, group } = getAssignment(ex);
                const isNew = alreadyNewFormat(ex.exercise_id);
                const isDirty = !!assignments[ex.id];
                const canSave = prefix && group && isDirty;
                const isSaving = saving[ex.id];
                const isEditingName = editingName[ex.id] !== undefined;
                const isDeleting = deletingId === ex.id;

                return (
                  <tr key={ex.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${isDirty ? 'bg-cyan-500/5' : ''}`}>
                    {/* ID */}
                    <td className="py-2 px-3">
                      <code className={`text-xs font-mono px-2 py-0.5 rounded ${isNew ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                        {ex.exercise_id || '—'}
                      </code>
                    </td>

                    {/* Name – inline edit */}
                    <td className="py-2 px-3">
                      {isEditingName ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={editingName[ex.id]}
                            onChange={e => setEditingName(prev => ({ ...prev, [ex.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') saveName(ex); if (e.key === 'Escape') setEditingName(prev => { const n = { ...prev }; delete n[ex.id]; return n; }); }}
                            className="text-xs px-2 py-1 rounded bg-slate-700 border border-cyan-500/50 text-white focus:outline-none w-40"
                          />
                          <button onClick={() => saveName(ex)} className="text-cyan-400 hover:text-cyan-300">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingName(prev => { const n = { ...prev }; delete n[ex.id]; return n; })} className="text-slate-500 hover:text-slate-300">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <span className="text-slate-200 text-xs">{ex.name}</span>
                          <button
                            onClick={() => setEditingName(prev => ({ ...prev, [ex.id]: ex.name }))}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyan-400 transition-all"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Prefix */}
                    <td className="py-2 px-3">
                      <select
                        value={prefix}
                        onChange={e => setField(ex.id, 'prefix', e.target.value)}
                        className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 w-24"
                      >
                        <option value="">— Prefix</option>
                        {PREFIXES.map(p => (
                          <option key={p} value={p}>{p} – {PREFIX_LABELS[p]}</option>
                        ))}
                      </select>
                    </td>

                    {/* Gruppe */}
                    <td className="py-2 px-3">
                      <select
                        value={group}
                        onChange={e => setField(ex.id, 'group', e.target.value)}
                        className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 w-36"
                      >
                        <option value="">— Gruppe</option>
                        {GROUPS.map(g => (
                          <option key={g.code} value={g.code}>{g.code} – {g.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveAssignment(ex)}
                          disabled={!canSave || isSaving}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                            canSave
                              ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                              : 'text-slate-700 cursor-not-allowed'
                          }`}
                        >
                          {isSaving ? '...' : <><Check className="w-3 h-3" /> OK</>}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`"${ex.name}" wirklich löschen?`)) deleteExercise(ex); }}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Löschen"
                        >
                          {isDeleting ? '...' : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
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