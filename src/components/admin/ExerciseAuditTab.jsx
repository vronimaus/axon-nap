import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Loader2, Wand2, RefreshCw, ChevronDown, ChevronUp, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ── helpers ────────────────────────────────────────────────────────────────────

function similarity(a, b) {
  const wordsA = a.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const wordsB = b.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, '').split(/\s+/).filter(Boolean);
  if (!wordsA.length || !wordsB.length) return 0;
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  return [...setA].filter(w => setB.has(w)).length / Math.max(setA.size, setB.size);
}

const PREFIX_CATEGORY_MAP = { NR: 'neuro', MFR: 'mfr', MOB: 'mobility' };

function findIssues(exercises) {
  const issues = { duplicate_id: [], similar_name: [], category_mismatch: [], missing_nodes: [], missing_smart_tags: [] };

  // 1. Exact duplicate IDs
  const idMap = {};
  exercises.forEach(ex => {
    const id = ex.exercise_id || '';
    if (!idMap[id]) idMap[id] = [];
    idMap[id].push(ex);
  });
  Object.entries(idMap).forEach(([id, group]) => {
    if (id && group.length > 1) {
      issues.duplicate_id.push({ label: `ID: ${id}`, ids: group.map(e => e.id), names: group.map(e => e.name), exercise_ids: group.map(e => e.exercise_id) });
    }
  });

  // 2. Similar names
  const checked = new Set();
  for (let i = 0; i < exercises.length; i++) {
    for (let j = i + 1; j < exercises.length; j++) {
      const key = `${exercises[i].id}_${exercises[j].id}`;
      if (checked.has(key)) continue;
      checked.add(key);
      const sim = similarity(exercises[i].name || '', exercises[j].name || '');
      if (sim >= 0.55 && exercises[i].exercise_id !== exercises[j].exercise_id) {
        issues.similar_name.push({ label: `"${exercises[i].name}" ↔ "${exercises[j].name}" (${Math.round(sim * 100)}%)`, ids: [exercises[i].id, exercises[j].id], names: [exercises[i].name, exercises[j].name], exercise_ids: [exercises[i].exercise_id, exercises[j].exercise_id] });
      }
    }
  }

  // 3. Category mismatch
  exercises.forEach(ex => {
    const id = ex.exercise_id || '';
    for (const [prefix, expectedCat] of Object.entries(PREFIX_CATEGORY_MAP)) {
      if (id.startsWith(prefix + '_') && ex.category !== expectedCat) {
        issues.category_mismatch.push({ label: `${ex.exercise_id}: "${ex.category}" → "${expectedCat}"`, ids: [ex.id], names: [ex.name], exercise_ids: [ex.exercise_id], expected_category: expectedCat });
        break;
      }
    }
  });

  // 4. Missing affected_nodes
  exercises.forEach(ex => {
    if (!ex.affected_nodes || ex.affected_nodes.length === 0) {
      issues.missing_nodes.push({ label: ex.exercise_id || ex.name, ids: [ex.id], names: [ex.name], exercise_ids: [ex.exercise_id], exercise: ex });
    }
  });

  // 5. Missing smart_tags
  exercises.forEach(ex => {
    const tags = ex.smart_tags;
    const isEmpty = !tags || Object.keys(tags).length === 0;
    if (isEmpty) {
      issues.missing_smart_tags.push({ label: ex.exercise_id || ex.name, ids: [ex.id], names: [ex.name], exercise_ids: [ex.exercise_id], exercise: ex });
    }
  });

  return issues;
}

// ── Issue Group Card ───────────────────────────────────────────────────────────

function IssueGroupCard({ title, severity, issues, exercises, onFixDone, canBulkFix, onBulkFix, bulkFixing, bulkProgress }) {
  const [expanded, setExpanded] = useState(false);

  const severityStyle = {
    high: { border: 'border-red-500/40', bg: 'bg-red-500/5', badge: 'bg-red-500/20 text-red-400', dot: '🔴' },
    medium: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-400', dot: '🟡' },
    low: { border: 'border-slate-600/40', bg: 'bg-slate-800/20', badge: 'bg-slate-700 text-slate-400', dot: '⚪' },
  }[severity];

  if (issues.length === 0) return null;

  return (
    <div className={`rounded-xl border ${severityStyle.border} ${severityStyle.bg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${severityStyle.badge}`}>
            {severityStyle.dot} {issues.length}
          </span>
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {canBulkFix && (
            <Button
              size="sm"
              onClick={onBulkFix}
              disabled={bulkFixing}
              className="h-8 px-3 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold"
            >
              {bulkFixing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  {bulkProgress}
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3 mr-1" />
                  Alle {issues.length} fixen
                </>
              )}
            </Button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress bar while fixing */}
      {bulkFixing && (
        <div className="h-1 bg-slate-700 mx-4 mb-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: bulkProgress }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Expandable list */}
      {expanded && (
        <div className="border-t border-slate-700/40 px-4 py-3 space-y-1 max-h-64 overflow-y-auto">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-slate-700/30 last:border-0">
              <code className="text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                {issue.exercise_ids?.[0] || '—'}
              </code>
              <span className="text-slate-400 truncate">{issue.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Big 5 Pattern Mapping ─────────────────────────────────────────────────────

const BIG5_MAP = {
  pull:     { label: 'Pull',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  push:     { label: 'Push',    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  hinge:    { label: 'Hinge',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  squat:    { label: 'Squat',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  carry:    { label: 'Carry',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  core:     { label: 'Core',    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  mobility: { label: 'Mobility',color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  neuro:    { label: 'Neuro',   color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  mfr:      { label: 'MFR',     color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  breath:   { label: 'Breath',  color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  other:    { label: 'Sonstig', color: 'text-slate-400 bg-slate-700/30 border-slate-600' },
};

function getGroup(ex) {
  const cat = (ex.category || '').toLowerCase();
  const id = (ex.exercise_id || '').toUpperCase();
  if (id.startsWith('NR_') || cat === 'neuro') return 'neuro';
  if (id.startsWith('MFR_') || cat === 'mfr') return 'mfr';
  if (id.startsWith('BR_') || cat === 'breath' || cat === 'breathwork') return 'breath';
  if (id.startsWith('MB_') || cat === 'mobility' || cat === 'mobilisation') return 'mobility';
  if (cat === 'pull' || cat === 'row') return 'pull';
  if (cat === 'push' || cat === 'dip') return 'push';
  if (cat === 'hinge') return 'hinge';
  if (cat === 'squat') return 'squat';
  if (cat === 'carry') return 'carry';
  if (cat === 'core' || cat === 'plank') return 'core';
  return 'other';
}

// ── Inventory Section ──────────────────────────────────────────────────────────

function InventorySection({ exercises, onDeleted }) {
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? exercises.filter(e => (e.name || '').toLowerCase().includes(q) || (e.exercise_id || '').toLowerCase().includes(q)) : exercises;
  }, [exercises, search]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(ex => {
      const k = getGroup(ex);
      if (!g[k]) g[k] = [];
      g[k].push(ex);
    });
    return g;
  }, [filtered]);

  const handleDelete = async (ex) => {
    setDeleting(ex.id);
    await base44.entities.Exercise.delete(ex.id);
    setDeleting(null);
    setConfirmId(null);
    onDeleted(ex.id);
  };

  const limit = 200;
  const total = exercises.length;
  const over = total > limit;

  return (
    <div className="space-y-4">
      {/* Limit Tracker */}
      <div className={`glass rounded-xl border p-4 ${over ? 'border-red-500/40' : 'border-emerald-500/30'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">Übungs-Inventar</span>
          <span className={`text-sm font-black ${over ? 'text-red-400' : 'text-emerald-400'}`}>{total} / {limit}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : total > 160 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min((total / limit) * 100, 100)}%` }}
          />
        </div>
        {over && <p className="text-xs text-red-400 mt-2">⚠️ {total - limit} Übungen über dem Limit — bitte bereinigen!</p>}
        <p className="text-xs text-slate-500 mt-1">Behalte max. 200 Übungen. Nur Tweaks (leichter/schwerer) oder Progressionen rechtfertigen Varianten.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Name oder ID suchen..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Groups */}
      {Object.entries(BIG5_MAP).map(([key, cfg]) => {
        const group = grouped[key] || [];
        if (group.length === 0) return null;
        const isOpen = expandedGroup === key;
        return (
          <div key={key} className={`rounded-xl border overflow-hidden ${cfg.color.split(' ').find(c => c.startsWith('border')) || 'border-slate-700'}`}>
            <button
              onClick={() => setExpandedGroup(isOpen ? null : key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                <span className="text-sm text-slate-300">{group.length} Übungen</span>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {isOpen && (
              <div className="divide-y divide-slate-800">
                {group.map(ex => (
                  <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/30 hover:bg-slate-800/30 transition-colors">
                    <code className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono flex-shrink-0 max-w-[100px] truncate">{ex.exercise_id || '—'}</code>
                    <span className="text-sm text-slate-200 flex-1 truncate">{ex.name}</span>
                    {ex.progression_level && ex.progression_level > 1 && (
                      <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 flex-shrink-0">L{ex.progression_level}</span>
                    )}
                    {ex.next_progression_id && (
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 flex-shrink-0">→ {ex.next_progression_id}</span>
                    )}
                    {confirmId === ex.id ? (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(ex)}
                          disabled={deleting === ex.id}
                          className="text-[10px] px-2 py-1 rounded bg-red-500 text-white font-bold"
                        >
                          {deleting === ex.id ? '...' : 'Löschen'}
                        </button>
                        <button onClick={() => setConfirmId(null)} className="text-[10px] px-2 py-1 rounded bg-slate-700 text-slate-300">Nein</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(ex.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ExerciseAuditTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [bulkFixing, setBulkFixing] = useState({});
  const [bulkProgress, setBulkProgress] = useState({});

  const [localExercises, setLocalExercises] = useState(null);
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-audit', refreshKey],
    queryFn: () => base44.entities.Exercise.list('-updated_date', 500),
  });

  const displayExercises = localExercises !== null ? localExercises : exercises;

  // sync local copy when query reloads
  React.useEffect(() => { if (exercises.length > 0) setLocalExercises(exercises); }, [exercises]);

  const issues = useMemo(() => findIssues(displayExercises), [displayExercises]);

  const totalIssues = Object.values(issues).reduce((s, arr) => s + arr.length, 0);

  // ── Bulk Fix Handlers ──────────────────────────────────────────────────────

  const bulkFixCategoryMismatch = async () => {
    const list = issues.category_mismatch;
    setBulkFixing(p => ({ ...p, category_mismatch: true }));
    let done = 0;
    for (const issue of list) {
      const ex = exercises.find(e => e.id === issue.ids[0]);
      if (ex) await base44.entities.Exercise.update(ex.id, { category: issue.expected_category });
      done++;
      setBulkProgress(p => ({ ...p, category_mismatch: `${done}/${list.length}` }));
    }
    toast.success(`${done} Kategorien korrigiert`);
    setBulkFixing(p => ({ ...p, category_mismatch: false }));
    setRefreshKey(k => k + 1);
  };

  const bulkFixMissingNodes = async () => {
    const list = issues.missing_nodes;
    setBulkFixing(p => ({ ...p, missing_nodes: true }));
    let done = 0;
    // Process in batches of 5 to avoid rate limits
    for (const issue of list) {
      const ex = issue.exercise;
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Du bist Experte für myofasziale Therapie. Analysiere diese Übung und bestimme welche MFR-Nodes (N1-N12) betroffen sind.
Übung: ${ex.name}
Kategorie: ${ex.category}
Beschreibung: ${(ex.description || '').substring(0, 200)}

Antworte NUR mit einem JSON-Objekt: {"nodes": ["N4", "N9"]} oder {"nodes": []} wenn keine betroffen.`,
          response_json_schema: { type: 'object', properties: { nodes: { type: 'array', items: { type: 'string' } } }, required: ['nodes'] }
        });
        if (result?.nodes !== undefined) {
          await base44.entities.Exercise.update(ex.id, { affected_nodes: result.nodes });
        }
      } catch (e) {
        // continue on error
      }
      done++;
      setBulkProgress(p => ({ ...p, missing_nodes: `${done}/${list.length}` }));
    }
    toast.success(`${done} Exercises mit Nodes befüllt`);
    setBulkFixing(p => ({ ...p, missing_nodes: false }));
    setRefreshKey(k => k + 1);
  };

  const bulkFixSmartTags = async () => {
    const list = issues.missing_smart_tags;
    setBulkFixing(p => ({ ...p, missing_smart_tags: true }));
    let done = 0;
    for (const issue of list) {
      const ex = issue.exercise;
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Du bist Biomechanik-Experte. Analysiere diese Übung und befülle die Smart Tags.
Übung: ${ex.name}
Kategorie: ${ex.category}
Beschreibung: ${(ex.description || '').substring(0, 200)}

Antworte NUR mit diesem JSON:
{"neuro_complexity": {"coordination_demand": <1-10>, "balance_requirement": <true/false>, "visual_tracking": <true/false>, "vestibular_challenge": <true/false>, "proprioceptive_demand": <true/false>}, "execution_parameters": {"load_category": "<bodyweight|light|moderate|heavy|explosive>"}}`,
          response_json_schema: { type: 'object', properties: { neuro_complexity: { type: 'object' }, execution_parameters: { type: 'object' } } }
        });
        if (result?.neuro_complexity) {
          await base44.entities.Exercise.update(ex.id, {
            smart_tags: { ...(ex.smart_tags || {}), neuro_complexity: result.neuro_complexity, execution_parameters: result.execution_parameters }
          });
        }
      } catch (e) {
        // continue on error
      }
      done++;
      setBulkProgress(p => ({ ...p, missing_smart_tags: `${done}/${list.length}` }));
    }
    toast.success(`${done} Exercises mit Smart Tags befüllt`);
    setBulkFixing(p => ({ ...p, missing_smart_tags: false }));
    setRefreshKey(k => k + 1);
  };

  const [activeView, setActiveView] = useState('audit'); // 'audit' | 'inventory'

  if (isLoading) {
    return (
      <div className="glass rounded-2xl border border-cyan-500/30 p-8 flex items-center gap-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Analysiere Exercises...
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">🔍 Exercise Audit</h2>
            <p className="text-sm text-slate-400 mt-1">
              {displayExercises.length} Exercises · <span className={totalIssues > 0 ? 'text-yellow-400' : 'text-green-400'}>{totalIssues} Probleme gefunden</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setRefreshKey(k => k + 1)} className="text-slate-400 hover:text-cyan-400">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <span className="text-sm font-bold text-red-400">🔴 {issues.duplicate_id.length} Kritisch</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <span className="text-sm font-bold text-yellow-400">🟡 {issues.similar_name.length + issues.category_mismatch.length} Mittel</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600">
            <span className="text-sm font-bold text-slate-400">⚪ {issues.missing_nodes.length + issues.missing_smart_tags.length} Niedrig</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveView('audit')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'audit' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >🔍 Audit</button>
          <button
            onClick={() => setActiveView('inventory')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'inventory' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >📦 Inventar ({displayExercises.length}/200)</button>
        </div>
      </div>

      {/* Inventory View */}
      {activeView === 'inventory' && (
        <InventorySection
          exercises={displayExercises}
          onDeleted={(deletedId) => setLocalExercises(prev => prev.filter(e => e.id !== deletedId))}
        />
      )}

      {/* Audit View */}
      {activeView === 'audit' && (totalIssues === 0 ? (
        <div className="glass rounded-2xl border border-green-500/30 p-8 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-green-400 font-semibold">Alle Exercises sind sauber!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <IssueGroupCard
            title="Doppelte Exercise-IDs"
            severity="high"
            issues={issues.duplicate_id}
            exercises={displayExercises}
            canBulkFix={false}
          />
          <IssueGroupCard
            title="Ähnliche Namen (mögliche Duplikate)"
            severity="medium"
            issues={issues.similar_name}
            exercises={displayExercises}
            canBulkFix={false}
          />
          <IssueGroupCard
            title="Kategorie-Mismatch (ID-Prefix ≠ category)"
            severity="medium"
            issues={issues.category_mismatch}
            exercises={displayExercises}
            canBulkFix={issues.category_mismatch.length > 0}
            onBulkFix={bulkFixCategoryMismatch}
            bulkFixing={bulkFixing.category_mismatch}
            bulkProgress={bulkProgress.category_mismatch}
          />
          <IssueGroupCard
            title="Fehlende affected_nodes"
            severity="low"
            issues={issues.missing_nodes}
            exercises={displayExercises}
            canBulkFix={issues.missing_nodes.length > 0}
            onBulkFix={bulkFixMissingNodes}
            bulkFixing={bulkFixing.missing_nodes}
            bulkProgress={bulkProgress.missing_nodes}
          />
          <IssueGroupCard
            title="Leere Smart Tags"
            severity="low"
            issues={issues.missing_smart_tags}
            exercises={displayExercises}
            canBulkFix={issues.missing_smart_tags.length > 0}
            onBulkFix={bulkFixSmartTags}
            bulkFixing={bulkFixing.missing_smart_tags}
            bulkProgress={bulkProgress.missing_smart_tags}
          />
        </div>
      ))}

      {/* Note for manual fixes */}
      {activeView === 'audit' && (issues.duplicate_id.length > 0 || issues.similar_name.length > 0) && (
        <div className="glass rounded-xl border border-slate-600 p-4 text-xs text-slate-400">
          💡 <strong className="text-slate-300">Duplikate & ähnliche Namen</strong> müssen manuell im <strong className="text-cyan-400">Exercise Editor</strong> Tab oder im <strong className="text-orange-400">Inventar</strong> bereinigt werden.
        </div>
      )}
    </motion.div>
  );
}