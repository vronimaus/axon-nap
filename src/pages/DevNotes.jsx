import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Code, Plus, Trash2, Edit, Save, X, FileCode, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function DevNotes() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'feature',
    description: '',
    code_snippet: '',
    file_paths: '',
    status: 'active',
    tags: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Check if user is admin
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          toast.error('Nur für Admins zugänglich');
        }
      } catch (e) {
        toast.error('Bitte einloggen');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: notes = [] } = useQuery({
    queryKey: ['developerNotes'],
    queryFn: () => base44.entities.DeveloperNote.list('-created_date'),
    enabled: user?.role === 'admin'
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DeveloperNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerNotes'] });
      resetForm();
      toast.success('Note gespeichert');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DeveloperNote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerNotes'] });
      setEditingId(null);
      toast.success('Note aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeveloperNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerNotes'] });
      toast.success('Note gelöscht');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'feature',
      description: '',
      code_snippet: '',
      file_paths: '',
      status: 'active',
      tags: '',
      notes: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      toast.error('Titel und Beschreibung sind erforderlich');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (note) => {
    setFormData(note);
    setEditingId(note.id);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400">Lade...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/90 border-red-500/30 p-8 text-center">
          <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Zugriff verweigert</h2>
          <p className="text-slate-400">Dieser Bereich ist nur für Admins zugänglich.</p>
        </Card>
      </div>
    );
  }

  const categoryColors = {
    feature: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    bug_fix: 'bg-red-500/20 text-red-400 border-red-500/30',
    config: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    integration: 'bg-green-500/20 text-green-400 border-green-500/30',
    ui_component: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    other: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    disabled: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center neuro-glow">
              <FileCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                Developer Notes
              </h1>
              <p className="text-slate-400 text-sm">Code-Snippets & Feature-Dokumentation</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Neue Note
          </Button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card className="bg-slate-900/90 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400">
                    {editingId ? 'Note bearbeiten' : 'Neue Note erstellen'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Titel *</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="z.B. TTS Feature mit Gemini"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Kategorie</label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feature">Feature</SelectItem>
                          <SelectItem value="bug_fix">Bug Fix</SelectItem>
                          <SelectItem value="config">Config</SelectItem>
                          <SelectItem value="integration">Integration</SelectItem>
                          <SelectItem value="ui_component">UI Component</SelectItem>
                          <SelectItem value="other">Sonstiges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Beschreibung *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Was macht dieses Feature? Warum wurde es deaktiviert?"
                      className="bg-slate-800 border-slate-700 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Code-Snippet</label>
                    <Textarea
                      value={formData.code_snippet}
                      onChange={(e) => setFormData({ ...formData, code_snippet: e.target.value })}
                      placeholder="Füge hier den relevanten Code ein..."
                      className="bg-slate-800 border-slate-700 min-h-[200px] font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Dateipfade</label>
                      <Input
                        value={formData.file_paths}
                        onChange={(e) => setFormData({ ...formData, file_paths: e.target.value })}
                        placeholder="functions/textToSpeech.js, pages/DiagnosisChat.js"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Status</label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktiv</SelectItem>
                          <SelectItem value="disabled">Deaktiviert</SelectItem>
                          <SelectItem value="archived">Archiviert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Tags (kommagetrennt)</label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="tts, audio, gemini, api"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Zusätzliche Notizen</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Weitere Infos, Gründe für Deaktivierung, zukünftige Pläne..."
                      className="bg-slate-800 border-slate-700 min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={resetForm}>
                      <X className="w-4 h-4 mr-2" />
                      Abbrechen
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-cyan-500 to-purple-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Speichern
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <Card className="bg-slate-900/90 border-slate-700 p-12 text-center">
              <Code className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Noch keine Notes erstellt</p>
            </Card>
          ) : (
            notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card className="bg-slate-900/90 border-cyan-500/30 hover:border-cyan-500/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl text-cyan-400">{note.title}</CardTitle>
                          <Badge className={categoryColors[note.category]}>
                            {note.category}
                          </Badge>
                          <Badge className={statusColors[note.status]}>
                            {note.status}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm">{note.description}</p>
                        {note.file_paths && (
                          <p className="text-xs text-slate-500 mt-2">
                            📁 {note.file_paths}
                          </p>
                        )}
                        {note.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.split(',').map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400"
                              >
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(note)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Note wirklich löschen?')) {
                              deleteMutation.mutate(note.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {(note.code_snippet || note.notes) && (
                    <CardContent className="space-y-4">
                      {note.code_snippet && (
                        <div>
                          <label className="text-xs text-slate-500 mb-2 block">Code:</label>
                          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                            {note.code_snippet}
                          </pre>
                        </div>
                      )}
                      {note.notes && (
                        <div>
                          <label className="text-xs text-slate-500 mb-2 block">Notizen:</label>
                          <p className="text-sm text-slate-400 whitespace-pre-wrap">{note.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}