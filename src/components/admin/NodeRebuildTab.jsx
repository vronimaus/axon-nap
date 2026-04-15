import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { RefreshCw, PlayCircle, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIES = ['push', 'pull', 'hinge', 'squat', 'carry', 'core', 'neuro', 'breath', 'other'];

export default function NodeRebuildTab() {
  const [dryRun, setDryRun] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [showChanges, setShowChanges] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const { data } = await base44.functions.invoke('rebuildExerciseNodes', {
        dry_run: dryRun,
        ...(categoryFilter ? { category: categoryFilter } : {}),
      });
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl border border-amber-500/30 p-6">
        <h2 className="text-xl font-bold text-amber-400 mb-1">🔁 Node-Mapping Rebuild</h2>
        <p className="text-sm text-slate-400 mb-5">
          Wendet den AXON-Biomechanik-Algorithmus (Dan-John-Muster + Stecco-Nodes) auf alle Exercises an
          und überschreibt <code className="text-amber-300">affected_nodes</code>.
          MFR-Übungen werden übersprungen.
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Dry Run Toggle */}
          <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
            <button
              onClick={() => setDryRun(!dryRun)}
              className={`w-10 h-5 rounded-full transition-all flex-shrink-0 ${dryRun ? 'bg-amber-500' : 'bg-red-500'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${dryRun ? '' : 'translate-x-5'}`} />
            </button>
            <div>
              <p className={`text-sm font-semibold ${dryRun ? 'text-amber-400' : 'text-red-400'}`}>
                {dryRun ? 'Dry Run (kein Schreiben)' : '⚠️ Live Mode – schreibt in DB!'}
              </p>
              <p className="text-xs text-slate-500">
                {dryRun ? 'Zeigt nur was sich ändern würde' : 'Ändert affected_nodes aller Exercises'}
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2">Kategorie (optional)</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  !categoryFilter ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-700 text-zinc-400'
                }`}
              >
                Alle
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    categoryFilter === c ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
            dryRun
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'
          }`}
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
          {isRunning
            ? 'Läuft…'
            : dryRun
            ? 'Dry Run starten'
            : '🔥 Nodes in DB schreiben'}
        </button>
      </div>

      {/* Results */}
      {result && !result.error && (
        <div className="glass rounded-2xl border border-green-500/30 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-green-400">
              {result.dry_run ? 'Dry Run Ergebnis' : '✅ Rebuild abgeschlossen'}
            </h3>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gesamt', value: result.total, color: 'text-slate-300' },
              { label: 'Würden geändert', value: result.updated, color: 'text-amber-400' },
              { label: 'Unverändert', value: result.unchanged, color: 'text-zinc-500' },
              { label: 'MFR übersprungen', value: result.skipped_mfr, color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Change list */}
          {result.changes?.length > 0 && (
            <div>
              <button
                onClick={() => setShowChanges(!showChanges)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors mb-2"
              >
                {showChanges ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Änderungen anzeigen ({result.changes.length})
              </button>

              {showChanges && (
                <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                  {result.changes.map((ch, i) => (
                    <div key={i} className="bg-slate-800/60 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-zinc-400">{ch.exercise_id}</span>
                        <span className="text-zinc-200 font-medium truncate">{ch.name}</span>
                        <span className="text-zinc-600 ml-auto flex-shrink-0">{ch.category}</span>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-red-400/70">Alt: </span>
                          <span className="font-mono text-red-400">{(ch.old_nodes || []).join(', ') || '—'}</span>
                        </div>
                        <div>
                          <span className="text-green-400/70">Neu: </span>
                          <span className="font-mono text-green-400">{(ch.new_nodes || []).join(', ') || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!result.dry_run && (
            <p className="text-xs text-green-400/70">
              ✓ {result.updated} Exercises wurden in der Datenbank aktualisiert.
            </p>
          )}
        </div>
      )}

      {result?.error && (
        <div className="glass rounded-2xl border border-red-500/30 p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{result.error}</p>
        </div>
      )}
    </motion.div>
  );
}