import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function EnrichmentLogTab() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['enrichment-logs'],
    queryFn: () => base44.entities.ExerciseEnrichmentLog.list('-enrichment_date', 50),
    refetchInterval: 10000 // Poll every 10 seconds
  });

  if (isLoading) {
    return <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-slate-400">Laden...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="glass rounded-2xl border border-cyan-500/30 p-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">📋 Letzte KI-Ergänzungen (Log)</h2>
        <p className="text-slate-300 mb-6 text-sm">
          Zeigt die letzten 50 automatischen KI-Updates durch die Hintergrund-Automatisierung oder manuelles Triggern.
        </p>

        {logs.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center bg-slate-800/30 rounded-xl border border-slate-700/50">
            Noch keine Logs vorhanden
          </p>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {logs.map(log => (
              <div
                key={log.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 transition-all hover:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-slate-200 text-sm truncate">
                        Übung: <span className="font-mono text-cyan-400">{log.exercise_id}</span>
                      </h3>
                      <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto shrink-0">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.enrichment_date), "dd.MM. HH:mm 'Uhr'", { locale: de })}
                      </span>
                    </div>

                    {log.status === 'success' ? (
                      <div className="mt-2">
                        <p className="text-xs text-slate-400 mb-1">Aktualisierte Felder:</p>
                        <div className="flex flex-wrap gap-1">
                          {log.enriched_fields?.map(f => (
                            <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                              {f}
                            </span>
                          ))}
                          {(!log.enriched_fields || log.enriched_fields.length === 0) && (
                            <span className="text-xs text-slate-500 italic">Keine neuen Felder befüllt</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-xs text-red-400 mb-1">Fehler:</p>
                        <p className="text-xs bg-red-500/10 text-red-300 p-2 rounded border border-red-500/20 font-mono">
                          {log.error_details || 'Unbekannter Fehler'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}