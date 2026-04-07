import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Wand2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PretestInstructionTab() {
  const queryClient = useQueryClient();
  const [generatingId, setGeneratingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);

  const { data: chains = [], isLoading } = useQuery({
    queryKey: ['tuneUpCausalChains'],
    queryFn: () => base44.entities.TuneUpCausalChain.list('node_id', 20),
  });

  const updateChain = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TuneUpCausalChain.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tuneUpCausalChains'] });
      setEditingId(null);
      toast.success('Gespeichert');
    },
  });

  const generatePretestInstruction = async (chain) => {
    setGeneratingId(chain.id);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein Rehabilitations-Trainer für neuro-athletisches Training. Erstelle eine präzise, schritt-für-schritt Anleitung (4-5 Sätze, auf Deutsch) für den Pre-Test des MFR-Nodes "${chain.node_name_de}" (${chain.node_id}).

Details:
- Symptom: ${chain.symptom}
- Körperregion: ${chain.körperregion}
- Zielkette: ${chain.target_chain}

Die Anleitung muss:
1. Eine KLARE AUSGANGSLAGE beschreiben (stehen/sitzen/liegen, wie die Füße/Arme positioniert sind)
2. Die KONKRETE BEWEGUNG erklären (welche Körperteile bewegen sich, in welche Richtung, wie schnell)
3. Beschreiben, WAS DER USER SPÜREN SOLL (wo die Limitation/das Unbehagen ist)
4. Die ANZAHL WIEDERHOLUNGEN angeben
5. Anfängerfreundlich und motivierend sein

Schreibe direkt und in der "Du"-Form. Keine Überschriften, nur fließender Text. Z.B.: "Stelle dich aufrecht hin, Füße schulterbreit auseinander..."`,
        response_json_schema: {
          type: 'object',
          properties: {
            instruction: { type: 'string' }
          }
        }
      });

      // Update nested hardware_reset.pretest_instruction
      const updated = { ...chain };
      if (!updated.hardware_reset) updated.hardware_reset = {};
      updated.hardware_reset.pretest_instruction = result.instruction;

      await base44.entities.TuneUpCausalChain.update(chain.id, {
        hardware_reset: updated.hardware_reset
      });
      queryClient.invalidateQueries({ queryKey: ['tuneUpCausalChains'] });
      toast.success(`${chain.node_id} generiert`);
    } catch (e) {
      toast.error('Fehler bei Generierung');
      console.error(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const generateAll = async () => {
    const missing = chains.filter(c => !c.hardware_reset?.pretest_instruction || c.hardware_reset.pretest_instruction.length < 50);
    if (missing.length === 0) {
      toast.info('Alle Nodes haben bereits Pre-Test-Anleitungen');
      return;
    }
    setGeneratingAll(true);
    for (const chain of missing) {
      await generatePretestInstruction(chain);
    }
    setGeneratingAll(false);
    toast.success(`${missing.length} Anleitungen generiert`);
  };

  const saveEdit = (chain) => {
    const updated = { ...chain };
    if (!updated.hardware_reset) updated.hardware_reset = {};
    updated.hardware_reset.pretest_instruction = editValue;
    updateChain.mutate({ id: chain.id, data: { hardware_reset: updated.hardware_reset } });
  };

  const chainsWithInstruction = chains.filter(c => c.hardware_reset?.pretest_instruction && c.hardware_reset.pretest_instruction.length > 40);
  const chainsMissing = chains.filter(c => !c.hardware_reset?.pretest_instruction || c.hardware_reset.pretest_instruction.length < 40);

  if (isLoading) {
    return <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Laden...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="glass rounded-2xl border border-orange-500/30 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-orange-400 mb-1">📋 Pre-Test Anleitungen</h2>
            <p className="text-sm text-slate-400">
              Bewegungs-Anweisungen für den Daily Tune-Up Pre-Test (TuneUpCausalChain.hardware_reset.pretest_instruction).
            </p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                {chainsWithInstruction.length} vollständig
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                {chainsMissing.length} fehlen
              </span>
            </div>
          </div>
          {chainsMissing.length > 0 && (
            <Button
              onClick={generateAll}
              disabled={generatingAll || generatingId !== null}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-slate-900 font-bold"
            >
              {generatingAll ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generiere alle…</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Alle {chainsMissing.length} fehlenden generieren</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Chain List */}
      <div className="space-y-3">
        {chains.sort((a, b) => (a.node_id || '').localeCompare(b.node_id || '')).map((chain) => {
          const hasInstruction = chain.hardware_reset?.pretest_instruction && chain.hardware_reset.pretest_instruction.length > 40;
          const isGenerating = generatingId === chain.id;
          const isEditing = editingId === chain.id;

          return (
            <div
              key={chain.id}
              className={`glass rounded-xl border p-4 transition-all ${
                hasInstruction ? 'border-orange-500/20' : 'border-amber-500/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    hasInstruction ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {chain.node_id}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{chain.node_name_de}</p>
                    <p className="text-xs text-slate-400">{chain.körperregion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasInstruction && !isEditing && (
                    <button
                      onClick={() => { setEditingId(chain.id); setEditValue(chain.hardware_reset.pretest_instruction); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-all"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => generatePretestInstruction(chain)}
                    disabled={isGenerating || generatingAll}
                    className={`text-xs font-bold ${
                      hasInstruction
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-900'
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
                    rows={5}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(chain)}
                      disabled={updateChain.isPending}
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
                  <p className="text-sm text-slate-300 leading-relaxed">{chain.hardware_reset.pretest_instruction}</p>
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