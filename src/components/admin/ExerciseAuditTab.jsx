import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Loader2, Wand2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
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

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ExerciseAuditTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [bulkFixing, setBulkFixing] = useState({});
  const [bulkProgress, setBulkProgress] = useState({});

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-audit', refreshKey],
    queryFn: () => base44.entities.Exercise.list('-updated_date', 500),
  });

  const issues = useMemo(() => findIssues(exercises), [exercises]);

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
              {exercises.length} Exercises · <span className={totalIssues > 0 ? 'text-yellow-400' : 'text-green-400'}>{totalIssues} Probleme gefunden</span>
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
      </div>

      {totalIssues === 0 ? (
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
            exercises={exercises}
            canBulkFix={false}
          />
          <IssueGroupCard
            title="Ähnliche Namen (mögliche Duplikate)"
            severity="medium"
            issues={issues.similar_name}
            exercises={exercises}
            canBulkFix={false}
          />
          <IssueGroupCard
            title="Kategorie-Mismatch (ID-Prefix ≠ category)"
            severity="medium"
            issues={issues.category_mismatch}
            exercises={exercises}
            canBulkFix={issues.category_mismatch.length > 0}
            onBulkFix={bulkFixCategoryMismatch}
            bulkFixing={bulkFixing.category_mismatch}
            bulkProgress={bulkProgress.category_mismatch}
          />
          <IssueGroupCard
            title="Fehlende affected_nodes"
            severity="low"
            issues={issues.missing_nodes}
            exercises={exercises}
            canBulkFix={issues.missing_nodes.length > 0}
            onBulkFix={bulkFixMissingNodes}
            bulkFixing={bulkFixing.missing_nodes}
            bulkProgress={bulkProgress.missing_nodes}
          />
          <IssueGroupCard
            title="Leere Smart Tags"
            severity="low"
            issues={issues.missing_smart_tags}
            exercises={exercises}
            canBulkFix={issues.missing_smart_tags.length > 0}
            onBulkFix={bulkFixSmartTags}
            bulkFixing={bulkFixing.missing_smart_tags}
            bulkProgress={bulkProgress.missing_smart_tags}
          />
        </div>
      )}

      {/* Note for manual fixes */}
      {(issues.duplicate_id.length > 0 || issues.similar_name.length > 0) && (
        <div className="glass rounded-xl border border-slate-600 p-4 text-xs text-slate-400">
          💡 <strong className="text-slate-300">Duplikate & ähnliche Namen</strong> müssen manuell im <strong className="text-cyan-400">Exercise Editor</strong> Tab bereinigt werden – klappe die Gruppe auf um die betroffenen IDs zu sehen.
        </div>
      )}
    </motion.div>
  );
}