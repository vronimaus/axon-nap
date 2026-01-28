import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDemoTimer } from '../components/demo/useDemoTimer';

import RedFlagScreen from '../components/diagnosis/RedFlagScreen';
import BodyMap from '../components/diagnosis/BodyMap';
import SymptomSelector from '../components/diagnosis/SymptomSelector';
import FootFilter from '../components/diagnosis/FootFilter';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BreathModule from '../components/diagnosis/BreathModule';
import HardwareTest from '../components/diagnosis/HardwareTest';
import NeuroDrill from '../components/diagnosis/NeuroDrill';
import ResultsAnalysis from '../components/diagnosis/ResultsAnalysis';
import { SYMPTOM_CLUSTERS } from '../components/diagnosis/SymptomData';

const STEPS = {
  REDFLAGS: -1,
  SYMPTOM: 0,
  SYMPTOM_SELECT_ONLY: 0.5,
  FOOT_CHECK: 1,
  BREATH_CHECK: 2,
  HARDWARE: 3,
  SOFTWARE: 4,
  RESULTS: 5
};

export default function DiagnosisWizard() {
   const queryClient = useQueryClient();
   const { isDemoExpired, isLoading: demoLoading, formattedTime } = useDemoTimer();

   // Get region from URL params
   const urlParams = new URLSearchParams(window.location.search);
   const initialRegion = urlParams.get('region');

   // State
   const [currentStep, setCurrentStep] = useState(STEPS.REDFLAGS);
   const [selectedRegion, setSelectedRegion] = useState(initialRegion || null);
   const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);
  const [hardwareResults, setHardwareResults] = useState({});
  const [softwareResults, setSoftwareResults] = useState({});
  const [footCheckData, setFootCheckData] = useState(null);
  const [needsFootCheck, setNeedsFootCheck] = useState(false);
  const [breathCheckData, setBreathCheckData] = useState(null);
  const [needsBreathCheck, setNeedsBreathCheck] = useState(false);
  
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
      
      // Check if foot filter is needed for standing symptoms
      const standingRegions = ['ruecken', 'knie', 'huefte', 'hals_nacken', 'lws', 'beine', 'fuss'];
      const needsFoot = standingRegions.includes(selectedRegion);
      
      // Check if breath module is needed
      const breathRegions = ['hals_nacken', 'lws', 'rumpf', 'systemisch'];
      const needsBreath = breathRegions.includes(selectedRegion);
      
      setNeedsFootCheck(needsFoot);
      setNeedsBreathCheck(needsBreath);
      
      if (needsFoot) {
        setCurrentStep(STEPS.FOOT_CHECK);
      } else if (needsBreath) {
        setCurrentStep(STEPS.BREATH_CHECK);
      } else {
        setCurrentStep(STEPS.HARDWARE);
      }
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
    } else if (needsBreathCheck) {
      setCurrentStep(STEPS.BREATH_CHECK);
    } else if (needsFootCheck) {
      setCurrentStep(STEPS.FOOT_CHECK);
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
    
    // Use AI-determined filters from step2_filters
    const needsFootFilter = data.analysis?.step2_filters?.needs_foot_check || false;
    const needsBreathFilter = data.analysis?.step2_filters?.needs_breath_work || false;
    
    setNeedsFootCheck(needsFootFilter);
    setNeedsBreathCheck(needsBreathFilter);
    
    if (needsFootFilter) {
      setCurrentStep(STEPS.FOOT_CHECK);
    } else if (needsBreathFilter) {
      setCurrentStep(STEPS.BREATH_CHECK);
    } else {
      setCurrentStep(STEPS.HARDWARE);
    }
  };

  const handleFootCheckComplete = (data) => {
    setFootCheckData(data);
    if (needsBreathCheck) {
      setCurrentStep(STEPS.BREATH_CHECK);
    } else {
      setCurrentStep(STEPS.HARDWARE);
    }
  };

  const handleFootCheckSkip = () => {
    setFootCheckData({ skipped: true });
    if (needsBreathCheck) {
      setCurrentStep(STEPS.BREATH_CHECK);
    } else {
      setCurrentStep(STEPS.HARDWARE);
    }
  };

  const handleBreathCheckComplete = (data) => {
    setBreathCheckData(data);
    setCurrentStep(STEPS.HARDWARE);
  };

  const handleBreathCheckSkip = () => {
    setBreathCheckData({ skipped: true });
    setCurrentStep(STEPS.HARDWARE);
  };

  const handleRestart = () => {
    setCurrentStep(STEPS.REDFLAGS);
    setSelectedRegion(null);
    setSelectedSymptom(null);
    setAiAnalysis(null);
    setCurrentChainIndex(0);
    setHardwareResults({});
    setSoftwareResults({});
    setFootCheckData(null);
    setNeedsFootCheck(false);
    setBreathCheckData(null);
    setNeedsBreathCheck(false);
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
      foot_check_data: footCheckData,
      breath_check_data: breathCheckData,
      diagnosis_type: diagnosisType,
      completed: true
    }, {
      onSuccess: (data) => {
        // Redirect to Detective Chat with session ID for refinement
        window.location.href = createPageUrl(`DiagnosisChat?session_id=${data.id}`);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Deep Charcoal Overlay */}
      <div className="absolute inset-0 bg-[#0D0D0D] opacity-20 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
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
        
        {/* Step Indicator - Thin Glowing Cyan Line */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="h-0.5 bg-slate-900 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              {(() => {
                const steps = ['Symptom'];
                if (needsFootCheck) steps.push('Fuß');
                if (needsBreathCheck) steps.push('Atmung');
                steps.push('Hardware', 'Software', 'Ergebnis');
                return steps;
              })().map((label, index) => (
                <span key={label} className={index === currentStep ? 'text-cyan-400 font-semibold' : ''}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <AnimatePresence mode="wait">
          {currentStep === STEPS.REDFLAGS && (
            <RedFlagScreen
              onContinue={() => setCurrentStep(STEPS.SYMPTOM)}
            />
          )}

          {currentStep === STEPS.SYMPTOM && (
            <motion.div
              key="symptom"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
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
                      className="mt-6 space-y-3"
                    >
                      <button
                        onClick={startDiagnosis}
                        className="w-full px-6 py-3 rounded-xl border-2 border-cyan-400 bg-transparent text-cyan-400 font-bold tracking-wider hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all"
                      >
                        INITIALIZE SCAN
                      </button>

                      <Link to={createPageUrl('DiagnosisChat')}>
                        <Button
                          variant="outline"
                          className="w-full h-12 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                        >
                          💬 Zum intelligenten Chat-Assistenten
                        </Button>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === STEPS.FOOT_CHECK && (
            <motion.div
              key="foot-check"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FootFilter
                onComplete={handleFootCheckComplete}
                onSkip={handleFootCheckSkip}
              />
            </motion.div>
          )}

          {currentStep === STEPS.BREATH_CHECK && (
            <motion.div
              key="breath-check"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <BreathModule
                symptomType={selectedRegion}
                onComplete={handleBreathCheckComplete}
                onSkip={handleBreathCheckSkip}
              />
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
                footCheckData={footCheckData}
                breathCheckData={breathCheckData}
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