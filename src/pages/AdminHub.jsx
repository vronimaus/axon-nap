import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Zap, Dumbbell, Palette, ArrowLeft, KeyRound, Megaphone, Kanban, Mic, ShieldCheck, Trash2 } from 'lucide-react';
import ExerciseEditorTab from '../components/admin/ExerciseEditorTab';
import ExerciseAuditTab from '../components/admin/ExerciseAuditTab';
import InviteCodesTab from '../components/admin/InviteCodesTab';
import MarketingTab from '../components/admin/MarketingTab';
import ContentKanban from '../components/admin/ContentKanban';
import MFRNodeTab from '../components/admin/MFRNodeTab';
import FitnessSnackAdminTab from '../components/admin/FitnessSnackAdminTab';
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
  const [activeTab, setActiveTab] = useState('snacks');

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
          {/* Mobile: horizontal scroll, Desktop: wrap */}
          <div className="overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            <TabsList className="flex w-max gap-1 bg-slate-900 border border-cyan-500/20 p-1 rounded-xl">
              <TabsTrigger value="snacks" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Snacks</span>
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <Palette className="w-3.5 h-3.5 shrink-0" />
                <span>Flow</span>
              </TabsTrigger>
              <TabsTrigger value="exercise-editor" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <Dumbbell className="w-3.5 h-3.5 shrink-0" />
                <span>Übungen</span>
              </TabsTrigger>
              <TabsTrigger value="mfrnodes" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <span>🎯</span>
                <span>MFR Nodes</span>
              </TabsTrigger>
              <TabsTrigger value="marketing" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <Megaphone className="w-3.5 h-3.5 shrink-0" />
                <span>Marketing</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <Kanban className="w-3.5 h-3.5 shrink-0" />
                <span>Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="invites" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Codes</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Audit</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Snacks Tab */}
          <TabsContent value="snacks" className="mt-0">
            <FitnessSnackAdminTab />
          </TabsContent>

          {/* Flow Tab */}
          <TabsContent value="flow" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8">
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">Flow Content Management</h2>
              <p className="text-slate-400 text-sm">Weitere Flow-Management-Tools folgen in Kürze...</p>
            </motion.div>
          </TabsContent>

          {/* Exercise Editor Tab */}
          <TabsContent value="exercise-editor" className="mt-0">
            <ExerciseEditorTab />
          </TabsContent>

          {/* MFR Nodes Tab */}
          <TabsContent value="mfrnodes" className="mt-0">
            <MFRNodeTab />
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="mt-0">
            <MarketingTab />
          </TabsContent>

          {/* Kanban Tab */}
          <TabsContent value="kanban" className="mt-0">
            <ContentKanban />
          </TabsContent>

          {/* Invite Codes Tab */}
          <TabsContent value="invites" className="mt-0">
            <InviteCodesTab />
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="mt-0">
            <ExerciseAuditTab />
          </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}