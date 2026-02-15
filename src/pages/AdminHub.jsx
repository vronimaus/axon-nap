import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Zap, BookOpen, Palette, ArrowLeft, Image } from 'lucide-react';

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
          <TabsList className="grid w-full grid-cols-5 lg:w-fit mb-8 bg-slate-900 border border-cyan-500/20">
              <TabsTrigger value="flow" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Flow</span>
              </TabsTrigger>
              <TabsTrigger value="exercises" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span>Übungen</span>
              </TabsTrigger>
              <TabsTrigger value="diagnosis" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Diagnose</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Tools</span>
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Roadmap</span>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">Übungs-Bilder hochladen</h2>
              <p className="text-slate-300 mb-6">
                Lade Bilder für alle Übungen hoch. Diese werden automatisch in den Flows angezeigt.
              </p>
              <Button
                onClick={() => window.location.href = createPageUrl('ExerciseImageUpload')}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                <Image className="w-4 h-4 mr-2" />
                Übungs-Bilder verwalten
              </Button>
            </motion.div>
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
        </Tabs>
      </div>
    </div>
  );
}