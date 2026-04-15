import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, PlayCircle, CheckCircle, AlertTriangle, Link2, Link2Off, ChevronDown, ChevronRight, Save } from 'lucide-react';

export default function RoutineMFRMappingTab() {
  const queryClient = useQueryClient();
  const [patchResults, setPatchResults] = useState(null);
  const [isPatching, setIsPatching] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [expandedRoutine, setExpandedRoutine] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [selectedNode, setSelectedNode] = useState('');

  // Daten laden
  const { data: routines = [], isLoading: routinesLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: () => base44.entities.Routine.list(),
  });

  const { data: mfrNodes = [] } = useQuery({
    queryKey: ['mfrNodes'],
    queryFn: () => base44.entities.MFRNode.list(),
  });

  // Auto-Patch ausführen
  const handleRunPatch = async () => {
    setIsPatching(true);
    setPatchResults(null);
    try {
      const { data } = await base44.functions.invoke('patchRoutineMfrNodes', { dry_run: isDryRun });
      setPatchResults(data);
      if (!isDryRun) {
        queryClient.invalidateQueries({ queryKey: ['routines'] });
      }
    } catch (err) {
      setPatchResults({ error: err.message });
    } finally {
      setIsPatching(false);
    }
  };

  // Manuelles Update eines Steps
  const updateStepMutation = useMutation({
    mutationFn: async ({ routineId, stepIndex, nodeId }) => {
      const routine = routines.find(r => r.id === routineId);
      if (!routine) throw new Error('Routine nicht gefunden');
      
      const updatedSequence = routine.sequence.map((step, idx) => {
        if (idx === stepIndex) {
          return { ...step, node_id: nodeId || null };
        }
        return step;
      });
      
      return base44.entities.Routine.update(routineId, { sequence: updatedSequence });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setEditingStep(null);
      setSelectedNode('');
    },
  });

  // Statistiken berechnen
  const stats = {
    totalRoutines: routines.length,
    totalMfrSteps: 0,
    mappedSteps: 0,
    unmappedSteps: 0,
  };

  const routineAnalysis = routines.map(routine => {
    const mfrSteps = (routine.sequence || [])
      .map((step, idx) => ({ ...step, originalIndex: idx }))
      .filter(step => step.type === 'mfr');
    
    const mapped = mfrSteps.filter(s => s.node_id);
    const unmapped = mfrSteps.filter(s => !s.node_id);
    
    stats.totalMfrSteps += mfrSteps.length;
    stats.mappedSteps += mapped.length;
    stats.unmappedSteps += unmapped.length;
    
    return {
      ...routine,
      mfrSteps,
      mappedCount: mapped.length,
      unmappedCount: unmapped.length,
    };
  }).filter(r => r.mfrSteps.length > 0);

  const validNodeIds = mfrNodes.map(n => n.node_id);

  if (routinesLoading) {
    return (
      <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-center">
        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
        <p className="text-slate-400">Lade Routinen...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header & Stats */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link2 className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Routine → MFR Node Mapping</h2>
            <p className="text-sm text-slate-400">Verknüpfe MFR-Steps in Routinen mit den korrekten Stecco-Nodes</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Routinen mit MFR', value: routineAnalysis.length, color: 'text-slate-300' },
            { label: 'MFR-Steps gesamt', value: stats.totalMfrSteps, color: 'text-cyan-400' },
            { label: 'Verknüpft ✓', value: stats.mappedSteps, color: 'text-green-400' },
            { label: 'Offen ⚠️', value: stats.unmappedSteps, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Auto-Patch Controls */}
        <div className="border-t border-slate-700 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDryRun(!isDryRun)}
                className={`w-10 h-5 rounded-full transition-all ${isDryRun ? 'bg-amber-500' : 'bg-red-500'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${isDryRun ? '' : 'translate-x-5'}`} />
              </button>
              <div>
                <p className="text-sm text-slate-300 font-medium">Dry Run: {isDryRun ? 'AN' : 'AUS'}</p>
                <p className="text-xs text-slate-500">
                  {isDryRun ? 'Simuliert nur — keine Änderungen' : '⚠️ Schreibt direkt in die Datenbank'}
                </p>
              </div>
            </div>

            <Button
              onClick={handleRunPatch}
              disabled={isPatching}
              className={`flex items-center gap-2 ${
                isDryRun
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'
              }`}
            >
              {isPatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {isPatching ? 'Läuft...' : isDryRun ? 'Auto-Patch simulieren' : '🔥 Auto-Patch ausführen'}
            </Button>
          </div>
        </div>
      </div>

      {/* Patch Results */}
      <AnimatePresence>
        {patchResults && !patchResults.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl border border-green-500/30 p-6"
          >
            <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {patchResults.dry_run ? 'Dry Run Ergebnis' : 'Patch abgeschlossen'}
            </h3>
            <p className="text-sm text-slate-300 mb-4">{patchResults.message}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Gescannt', value: patchResults.summary?.routines_scanned },
                { label: 'MFR-Steps', value: patchResults.summary?.mfr_steps_found },
                { label: 'Neu verknüpft', value: patchResults.summary?.newly_mapped, color: 'text-green-400' },
                { label: 'Nicht zugeordnet', value: patchResults.summary?.unmapped, color: 'text-amber-400' },
              ].map(m => (
                <div key={m.label} className="bg-slate-800/30 rounded-lg p-2 text-center">
                  <p className={`text-xl font-bold ${m.color || 'text-slate-300'}`}>{m.value ?? 0}</p>
                  <p className="text-[10px] text-slate-500">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Unmapped Exercises */}
            {patchResults.summary?.unmapped_exercises?.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mt-4">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
                  Nicht zugeordnet — manuell prüfen:
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {patchResults.summary.unmapped_exercises.map((u, i) => (
                    <p key={i} className="text-xs text-slate-400">
                      <span className="text-slate-500">{u.routine_name}</span> → {u.exercise_name}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {patchResults?.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl border border-red-500/30 p-6"
          >
            <p className="text-red-400">Fehler: {patchResults.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Routine List with Manual Edit */}
      <div className="glass rounded-2xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-slate-200 mb-4">Routinen mit MFR-Steps</h3>
        
        <div className="space-y-2">
          {routineAnalysis.map(routine => (
            <div key={routine.id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              {/* Routine Header */}
              <button
                onClick={() => setExpandedRoutine(expandedRoutine === routine.id ? null : routine.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedRoutine === routine.id ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="font-medium text-slate-200">{routine.routine_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {routine.unmappedCount > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                      <Link2Off className="w-3 h-3" />
                      {routine.unmappedCount} offen
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      alle verknüpft
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{routine.mfrSteps.length} MFR</span>
                </div>
              </button>

              {/* Expanded Steps */}
              <AnimatePresence>
                {expandedRoutine === routine.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-700"
                  >
                    <div className="p-4 space-y-2">
                      {routine.mfrSteps.map((step, idx) => {
                        const isEditing = editingStep?.routineId === routine.id && editingStep?.stepIndex === step.originalIndex;
                        
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              step.node_id
                                ? 'bg-slate-900/50 border-slate-700'
                                : 'bg-amber-500/5 border-amber-500/30'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-300 truncate">
                                {step.exercise_name || `Step ${step.originalIndex + 1}`}
                              </p>
                              <p className="text-xs text-slate-500">Index: {step.originalIndex}</p>
                            </div>

                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={selectedNode}
                                  onChange={(e) => setSelectedNode(e.target.value)}
                                  className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-200"
                                >
                                  <option value="">— Kein Node —</option>
                                  {validNodeIds.map(nodeId => (
                                    <option key={nodeId} value={nodeId}>{nodeId}</option>
                                  ))}
                                </select>
                                <Button
                                  size="sm"
                                  onClick={() => updateStepMutation.mutate({
                                    routineId: routine.id,
                                    stepIndex: step.originalIndex,
                                    nodeId: selectedNode,
                                  })}
                                  disabled={updateStepMutation.isPending}
                                  className="bg-green-500/20 text-green-400 hover:bg-green-500/30 h-8 px-2"
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setEditingStep(null); setSelectedNode(''); }}
                                  className="h-8 px-2 text-slate-400"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {step.node_id ? (
                                  <span className="text-xs font-mono bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                                    {step.node_id}
                                  </span>
                                ) : (
                                  <span className="text-xs text-amber-400">nicht verknüpft</span>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingStep({ routineId: routine.id, stepIndex: step.originalIndex });
                                    setSelectedNode(step.node_id || '');
                                  }}
                                  className="h-8 px-2 text-slate-400 hover:text-cyan-400"
                                >
                                  ✏️
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {routineAnalysis.length === 0 && (
            <p className="text-center text-slate-500 py-8">Keine Routinen mit MFR-Steps gefunden.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}