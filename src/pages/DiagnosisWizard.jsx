import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import BodyMap from '../components/diagnosis/BodyMap';
import SymptomSelector from '../components/diagnosis/SymptomSelector';
import SymptomAnalyzer from '../components/diagnosis/SymptomAnalyzer';
import HardwareTest from '../components/diagnosis/HardwareTest';
import NeuroDrill from '../components/diagnosis/NeuroDrill';
import ResultsAnalysis from '../components/diagnosis/ResultsAnalysis';
import { SYMPTOM_CLUSTERS } from '../components/diagnosis/SymptomData';

const STEPS = {
  SYMPTOM: 0,
  HARDWARE: 1,
  SOFTWARE: 2,
  RESULTS: 3
};

export default function DiagnosisWizard() {
  const queryClient = useQueryClient();
  
  // State
  const [currentStep, setCurrentStep] = useState(STEPS.SYMPTOM);
  const [useAIAnalysis, setUseAIAnalysis] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);
  const [hardwareResults, setHardwareResults] = useState({});
  const [softwareResults, setSoftwareResults] = useState({});
  
  // Fetch chains
  const { data: allChains = [], isLoading } = useQuery({
    queryKey: ['fascialChains'],
    queryFn: () => base44.entities.FascialChain.list()
  });
  
  // Get triggered chains - either from AI analysis or from selected region
  const triggeredChainCodes = aiAnalysis?.testedChains || (
    selectedRegion 
      ? SYMPTOM_CLUSTERS[selectedRegion]?.triggered_chains || []
      : []
  );
  
  // If symptom has prio_chain, ensure it's first
  let orderedChainCodes = [...triggeredChainCodes];
  if (selectedSymptom?.prio_chain) {
    orderedChainCodes = [
      selectedSymptom.prio_chain,
      ...triggeredChainCodes.filter(c => c !== selectedSymptom.prio_chain)
    ];
  }
  
  const triggeredChains = allChains.filter(c => orderedChainCodes.includes(c.code))
    .sort((a, b) => orderedChainCodes.indexOf(a.code) - orderedChainCodes.indexOf(b.code));
  const currentChain = triggeredChains[currentChainIndex];
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.DiagnosisSession.create(data),
    onSuccess: () => {
      toast.success('Diagnose gespeichert');
      queryClient.invalidateQueries({ queryKey: ['diagnosisSessions'] });
    }
  });
  
  // Step handlers
  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setSelectedSymptom(null);
  };
  
  const handleSymptomSelect = (symptom) => {
    setSelectedSymptom(symptom);
  };
  
  const startDiagnosis = () => {
    if (selectedRegion && selectedSymptom) {
      setCurrentChainIndex(0);
      setHardwareResults({});
      setSoftwareResults({});
      setCurrentStep(STEPS.HARDWARE);
    }
  };
  
  const handleHardwareResult = (result) => {
    setHardwareResults(prev => ({
      ...prev,
      [currentChain.code]: result
    }));
  };
  
  const handleSoftwareResult = (result) => {
    setSoftwareResults(prev => ({
      ...prev,
      [currentChain.code]: result
    }));
  };
  
  const nextHardwareTest = () => {
    if (currentChainIndex < triggeredChains.length - 1) {
      setCurrentChainIndex(prev => prev + 1);
    } else {
      setCurrentChainIndex(0);
      setCurrentStep(STEPS.SOFTWARE);
    }
  };
  
  const prevHardwareTest = () => {
    if (currentChainIndex > 0) {
      setCurrentChainIndex(prev => prev - 1);
    } else {
      setCurrentStep(STEPS.SYMPTOM);
    }
  };
  
  const nextSoftwareTest = () => {
    if (currentChainIndex < triggeredChains.length - 1) {
      setCurrentChainIndex(prev => prev + 1);
    } else {
      setCurrentStep(STEPS.RESULTS);
    }
  };
  
  const prevSoftwareTest = () => {
    if (currentChainIndex > 0) {
      setCurrentChainIndex(prev => prev - 1);
    } else {
      setCurrentChainIndex(triggeredChains.length - 1);
      setCurrentStep(STEPS.HARDWARE);
    }
  };
  
  const handleAIAnalysisComplete = (data) => {
    setAiAnalysis(data);
    setSelectedSymptom(data.description);
    setCurrentChainIndex(0);
    setHardwareResults({});
    setSoftwareResults({});
    setCurrentStep(STEPS.HARDWARE);
  };

  const handleRestart = () => {
    setCurrentStep(STEPS.SYMPTOM);
    setUseAIAnalysis(false);
    setSelectedRegion(null);
    setSelectedSymptom(null);
    setAiAnalysis(null);
    setCurrentChainIndex(0);
    setHardwareResults({});
    setSoftwareResults({});
  };
  
  const handleSave = () => {
    // Determine diagnosis type
    const hwIssues = Object.values(hardwareResults).filter(r => r === 'limited' || r === 'moderate').length;
    const swImproved = Object.values(softwareResults).filter(r => r === 'improved').length;
    const swTotal = Object.values(softwareResults).filter(r => r !== 'skipped').length;
    
    let diagnosisType = 'unclear';
    if (hwIssues === 0) {
      diagnosisType = 'unclear';
    } else if (swTotal > 0 && swImproved / swTotal > 0.6) {
      diagnosisType = 'software';
    } else if (swTotal > 0 && swImproved / swTotal < 0.3) {
      diagnosisType = 'hardware';
    } else {
      diagnosisType = 'mixed';
    }
    
    saveMutation.mutate({
      symptom_location: selectedRegion,
      symptom_description: selectedSymptom?.label || selectedSymptom,
      tested_chains: orderedChainCodes,
      hardware_results: hardwareResults,
      software_results: softwareResults,
      diagnosis_type: diagnosisType,
      completed: true
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
            Diagnose-Wizard
          </h1>
          <p className="text-slate-400 mt-2">
            Hardware vs. Software – Finde die Ursache deiner Beschwerden
          </p>
        </motion.div>
        
        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="glass rounded-2xl px-6 py-4">
            <div className="flex items-center gap-2">
              {['Symptom', 'Hardware', 'Software', 'Ergebnis'].map((label, index) => (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-2 ${index <= currentStep ? 'text-cyan-400' : 'text-slate-600'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      index < currentStep ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-slate-900 neuro-glow' :
                      index === currentStep ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="hidden sm:inline text-sm font-semibold">{label}</span>
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-1 rounded-full ${index < currentStep ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-slate-700'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <AnimatePresence mode="wait">
          {currentStep === STEPS.SYMPTOM && (
            <motion.div
              key="symptom"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Toggle between Body Map and AI Analysis */}
              <div className="flex justify-center mb-6 gap-3">
                <Button
                  onClick={() => setUseAIAnalysis(false)}
                  variant={!useAIAnalysis ? "default" : "outline"}
                  className={!useAIAnalysis ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white" : ""}
                >
                  Körper-Map
                </Button>
                <Button
                  onClick={() => setUseAIAnalysis(true)}
                  variant={useAIAnalysis ? "default" : "outline"}
                  className={useAIAnalysis ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white" : ""}
                >
                  KI-Analyse
                </Button>
              </div>

              {!useAIAnalysis ? (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-cyan-400 mb-4">
                      Wo hast du Schmerzen?
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                      Klicke auf die Körperregion oder wähle sie aus der Liste
                    </p>
                    <BodyMap 
                      selectedRegion={selectedRegion} 
                      onRegionSelect={handleRegionSelect} 
                    />
                  </div>
                  
                  <div>
                    <SymptomSelector
                      selectedRegion={selectedRegion}
                      selectedSymptom={selectedSymptom}
                      onSymptomSelect={handleSymptomSelect}
                    />
                    
                    {selectedSymptom && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6"
                      >
                        <Button
                          onClick={startDiagnosis}
                          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-12 text-base font-semibold shadow-lg shadow-cyan-500/30 neuro-glow"
                        >
                          Diagnose starten
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <SymptomAnalyzer onAnalysisComplete={handleAIAnalysisComplete} />
                </div>
              )}
            </motion.div>
          )}
          
          {currentStep === STEPS.HARDWARE && currentChain && (
            <motion.div
              key={`hardware-${currentChainIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <HardwareTest
                chain={currentChain}
                chainIndex={currentChainIndex}
                totalChains={triggeredChains.length}
                onResult={handleHardwareResult}
                onNext={nextHardwareTest}
                onBack={prevHardwareTest}
                currentResult={hardwareResults[currentChain.code]}
              />
            </motion.div>
          )}
          
          {currentStep === STEPS.SOFTWARE && currentChain && (
            <motion.div
              key={`software-${currentChainIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <NeuroDrill
                chain={currentChain}
                chainIndex={currentChainIndex}
                totalChains={triggeredChains.length}
                hardwareResult={hardwareResults[currentChain.code]}
                onResult={handleSoftwareResult}
                onNext={nextSoftwareTest}
                onBack={prevSoftwareTest}
                currentResult={softwareResults[currentChain.code]}
              />
            </motion.div>
          )}
          
          {currentStep === STEPS.RESULTS && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResultsAnalysis
                symptom={selectedSymptom?.label || selectedSymptom}
                chains={triggeredChains}
                hardwareResults={hardwareResults}
                softwareResults={softwareResults}
                onRestart={handleRestart}
                onSave={handleSave}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}