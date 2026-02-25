import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const LogItem = ({ log, exerciseName }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  let formattedJson = log.ai_response_json;
  try {
    if (formattedJson) {
      formattedJson = JSON.stringify(JSON.parse(formattedJson), null, 2);
    }
  } catch(e) {
    // leave as is if truncated/invalid
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 transition-all hover:bg-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {log.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <h3 className="font-semibold text-slate-200 text-sm truncate">
              Übung: <span className="font-mono text-cyan-400">{exerciseName}</span>
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto shrink-0">
              <Clock className="w-3 h-3" />
              {format(new Date(log.enrichment_date), "dd.MM. HH:mm 'Uhr'", { locale: de })}
            </span>
          </div>

          {log.status === 'success' ? (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <div>
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
                {log.ai_response_json && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setExpanded(!expanded)}
                    className="h-8 text-xs text-slate-400 hover:text-cyan-400 shrink-0 ml-4"
                  >
                    {expanded ? 'Details ausblenden' : 'Details ansehen'}
                    {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </Button>
                )}
              </div>
              
              {expanded && log.ai_response_json && (
                <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700/50 overflow-x-auto">
                  <p className="text-xs text-cyan-500 mb-2 font-medium">KI Antwort (Inhalte):</p>
                  <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap">
                    {formattedJson}
                  </pre>
                </div>
              )}
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
  );
};

export default function EnrichmentLogTab() {
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['enrichment-logs'],
    queryFn: () => base44.entities.ExerciseEnrichmentLog.list('-enrichment_date', 50),
    refetchInterval: 10000 // Poll every 10 seconds
  });

  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list()
  });

  const isLoading = isLoadingLogs || isLoadingExercises;

  const exerciseMap = React.useMemo(() => {
    return exercises.reduce((acc, ex) => {
      acc[ex.id] = ex;
      acc[ex.exercise_id] = ex;
      return acc;
    }, {});
  }, [exercises]);

  const [triggering, setTriggering] = React.useState(false);
  const queryClient = useQueryClient();

  const handleManualTrigger = async () => {
    setTriggering(true);
    try {
      const res = await base44.functions.invoke('bulkEnrichExercises');
      if (res.data.results) {
        const successCount = res.data.results.filter(r => r.status === 'success').length;
        toast.success(`${successCount} Übungen erfolgreich angereichert!`);
      } else {
        toast.info(res.data.message || 'Keine Übungen zur Anreicherung gefunden.');
      }
      queryClient.invalidateQueries({ queryKey: ['enrichment-logs'] });
    } catch (e) {
      toast.error('Fehler beim Starten: ' + e.message);
    } finally {
      setTriggering(false);
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-slate-300 text-sm">
            Zeigt die letzten 50 automatischen KI-Updates. Die Automatisierung läuft alle 5 Minuten im Hintergrund.
          </p>
          <Button 
            onClick={handleManualTrigger} 
            disabled={triggering}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shrink-0"
          >
            {triggering ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {triggering ? 'Verarbeite Batch...' : 'Batch jetzt starten (10 Stk.)'}
          </Button>
        </div>

        {logs.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center bg-slate-800/30 rounded-xl border border-slate-700/50">
            Noch keine Logs vorhanden
          </p>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {logs.map(log => {
              const exercise = exerciseMap[log.exercise_id];
              const exerciseName = exercise ? (exercise.name || exercise.exercise_id) : log.exercise_id;
              
              return (
                <LogItem 
                  key={log.id} 
                  log={log} 
                  exerciseName={exerciseName} 
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}