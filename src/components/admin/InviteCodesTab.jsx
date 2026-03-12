import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteCodesTab() {
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [maxUses, setMaxUses] = useState(1);

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['inviteCodes'],
    queryFn: () => base44.entities.InviteCode.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InviteCode.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
      setNewCode('');
      setNewDesc('');
      setMaxUses(1);
      toast.success('Code erstellt');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.InviteCode.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inviteCodes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InviteCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
      toast.success('Code gelöscht');
    },
  });

  const handleCreate = () => {
    if (!newCode.trim()) return;
    createMutation.mutate({
      code: newCode.trim().toUpperCase(),
      description: newDesc.trim(),
      is_active: true,
      max_uses: Number(maxUses),
      used_count: 0,
      used_by_emails: [],
    });
  };

  const copyLink = (code) => {
    const url = `${window.location.origin}/InviteRedeem?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    toast.success('Link kopiert!');
  };

  if (isLoading) {
    return <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-slate-400">Laden...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Create new code */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-4">🔑 Neuen Einladungscode erstellen</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="CODE-HIER"
            className="bg-slate-900 border-slate-700 text-white font-mono uppercase"
          />
          <Input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Interne Notiz (optional)"
            className="bg-slate-900 border-slate-700 text-white"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400 whitespace-nowrap">Max. Nutzungen:</label>
            <Input
              type="number"
              min={0}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white w-20"
            />
            <span className="text-xs text-slate-500">(0=∞)</span>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!newCode.trim() || createMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-1" /> Erstellen
          </Button>
        </div>
      </div>

      {/* Codes list */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-cyan-400">Alle Codes ({codes.length})</h2>
        </div>

        {codes.length === 0 ? (
          <p className="text-slate-400">Noch keine Codes angelegt.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-3 text-slate-300">Code</th>
                  <th className="text-left py-3 px-3 text-slate-300">Beschreibung</th>
                  <th className="text-left py-3 px-3 text-slate-300">Nutzungen</th>
                  <th className="text-left py-3 px-3 text-slate-300">Status</th>
                  <th className="text-left py-3 px-3 text-slate-300">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const maxLabel = c.max_uses === 0 ? '∞' : c.max_uses;
                  const isFull = c.max_uses > 0 && c.used_count >= c.max_uses;
                  return (
                    <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <code className="font-mono text-cyan-300 bg-slate-800 px-2 py-1 rounded text-xs tracking-wider">
                          {c.code}
                        </code>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{c.description || '—'}</td>
                      <td className="py-3 px-3">
                        <span className={`text-sm font-mono ${isFull ? 'text-red-400' : 'text-slate-300'}`}>
                          {c.used_count} / {maxLabel}
                        </span>
                        {c.used_by_emails?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.used_by_emails.map(email => (
                              <span key={email} className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                                {email}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleMutation.mutate({ id: c.id, is_active: !c.is_active })}
                          className="flex items-center gap-1.5 text-xs font-medium"
                        >
                          {c.is_active ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Aktiv</span></>
                          ) : (
                            <><XCircle className="w-4 h-4 text-red-400" /><span className="text-red-400">Deaktiviert</span></>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyLink(c.code)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                            title="Link kopieren"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}