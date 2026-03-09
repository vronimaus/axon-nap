import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Zap, BookOpen, Palette, ArrowLeft, Image, Trash2, Filter, ChevronUp, ChevronDown, GitMerge, Edit, SearchCheck } from 'lucide-react';
import ExerciseMappingTab from '../components/admin/ExerciseMappingTab';
import ExerciseAuditTab from '../components/admin/ExerciseAuditTab';
import ExerciseEditorTab from '../components/admin/ExerciseEditorTab';
import EnrichmentLogTab from '../components/admin/EnrichmentLogTab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Prefix-Definitionen
const PREFIXES = {
  KB:  { label: 'KB',  color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',  desc: 'Kettlebell' },
  BW:  { label: 'BW',  color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',         desc: 'Bodyweight' },
  RB:  { label: 'RB',  color: 'bg-green-500/20 text-green-300 border-green-500/40',      desc: 'Resistance Band' },
  SL:  { label: 'SL',  color: 'bg-teal-500/20 text-teal-300 border-teal-500/40',         desc: 'Sliders' },
  MB:  { label: 'MB',  color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',         desc: 'Mobility / CARs' },
  NR:  { label: 'NR',  color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',   desc: 'Neuro Drill' },
  BR:  { label: 'BR',  color: 'bg-pink-500/20 text-pink-300 border-pink-500/40',         desc: 'Breathwork' },
  MFR: { label: 'MFR', color: 'bg-red-500/20 text-red-300 border-red-500/40',            desc: 'Faszien / MFR' },
};

function getPrefix(exercise_id) {
  if (!exercise_id) return null;
  for (const key of Object.keys(PREFIXES)) {
    if (exercise_id.startsWith(key + '_') || exercise_id.startsWith(key)) {
      return key;
    }
  }
  return null;
}

function ExercisesTab() {
  const [prefixFilter, setPrefixFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('exercise_id');
  const [sortOrder, setSortOrder] = useState('asc');

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list('-updated_date', 500),
  });

  // Detect duplicates by exercise_id
  const idCounts = exercises.reduce((acc, ex) => {
    const id = ex.exercise_id || '';
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  let filtered = exercises.filter(ex => {
    const prefix = getPrefix(ex.exercise_id);
    const prefixMatch = prefixFilter === 'all' || prefix === prefixFilter || (prefixFilter === 'legacy' && !prefix);
    const diffMatch = difficultyFilter === 'all' || ex.difficulty === difficultyFilter;
    const searchMatch = !searchQuery || 
      ex.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.exercise_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return prefixMatch && diffMatch && searchMatch;
  });

  filtered.sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Count per prefix for badges
  const prefixCounts = exercises.reduce((acc, ex) => {
    const p = getPrefix(ex.exercise_id) || 'legacy';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const duplicateCount = Object.values(idCounts).filter(c => c > 1).length;

  if (isLoading) {
    return <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-slate-400">Laden...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">💪 Exercises Library</h2>
            <p className="text-sm text-slate-400 mt-1">
              {filtered.length} von {exercises.length} Übungen
              {duplicateCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs border border-red-500/40">
                  ⚠ {duplicateCount} Duplikate
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Prefix Filter Badges */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Prefix / Gruppe</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPrefixFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                prefixFilter === 'all'
                  ? 'bg-slate-300/20 text-white border-slate-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              Alle ({exercises.length})
            </button>
            {Object.entries(PREFIXES).map(([key, def]) => (
              <button
                key={key}
                onClick={() => setPrefixFilter(key)}
                title={def.desc}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  prefixFilter === key
                    ? def.color + ' border-current'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {key} {prefixCounts[key] ? `(${prefixCounts[key]})` : '(0)'}
              </button>
            ))}
            {prefixCounts['legacy'] > 0 && (
              <button
                onClick={() => setPrefixFilter('legacy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  prefixFilter === 'legacy'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                Legacy ({prefixCounts['legacy']})
              </button>
            )}
          </div>
        </div>

        {/* Search + Difficulty + Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <input
            type="text"
            placeholder="Name oder ID suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500"
          />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
          >
            <option value="all">Alle Schwierigkeiten</option>
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            >
              <option value="exercise_id">ID</option>
              <option value="name">Name</option>
              <option value="difficulty">Schwierigkeit</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:text-white transition-colors"
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <p className="text-slate-400">Keine Exercises gefunden</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">ID</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Name</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Prefix</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Schwierigkeit</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Felder</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ex => {
                  const prefix = getPrefix(ex.exercise_id);
                  const prefixDef = prefix ? PREFIXES[prefix] : null;
                  const isDuplicate = idCounts[ex.exercise_id] > 1;
                  const hasAxonMoment = !!ex.axon_moment;
                  const hasPurpose = !!ex.purpose_explanation;
                  const hasBenefits = !!ex.benefits;
                  return (
                    <tr key={ex.id} className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${isDuplicate ? 'bg-red-500/5' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded">
                            {ex.exercise_id || '—'}
                          </code>
                          {isDuplicate && (
                            <span className="text-xs text-red-400" title="Doppelte ID">⚠</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-100">{ex.name}</p>
                      </td>
                      <td className="py-3 px-3">
                        {prefixDef ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${prefixDef.color}`} title={prefixDef.desc}>
                            {prefixDef.label}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                            Legacy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          ex.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                          ex.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                          ex.difficulty === 'advanced' ? 'bg-red-500/20 text-red-300' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {ex.difficulty || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${hasAxonMoment ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-600'}`} title="axon_moment">A</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${hasPurpose ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-600'}`} title="purpose_explanation">P</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${hasBenefits ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-600'}`} title="benefits">B</span>
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

function RoadmapTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['developerNotes'],
    queryFn: () => base44.entities.DeveloperNote.list(),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeveloperNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerNotes'] });
    },
  });

  const filteredNotes = statusFilter === 'all' 
    ? notes 
    : notes.filter(note => note.status === statusFilter);

  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/50',
    disabled: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    archived: 'bg-red-500/20 text-red-400 border-red-500/50'
  };

  const categoryIcons = {
    feature: '✨',
    bug_fix: '🐛',
    config: '⚙️',
    integration: '🔗',
    ui_component: '🎨',
    other: '📝'
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
        <h2 className="text-2xl font-bold text-cyan-400 mb-6">📋 Roadmap & zukünftige Vorhaben</h2>
        
        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'disabled', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-cyan-500/30 text-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? 'Alle' : status === 'active' ? 'Aktiv' : status === 'disabled' ? 'Deaktiviert' : 'Archiviert'}
            </button>
          ))}
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <p className="text-slate-400">Keine Notes gefunden</p>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{categoryIcons[note.category]}</span>
                      <h3 className="font-semibold text-slate-200">{note.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${statusColors[note.status]}`}>
                        {note.status === 'active' ? 'Aktiv' : note.status === 'disabled' ? 'Deaktiviert' : 'Archiviert'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{note.description}</p>
                    {note.file_paths && (
                      <p className="text-xs text-slate-500">📁 {note.file_paths}</p>
                    )}
                    {note.tags && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {note.tags.split(',').map(tag => (
                          <span key={tag} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminHub() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flow');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          window.location.href = createPageUrl('Landing');
          return;
        }
        // Only admins can access this page
        if (currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Dashboard');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
        <div className="max-w-md w-full glass rounded-2xl border border-slate-700 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Zugriff verweigert</h2>
          <p className="text-slate-300 mb-6">
            Dieser Bereich ist nur für Administratoren zugänglich.
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
          >
            Zurück zum Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                🔧 Admin Hub
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Tools, Inhalte & Diagnose-Management
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 lg:w-fit mb-8 bg-slate-900 border border-cyan-500/20">
              <TabsTrigger value="flow" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Flow</span>
              </TabsTrigger>
              <TabsTrigger value="exercises" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span>Übungen</span>
              </TabsTrigger>
              <TabsTrigger value="exercise-editor" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                <span>Editor</span>
              </TabsTrigger>
              <TabsTrigger value="diagnosis" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Diagnose</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Tools</span>
              </TabsTrigger>
              <TabsTrigger value="mapping" className="flex items-center gap-2">
                <GitMerge className="w-4 h-4" />
                <span>Mapping</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <SearchCheck className="w-4 h-4" />
                <span>Audit</span>
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Roadmap</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Logs</span>
              </TabsTrigger>
            </TabsList>

          {/* Flow Tab */}
          <TabsContent value="flow" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">Flow Content Management</h2>
              <p className="text-slate-300 mb-6">
                Verwalte FLOW Routinen und deren Inhalte.
              </p>
              <p className="text-slate-400 text-sm">
                Weitere Flow-Management-Tools folgen in Kürze...
              </p>
            </motion.div>
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="mt-0">
            <ExercisesTab />
          </TabsContent>

          {/* Exercise Editor Tab */}
          <TabsContent value="exercise-editor" className="mt-0">
            <ExerciseEditorTab />
          </TabsContent>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">Diagnose Tool</h2>
              <p className="text-slate-300 mb-6">
                Erweiterte Diagnose-Funktionen für detaillierte Ketten-Analysen und Plan-Erstellung.
              </p>
              <Button
                onClick={() => window.location.href = createPageUrl('AdminDiagnostics')}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                Zum Admin Diagnose Tool
              </Button>
            </motion.div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* AXON Wissensdatenbank */}
              <div className="glass rounded-2xl border border-purple-500/30 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-purple-400">AXON Knowledge Bot</h2>
                    <p className="text-sm text-slate-400">Wissenschaftsbasierter KI-Coach</p>
                  </div>
                </div>
                <p className="text-slate-300 mb-6">
                  Füttere den AXON-Bot mit wissenschaftlichem Wissen. Paper hochladen, automatisch analysieren und für personalisierte Empfehlungen nutzen.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => window.location.href = createPageUrl('KnowledgeUpload')}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    📚 Wissensdatenbank
                  </Button>
                  <Button
                    onClick={() => window.location.href = createPageUrl('AxonBotTest')}
                    variant="outline"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    🤖 Bot testen
                  </Button>
                </div>
              </div>

              {/* Kommende Tools */}
              <div className="glass rounded-2xl border border-cyan-500/30 p-8">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Kommende Tools</h2>
                <p className="text-slate-300 mb-6">
                  Weitere Admin-Tools in Entwicklung:
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li>• Benutzer-Management & Coaching-Zuweisungen</li>
                  <li>• Reporting & Analytics</li>
                  <li>• Inhalts-Management (Bilder, Übungen, Routinen)</li>
                  <li>• Marketing & Promotion-Tools</li>
                  <li>• System-Monitoring & Logs</li>
                </ul>
              </div>
            </motion.div>
          </TabsContent>

          {/* Mapping Tab */}
          <TabsContent value="mapping" className="mt-0">
            <ExerciseMappingTab />
          </TabsContent>

          {/* Roadmap Tab */}
          <TabsContent value="roadmap" className="mt-0">
            <RoadmapTab />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="mt-0">
            <EnrichmentLogTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}