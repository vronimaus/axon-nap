import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, Brain, Activity, AlertTriangle, CheckCircle2, 
  ArrowRight, RotateCcw, Download, Share2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DiagnosisGauge = ({ hardwareScore, softwareScore }) => {
  // Calculate position on spectrum (-100 = pure hardware, 100 = pure software)
  const position = softwareScore - hardwareScore;
  const normalizedPosition = Math.max(-100, Math.min(100, position * 50));
  
  return (
    <div className="relative h-8 bg-gradient-to-r from-blue-500 via-slate-200 to-purple-500 rounded-full overflow-hidden">
      <motion.div
        initial={{ left: '50%' }}
        animate={{ left: `${50 + normalizedPosition / 2}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-slate-300"
      />
      <div className="absolute inset-0 flex justify-between items-center px-4 text-xs font-semibold">
        <span className="text-white drop-shadow">Hardware</span>
        <span className="text-white drop-shadow">Software</span>
      </div>
    </div>
  );
};

const ChainResultCard = ({ chain, hardwareResult, softwareResult }) => {
  const getHardwareColor = (result) => {
    switch (result) {
      case 'limited': return 'text-red-600 bg-red-50';
      case 'moderate': return 'text-amber-600 bg-amber-50';
      case 'good': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };
  
  const getSoftwareColor = (result) => {
    switch (result) {
      case 'improved': return 'text-emerald-600 bg-emerald-50';
      case 'unchanged': return 'text-amber-600 bg-amber-50';
      case 'worse': return 'text-red-600 bg-red-50';
      case 'skipped': return 'text-slate-400 bg-slate-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };
  
  const getHardwareLabel = (result) => {
    switch (result) {
      case 'limited': return 'Eingeschränkt';
      case 'moderate': return 'Mittel';
      case 'good': return 'Gut';
      default: return '-';
    }
  };
  
  const getSoftwareLabel = (result) => {
    switch (result) {
      case 'improved': return 'Verbessert';
      case 'unchanged': return 'Unverändert';
      case 'worse': return 'Schlechter';
      case 'skipped': return 'Übersprungen';
      default: return '-';
    }
  };
  
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: chain.color }}
      >
        {chain.code}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{chain.name_de}</p>
        <p className="text-xs text-slate-500">{chain.test_name}</p>
      </div>
      <div className="flex gap-2">
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getHardwareColor(hardwareResult)}`}>
          {getHardwareLabel(hardwareResult)}
        </span>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getSoftwareColor(softwareResult)}`}>
          {getSoftwareLabel(softwareResult)}
        </span>
      </div>
    </div>
  );
};

export default function ResultsAnalysis({ 
  symptom, 
  chains, 
  hardwareResults, 
  softwareResults,
  onRestart,
  onSave 
}) {
  // Calculate scores
  const hardwareIssues = Object.values(hardwareResults).filter(r => r === 'limited' || r === 'moderate').length;
  const softwareImprovements = Object.values(softwareResults).filter(r => r === 'improved').length;
  const totalChains = chains.length;
  
  const hardwareScore = hardwareIssues / totalChains;
  const softwareScore = softwareImprovements / Math.max(1, Object.values(softwareResults).filter(r => r !== 'skipped').length);
  
  // Determine diagnosis
  let diagnosisType, diagnosisTitle, diagnosisDescription, diagnosisColor;
  
  if (hardwareIssues === 0) {
    diagnosisType = 'clear';
    diagnosisTitle = 'Keine Auffälligkeiten';
    diagnosisDescription = 'Die getesteten myofaszialen Ketten zeigen keine signifikanten Einschränkungen. Das Problem könnte anderer Natur sein oder erfordert weitere Diagnostik.';
    diagnosisColor = 'emerald';
  } else if (softwareScore > 0.6) {
    diagnosisType = 'software';
    diagnosisTitle = 'Primär neuronales Muster';
    diagnosisDescription = 'Die deutliche Verbesserung durch Neuro-Drills deutet auf ein primär neuronales/sensomotorisches Problem hin. Das Nervensystem reagiert gut auf neuroplastische Interventionen.';
    diagnosisColor = 'purple';
  } else if (softwareScore < 0.3 && hardwareScore > 0.5) {
    diagnosisType = 'hardware';
    diagnosisTitle = 'Primär fasiziales Problem';
    diagnosisDescription = 'Die minimale Reaktion auf Neuro-Drills bei gleichzeitigen Hardware-Einschränkungen deutet auf strukturelle/fasziale Probleme hin. Manuelle Therapie und Faszienarbeit empfohlen.';
    diagnosisColor = 'blue';
  } else {
    diagnosisType = 'mixed';
    diagnosisTitle = 'Gemischtes Muster';
    diagnosisDescription = 'Es zeigt sich eine Kombination aus faszialen Einschränkungen und neuronalen Faktoren. Ein kombinierter Ansatz aus Faszienarbeit und Neuro-Athletik wird empfohlen.';
    diagnosisColor = 'amber';
  }
  
  // Generate recommendations
  const recommendations = [];
  
  chains.forEach(chain => {
    const hw = hardwareResults[chain.code];
    const sw = softwareResults[chain.code];
    
    if (hw === 'limited' && sw === 'improved') {
      recommendations.push(`${chain.neuro_marker} täglich 2-3x durchführen für ${chain.name_de}`);
    } else if (hw === 'limited' && (sw === 'unchanged' || sw === 'worse')) {
      recommendations.push(`Faszienarbeit/Mobilisation für ${chain.name_de} empfohlen`);
    }
  });
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className={`w-20 h-20 rounded-3xl bg-${diagnosisColor}-100 flex items-center justify-center mx-auto mb-4`}
        >
          {diagnosisType === 'software' && <Brain className={`w-10 h-10 text-${diagnosisColor}-600`} />}
          {diagnosisType === 'hardware' && <Cpu className={`w-10 h-10 text-${diagnosisColor}-600`} />}
          {diagnosisType === 'mixed' && <Activity className={`w-10 h-10 text-${diagnosisColor}-600`} />}
          {diagnosisType === 'clear' && <CheckCircle2 className={`w-10 h-10 text-${diagnosisColor}-600`} />}
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-800">{diagnosisTitle}</h2>
        <p className="text-slate-500 mt-2">Analyse für: {symptom}</p>
      </div>
      
      {/* Diagnosis Gauge */}
      <Card className="p-6 border-0 shadow-lg">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" />
          Diagnose-Spektrum
        </h3>
        <DiagnosisGauge hardwareScore={hardwareScore * 100} softwareScore={softwareScore * 100} />
        <p className="text-sm text-slate-600 mt-4">{diagnosisDescription}</p>
      </Card>
      
      {/* Chain Results */}
      <Card className="p-6 border-0 shadow-lg">
        <h3 className="font-semibold text-slate-800 mb-4">Detaillierte Ergebnisse</h3>
        <div className="space-y-3">
          {chains.map(chain => (
            <ChainResultCard
              key={chain.code}
              chain={chain}
              hardwareResult={hardwareResults[chain.code]}
              softwareResult={softwareResults[chain.code]}
            />
          ))}
        </div>
      </Card>
      
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            Empfehlungen
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 text-slate-700"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                </div>
                {rec}
              </motion.li>
            ))}
          </ul>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onRestart}
          className="flex-1 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Neue Diagnose
        </Button>
        <Button
          onClick={onSave}
          className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Ergebnis speichern
        </Button>
      </div>
    </motion.div>
  );
}