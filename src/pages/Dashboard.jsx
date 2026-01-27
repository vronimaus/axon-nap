import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Activity, Brain, Cpu, ArrowRight, Clock, 
  CheckCircle2, AlertCircle, Zap, Target, TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TOP_SYMPTOMS, SYMPTOM_CLUSTERS } from '../components/diagnosis/SymptomData';

const QuickStartCard = ({ symptomData, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Link to={createPageUrl('DiagnosisWizard')}>
      <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-white group cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{symptomData.symptom}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500">{SYMPTOM_CLUSTERS[symptomData.cluster]?.label}</p>
                <span className="text-xs text-blue-600 font-medium">• {symptomData.prio_chain}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
      </Card>
    </Link>
  </motion.div>
);

const SessionCard = ({ session }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'hardware': return <Cpu className="w-5 h-5 text-blue-600" />;
      case 'software': return <Brain className="w-5 h-5 text-purple-600" />;
      case 'mixed': return <Activity className="w-5 h-5 text-amber-600" />;
      default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'hardware': return 'bg-blue-50 text-blue-700';
      case 'software': return 'bg-purple-50 text-purple-700';
      case 'mixed': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };
  
  const getTypeLabel = (type) => {
    switch (type) {
      case 'hardware': return 'Hardware';
      case 'software': return 'Software';
      case 'mixed': return 'Gemischt';
      default: return 'Unklar';
    }
  };
  
  return (
    <Card className="p-4 border-0 bg-white hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            session.diagnosis_type === 'hardware' ? 'bg-blue-100' :
            session.diagnosis_type === 'software' ? 'bg-purple-100' :
            session.diagnosis_type === 'mixed' ? 'bg-amber-100' : 'bg-slate-100'
          }`}>
            {getTypeIcon(session.diagnosis_type)}
          </div>
          <div>
            <p className="font-medium text-slate-800">{session.symptom_description}</p>
            <p className="text-xs text-slate-500 mt-1">
              {SYMPTOM_CLUSTERS[session.symptom_location]?.label}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(session.diagnosis_type)}`}>
          {getTypeLabel(session.diagnosis_type)}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(session.created_date).toLocaleDateString('de-DE')}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          {session.tested_chains?.length || 0} Ketten getestet
        </span>
      </div>
    </Card>
  );
};

export default function Dashboard() {
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['diagnosisSessions'],
    queryFn: () => base44.entities.DiagnosisSession.list('-created_date', 5)
  });
  
  const { data: chains = [] } = useQuery({
    queryKey: ['fascialChains'],
    queryFn: () => base44.entities.FascialChain.list()
  });
  
  const completedSessions = sessions.filter(s => s.completed);
  const hardwareCount = completedSessions.filter(s => s.diagnosis_type === 'hardware').length;
  const softwareCount = completedSessions.filter(s => s.diagnosis_type === 'software').length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Funktionelle Diagnostik
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight mb-4">
            Neuro-Fascial<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Diagnosis Tool
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Identifiziere, ob deine Beschwerden von der Hardware (Faszien) oder Software (Nervensystem) verursacht werden
          </p>
        </motion.div>
        
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <Link to={createPageUrl('DiagnosisWizard')}>
            <Button className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 gap-3">
              <Activity className="w-5 h-5" />
              Neue Diagnose starten
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
        
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <Card className="p-5 border-0 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{chains.length}</p>
                <p className="text-xs text-slate-500">Fasziale Ketten</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-5 border-0 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{chains.length}</p>
                <p className="text-xs text-slate-500">Neuro-Drills</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-5 border-0 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{completedSessions.length}</p>
                <p className="text-xs text-slate-500">Diagnosen</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-5 border-0 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {completedSessions.length > 0 
                    ? Math.round(softwareCount / completedSessions.length * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-slate-500">Neuro-bedingt</p>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Start */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Häufige Symptome
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {TOP_SYMPTOMS.slice(0, 10).map((item, index) => (
                  <QuickStartCard
                    key={item.id}
                    symptomData={item}
                    delay={0.3 + index * 0.05}
                  />
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Recent Sessions */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Letzte Diagnosen
              </h2>
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.slice(0, 4).map(session => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 border-0 bg-white text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">Noch keine Diagnosen durchgeführt</p>
                  <Link to={createPageUrl('DiagnosisWizard')}>
                    <Button variant="link" className="mt-2 text-blue-600">
                      Erste Diagnose starten
                    </Button>
                  </Link>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
        
        {/* Chain Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Myofasziale Ketten</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {chains.map((chain, index) => (
              <motion.div
                key={chain.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <Card className="p-4 border-0 bg-white hover:shadow-md transition-all text-center group cursor-pointer">
                  <div 
                    className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: chain.color }}
                  >
                    {chain.code}
                  </div>
                  <p className="text-xs font-medium text-slate-700 line-clamp-2">{chain.name_de}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}