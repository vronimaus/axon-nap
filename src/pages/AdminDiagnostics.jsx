import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronRight, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDiagnostics() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('foot_ankle');
  const [expandedTest, setExpandedTest] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          toast.error('Nur für Admins zugänglich');
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

  // Fetch Movement Assessments
  const { data: assessments = [] } = useQuery({
    queryKey: ['movementAssessments'],
    queryFn: () => base44.entities.MovementAssessment.list(),
    enabled: !!user
  });

  const regions = [
    { key: 'foot_ankle', label: 'Fuß & Sprunggelenk', icon: '🦶', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' },
    { key: 'knee', label: 'Knie', icon: '🦵', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
    { key: 'hip', label: 'Hüfte', icon: '💪', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30' },
    { key: 'lumbar_spine', label: 'Lendenwirbelsäule', icon: '🏃', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
    { key: 'thoracic_spine', label: 'Brustwirbelsäule', icon: '🤸', color: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30' },
    { key: 'shoulder', label: 'Schulter', icon: '💪', color: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30' },
    { key: 'neck', label: 'Nacken', icon: '👤', color: 'from-pink-500/20 to-purple-500/20', border: 'border-pink-500/30' },
    { key: 'full_body', label: 'Ganzkörper', icon: '🧘', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' }
  ];

  const currentRegion = regions.find(r => r.key === selectedRegion);
  const filteredTests = assessments.filter(a => a.region === selectedRegion).sort((a, b) => (a.order || 0) - (b.order || 0));

  if (isLoading || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="text-slate-400 hover:text-cyan-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-cyan-400">Diagnose-Tool für Coaches</h1>
              <p className="text-xs sm:text-sm text-slate-400">Bewegungstests nach Körperregionen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-4"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-400 mb-1">Learning by Doing</h3>
              <p className="text-sm text-slate-300">
                Wähle eine Körperregion und nutze die Tests, um Instabilitäten zu erkennen. 
                Die Stichpunkte helfen dir, worauf du achten musst - inkl. Lernnotizen für dein eigenes Verständnis.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Region Selection */}
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Körperregion wählen</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {regions.map((region) => {
              const testCount = assessments.filter(a => a.region === region.key).length;
              return (
                <button
                  key={region.key}
                  onClick={() => setSelectedRegion(region.key)}
                  className={`glass rounded-xl p-4 border transition-all text-left hover:scale-105 bg-gradient-to-br ${region.color} ${
                    selectedRegion === region.key 
                      ? `${region.border} shadow-lg` 
                      : 'border-slate-700/50 opacity-70'
                  }`}
                >
                  <div className="text-3xl mb-2">{region.icon}</div>
                  <h3 className="font-semibold text-slate-200 text-sm mb-1">{region.label}</h3>
                  <p className="text-xs text-slate-400">{testCount} Tests</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tests Display */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">{currentRegion?.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-cyan-400">{currentRegion?.label}</h2>
              <p className="text-sm text-slate-400">{filteredTests.length} Tests verfügbar</p>
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl border border-slate-700/50 p-8 text-center"
            >
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Für diese Region sind noch keine Tests hinterlegt.</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredTests.map((test, idx) => (
                <TestCard
                  key={test.id}
                  test={test}
                  index={idx}
                  isExpanded={expandedTest === test.id}
                  onToggle={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                  regionColor={currentRegion?.color}
                  regionBorder={currentRegion?.border}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestCard({ test, index, isExpanded, onToggle, regionColor, regionBorder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass rounded-xl border transition-all bg-gradient-to-r ${regionColor} ${regionBorder}`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-200">{test.test_name}</h3>
            {test.test_name_en && (
              <p className="text-xs text-slate-500 mt-0.5">{test.test_name_en}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {test.difficulty_level && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  test.difficulty_level === 'basic' 
                    ? 'bg-green-500/20 text-green-400' 
                    : test.difficulty_level === 'intermediate'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {test.difficulty_level === 'basic' ? 'Basic' : test.difficulty_level === 'intermediate' ? 'Mittel' : 'Fortgeschritten'}
                </span>
              )}
              {test.observation_points?.length > 0 && (
                <span className="text-xs text-slate-500">{test.observation_points.length} Beobachtungspunkte</span>
              )}
            </div>
          </div>
        </div>
        <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-4 space-y-4">
              {/* Test Instruction */}
              <div>
                <h4 className="font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Durchführung
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {test.test_instruction}
                </p>
              </div>

              {/* Required Equipment */}
              {test.required_equipment && test.required_equipment.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-400 mb-2 text-sm">Benötigtes Equipment:</h4>
                  <div className="flex flex-wrap gap-2">
                    {test.required_equipment.map((item, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-lg bg-slate-800/50 text-xs text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Observation Points */}
              {test.observation_points && test.observation_points.length > 0 && (
                <div>
                  <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Was zu beobachten ist
                  </h4>
                  <ul className="space-y-2">
                    {test.observation_points.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Findings Indicators */}
              {test.findings_indicators && Object.keys(test.findings_indicators).length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Was kann festgestellt werden
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(test.findings_indicators).map(([observation, meaning], idx) => (
                      <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                        <p className="text-sm font-medium text-purple-300 mb-1">→ {observation}</p>
                        <p className="text-sm text-slate-400">{meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Notes */}
              {test.learning_notes && (
                <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                    💡 Lernnotiz
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {test.learning_notes}
                  </p>
                </div>
              )}

              {/* Corrective Exercises */}
              {test.corrective_exercises && test.corrective_exercises.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Korrekturübungen</h4>
                  <div className="flex flex-wrap gap-2">
                    {test.corrective_exercises.map((exerciseId, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-sm text-green-300">
                        {exerciseId}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Diese Übungen adressieren identifizierte Schwachstellen</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}