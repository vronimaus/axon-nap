import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Wand2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function MFRNodeTab() {
  const queryClient = useQueryClient();
  const [generatingId, setGeneratingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['mfrNodes'],
    queryFn: () => base44.entities.MFRNode.list('order', 20),
  });

  const updateNode = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MFRNode.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfrNodes'] });
      setEditingId(null);
      toast.success('Gespeichert');
    },
  });

  const generateInstruction = async (node) => {
    setGeneratingId(node.id);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein Stecco-Faszientherapie-Experte. Erstelle eine präzise, schritt-für-schritt Anleitung (3-4 Sätze, auf Deutsch) für den MFR-Node "${node.name_de}" (${node.node_id}).

Details:
- Körperbereich: ${node.body_area}
- Exakte Platzierung: ${node.exact_placement_de}
- Stecco-Punkt: ${node.stecco_cc_name || 'N/A'}
- Zielkette: ${node.target_chain}

Anleitung muss enthalten:
1. Wo genau der Lacrosse-Ball zu platzieren ist (anatomische Landmarke)
2. Wie der Druck aufzubauen ist (Körpergewicht, Atemrhythmus)
3. Was der User spüren soll (Druckgefühl, keine Schmerzen)

Schreibe direkt und in der "Du"-Form. Keine Überschriften, nur Fließtext.`,
        response_json_schema: {
          type: 'object',
          properties: {
            instruction: { type: 'string' }
          }
        }
      });

      await base44.entities.MFRNode.update(node.id, {
        user_instruction: result.instruction
      });
      queryClient.invalidateQueries({ queryKey: ['mfrNodes'] });
      toast.success(`${node.node_id} generiert`);
    } catch (e) {
      toast.error('Fehler bei Generierung');
      console.error(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const generateAll = async () => {
    const missing = nodes.filter(n => !n.user_instruction || n.user_instruction.length < 50);
    if (missing.length === 0) {
      toast.info('Alle Nodes haben bereits Anleitungen');
      return;
    }
    setGeneratingAll(true);
    for (const node of missing) {
      await generateInstruction(node);
    }
    setGeneratingAll(false);
    toast.success(`${missing.length} Anleitungen generiert`);
  };

  const saveEdit = (node) => {
    updateNode.mutate({ id: node.id, data: { user_instruction: editValue } });
  };

  const nodesWithInstruction = nodes.filter(n => n.user_instruction && n.user_instruction.length > 40);
  const nodesMissing = nodes.filter(n => !n.user_instruction || n.user_instruction.length < 40);

  if (isLoading) {
    return <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Laden...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="glass rounded-2xl border border-emerald-500/30 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-1">🎯 MFR Nodes — user_instruction</h2>
            <p className="text-sm text-slate-400">
              Platzierungsanleitungen für den MFR-Reset Screen (Daily Tune-Up).
            </p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                {nodesWithInstruction.length} vollständig
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                {nodesMissing.length} fehlen
              </span>
            </div>
          </div>
          {nodesMissing.length > 0 && (
            <Button
              onClick={generateAll}
              disabled={generatingAll || generatingId !== null}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold"
            >
              {generatingAll ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generiere alle…</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Alle {nodesMissing.length} fehlenden generieren</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Node List */}
      <div className="space-y-3">
        {nodes.sort((a, b) => (a.order || 0) - (b.order || 0)).map((node) => {
          const hasInstruction = node.user_instruction && node.user_instruction.length > 40;
          const isGenerating = generatingId === node.id;
          const isEditing = editingId === node.id;

          return (
            <div
              key={node.id}
              className={`glass rounded-xl border p-4 transition-all ${
                hasInstruction ? 'border-emerald-500/20' : 'border-amber-500/30'
              }`}
            >
              {/* Node Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    hasInstruction ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {node.node_id}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{node.name_de}</p>
                    <p className="text-xs text-slate-400">{node.body_area} · {node.exact_placement_de}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasInstruction && !isEditing && (
                    <button
                      onClick={() => { setEditingId(node.id); setEditValue(node.user_instruction); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-all"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => generateInstruction(node)}
                    disabled={isGenerating || generatingAll}
                    className={`text-xs font-bold ${
                      hasInstruction
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900'
                    }`}
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-3 h-3 animate-spin mr-1" />Generiere…</>
                    ) : (
                      <><Wand2 className="w-3 h-3 mr-1" />{hasInstruction ? 'Neu generieren' : 'Generieren'}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Instruction Content */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(node)}
                      disabled={updateNode.isPending}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40"
                    >
                      <Save className="w-3 h-3 mr-1" /> Speichern
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      className="text-slate-400"
                    >
                      <X className="w-3 h-3 mr-1" /> Abbrechen
                    </Button>
                  </div>
                </div>
              ) : hasInstruction ? (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-sm text-slate-300 leading-relaxed">{node.user_instruction}</p>
                </div>
              ) : (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-400/70 italic">Noch keine Anleitung — bitte generieren.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}