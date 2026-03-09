import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp, Wand2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ── helpers ────────────────────────────────────────────────────────────────────

function similarity(a, b) {
  // simple word-overlap ratio
  const wordsA = a.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const wordsB = b.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, '').split(/\s+/).filter(Boolean);
  if (!wordsA.length || !wordsB.length) return 0;
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = [...setA].filter(w => setB.has(w)).length;
  return intersection / Math.max(setA.size, setB.size);
}

function findIssues(exercises) {
  const issues = [];
  const SIMILARITY_THRESHOLD = 0.55;

  // 1. Exact duplicate exercise_id
  const idMap = {};
  exercises.forEach(ex => {
    const id = ex.exercise_id || '';
    if (!idMap[id]) idMap[id] = [];
    idMap[id].push(ex);
  });
  Object.entries(idMap).forEach(([id, group]) => {
    if (id && group.length > 1) {
      issues.push({
        type: 'duplicate_id',
        severity: 'high',
        label: `Doppelte ID: ${id}`,
        ids: group.map(e => e.id),
        names: group.map(e => e.name),
        exercise_ids: group.map(e => e.exercise_id),
      });
    }
  });

  // 2. Similar names (potential content duplicates)
  const checked = new Set();
  for (let i = 0; i < exercises.length; i++) {
    for (let j = i + 1; j < exercises.length; j++) {
      const key = `${exercises[i].id}_${exercises[j].id}`;
      if (checked.has(key)) continue;
      checked.add(key);
      const nameA = exercises[i].name || '';
      const nameB = exercises[j].name || '';
      const sim = similarity(nameA, nameB);
      if (sim >= SIMILARITY_THRESHOLD && exercises[i].exercise_id !== exercises[j].exercise_id) {
        issues.push({
          type: 'similar_name',
          severity: 'medium',
          label: `Ähnliche Namen (${Math.round(sim * 100)}%): "${nameA}" ↔ "${nameB}"`,
          ids: [exercises[i].id, exercises[j].id],
          names: [nameA, nameB],
          exercise_ids: [exercises[i].exercise_id, exercises[j].exercise_id],
          similarity: sim,
        });
      }
    }
  }

  // 3. Missing affected_nodes
  exercises.forEach(ex => {
    if (!ex.affected_nodes || ex.affected_nodes.length === 0) {
      issues.push({
        type: 'missing_nodes',
        severity: 'low',
        label: `Keine affected_nodes: ${ex.exercise_id || ex.name}`,
        ids: [ex.id],
        names: [ex.name],
        exercise_ids: [ex.exercise_id],
      });
    }
  });

  // 4. Missing smart_tags
  exercises.forEach(ex => {
    const tags = ex.smart_tags;
    const isEmpty = !tags || Object.values(tags).every(v => v === null || v === undefined || (Array.isArray(v) && v.length === 0));
    if (isEmpty) {
      issues.push({
        type: 'missing_smart_tags',
        severity: 'low',
        label: `Leere smart_tags: ${ex.exercise_id || ex.name}`,
        ids: [ex.id],
        names: [ex.name],
        exercise_ids: [ex.exercise_id],
      });
    }
  });

  // 5. Category mismatch (ID prefix vs category field)
  const prefixCategoryMap = {
    NR: 'neuro',
    MFR: 'mfr',
    MOB: 'mobility',
    BW: null, // various
    KB: null,
    RB: null,
  };
  exercises.forEach(ex => {
    const id = ex.exercise_id || '';
    for (const [prefix, expectedCat] of Object.entries(prefixCategoryMap)) {
      if (expectedCat && id.startsWith(prefix + '_') && ex.category !== expectedCat) {
        issues.push({
          type: 'category_mismatch',
          severity: 'medium',
          label: `Kategorie-Mismatch: ${ex.exercise_id} hat category="${ex.category}" (erwartet: "${expectedCat}")`,
          ids: [ex.id],
          names: [ex.name],
          exercise_ids: [ex.exercise_id],
          expected_category: expectedCat,
          actual_category: ex.category,
        });
        break;
      }
    }
  });

  return issues;
}

// ── Issue Row ──────────────────────────────────────────────────────────────────

function IssueRow({ issue, exercises, onFixDone }) {
  const [expanded, setExpanded] = useState(false);
  const [fixing, setFixing] = useState(false);
  const queryClient = useQueryClient();

  const severityColor = {
    high: 'border-red-500/50 bg-red-500/5',
    medium: 'border-yellow-500/50 bg-yellow-500/5',
    low: 'border-slate-600/50 bg-slate-800/30',
  };
  const severityBadge = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-slate-700 text-slate-400',
  };

  const handleAutoFix = async () => {
    setFixing(true);
    try {
      if (issue.type === 'category_mismatch') {
        // Direct fix: update category to match prefix
        const ex = exercises.find(e => e.id === issue.ids[0]);
        if (ex) {
          await base44.entities.Exercise.update(ex.id, { category: issue.expected_category });
          toast.success(`Kategorie korrigiert: ${ex.exercise_id}`);
          queryClient.invalidateQueries({ queryKey: ['exercises-audit'] });
          onFixDone?.();
        }
      } else if (issue.type === 'missing_nodes' || issue.type === 'missing_smart_tags') {
        // AI-assisted fix
        const ex = exercises.find(e => e.id === issue.ids[0]);
        if (!ex) return;
        const prompt = issue.type === 'missing_nodes'
          ? `Du bist ein Experte für myofasziale Therapie und Bewegungswissenschaft. 
             Analysiere diese Übung und gib die betroffenen MFR-Nodes zurück (N1-N12).
             Übung: ${ex.name}
             Kategorie: ${ex.category}
             Beschreibung: ${ex.description?.substring(0, 300)}
             
             Gib NUR ein JSON-Array zurück mit den Node-IDs die diese Übung betrifft.
             Beispiel: ["N4", "N9"]
             Wenn keine Nodes betroffen sind: []`
          : `Du bist ein Experte für Biomechanik. Analysiere diese Übung und befülle die neuro_complexity smart_tags.
             Übung: ${ex.name}, Kategorie: ${ex.category}
             Beschreibung: ${ex.description?.substring(0, 300)}
             
             Gib NUR dieses JSON zurück (alle Felder ausfüllen):
             {"neuro_complexity": {"coordination_demand": <1-10>, "balance_requirement": <true/false>, "visual_tracking": <true/false>, "vestibular_challenge": <true/false>, "proprioceptive_demand": <true/false>}}`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: issue.type === 'missing_nodes'
            ? { type: 'object', properties: { nodes: { type: 'array', items: { type: 'string' } } } }
            : { type: 'object', properties: { neuro_complexity: { type: 'object' } } }
        });

        if (issue.type === 'missing_nodes' && result.nodes) {
          await base44.entities.Exercise.update(ex.id, { affected_nodes: result.nodes });
          toast.success(`Nodes hinzugefügt: ${result.nodes.join(', ') || 'keine'}`);
        } else if (issue.type === 'missing_smart_tags' && result.neuro_complexity) {
          const currentTags = ex.smart_tags || {};
          await base44.entities.Exercise.update(ex.id, {
            smart_tags: { ...currentTags, neuro_complexity: result.neuro_complexity }
          });
          toast.success(`Smart Tags aktualisiert für ${ex.name}`);
        }
        queryClient.invalidateQueries({ queryKey: ['exercises-audit'] });
        onFixDone?.();
      }
    } catch (e) {
      toast.error('Fix fehlgeschlagen: ' + e.message);
    } finally {
      setFixing(false);
    }
  };

  const canAutoFix = ['category_mismatch', 'missing_nodes', 'missing_smart_tags'].includes(issue.type);

  return (
    <div className={`rounded-lg border ${severityColor[issue.severity]} overflow-hidden`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${severityBadge[issue.severity]}`}>
            {issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '⚪'} {issue.severity.toUpperCase()}
          </span>
          <span className="text-sm text-slate-300 truncate">{issue.label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {canAutoFix && (
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleAutoFix(); }}
              disabled={fixing}
              className="h-7 px-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs"
            >
              {fixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              <span className="ml-1 hidden sm:inline">Fix</span>
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-slate-700/50 px-3 pb-3 pt-2"
          >
            <div className="space-y-1">
              {issue.names.map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <code className="text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    {issue.exercise_ids[i] || '—'}
                  </code>
                  <span className="text-slate-400">{name}</span>
                </div>
              ))}
            </div>
            {issue.type === 'similar_name' && (
              <p className="text-xs text-yellow-500/70 mt-2">
                💡 Prüfe ob diese Übungen zusammengeführt oder als Progression verknüpft werden sollten.
              </p>
            )}
            {issue.type === 'duplicate_id' && (
              <p className="text-xs text-red-500/70 mt-2">
                ⚠ Gleiche ID → Die KI wählt zufällig eine davon. Lösche oder umnenne die Duplikate im Exercise Editor.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ExerciseAuditTab() {
  const [filterType, setFilterType] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-audit', refreshKey],
    queryFn: () => base44.entities.Exercise.list('-updated_date', 500),
  });

  const issues = useMemo(() => findIssues(exercises), [exercises]);

  const TYPES = [
    { key: 'all', label: 'Alle' },
    { key: 'duplicate_id', label: '🔴 Duplikate (ID)' },
    { key: 'similar_name', label: '🟡 Ähnliche Namen' },
    { key: 'category_mismatch', label: '🟡 Kategorie-Fehler' },
    { key: 'missing_nodes', label: '⚪ Fehlende Nodes' },
    { key: 'missing_smart_tags', label: '⚪ Leere Smart Tags' },
  ];

  const filtered = filterType === 'all' ? issues : issues.filter(i => i.type === filterType);

  const highCount = issues.filter(i => i.severity === 'high').length;
  const mediumCount = issues.filter(i => i.severity === 'medium').length;
  const lowCount = issues.filter(i => i.severity === 'low').length;

  if (isLoading) {
    return (
      <div className="glass rounded-2xl border border-cyan-500/30 p-8 flex items-center gap-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Analysiere Exercises...
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">🔍 Exercise Audit</h2>
            <p className="text-sm text-slate-400 mt-1">
              {exercises.length} Exercises analysiert
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshKey(k => k + 1)}
            className="text-slate-400 hover:text-cyan-400"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Neu analysieren
          </Button>
        </div>

        {/* Summary Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-red-400">{highCount} Kritisch</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{mediumCount} Mittel</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600">
            <CheckCircle className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-400">{lowCount} Niedrig</span>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => {
            const count = t.key === 'all' ? issues.length : issues.filter(i => i.type === t.key).length;
            return (
              <button
                key={t.key}
                onClick={() => setFilterType(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filterType === t.key
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl border border-green-500/30 p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-green-400 font-semibold">Keine Probleme in dieser Kategorie!</p>
          </div>
        ) : (
          filtered.map((issue, idx) => (
            <IssueRow
              key={idx}
              issue={issue}
              exercises={exercises}
              onFixDone={() => setRefreshKey(k => k + 1)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}