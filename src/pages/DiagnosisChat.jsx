import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import FocusScreenContainer from '../components/diagnosis/FocusScreenContainer';
import InteractiveBodyMapInput from '../components/diagnosis/InteractiveBodyMapInput';
import DiagnosisLoadingAnimation from '../components/diagnosis/DiagnosisLoadingAnimation';
import SFMAQuickCheck from '../components/diagnosis/SFMAQuickCheck';
import RedFlagResultScreen from '../components/diagnosis/RedFlagResultScreen';

import DailyTuneUpModal from '../components/rehab/DailyTuneUpModal';
import SFMAResultScreen from '../components/diagnosis/SFMAResultScreen';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Steps: body_map → sfma → tune_up | red_flag | generating → done | error
export default function DiagnosisChat() {
  const [searchParams] = useSearchParams();
  const mapDataParam = searchParams.get('mapData');
  const regionParam = searchParams.get('region');
  const initialStep = searchParams.get('step'); // 'sfma' = come from body map


  const [step, setStep] = useState(() => {
    if (mapDataParam && regionParam && initialStep === 'sfma') return 'sfma';
    if (mapDataParam && regionParam) return 'intensity'; // legacy fallback
    return 'body_map';
  });

  const [painMap, setPainMap] = useState(null);
  const [sfmaDecision, setSfmaDecision] = useState(null);
  const [error, setError] = useState(null);
  const [showTuneUp, setShowTuneUp] = useState(false);
  const [user, setUser] = useState(null);
  const [rehabPlan, setRehabPlan] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  // Pre-load map data from URL params
  useEffect(() => {
    if (mapDataParam && regionParam) {
      try {
        const parsed = JSON.parse(mapDataParam);
        setPainMap({ ...parsed, region: regionParam });
      } catch (_e) {
        setStep('body_map');
      }
    }
  }, [mapDataParam, regionParam]);

  // Load existing rehab plan for TuneUp modal
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.RehabPlan.filter({ user_email: user.email, status: 'active' })
      .then(plans => { if (plans.length > 0) setRehabPlan(plans[0]); })
      .catch(() => {});
  }, [user]);

  const archiveOldPlans = async () => {
    try {
      if (!user?.email) return;
      const activePlans = await base44.entities.RehabPlan.filter({ user_email: user.email, status: 'active' });
      await Promise.all(activePlans.map(p => base44.entities.RehabPlan.update(p.id, { status: 'completed' })));
    } catch (_e) {}
  };

  const handleBodyMapSubmit = (mapData) => {
    setPainMap({ ...mapData, region: mapData.region || 'unbekannte Region' });
    setStep('sfma');
  };

  // SFMA Quick Check decision handler
  const handleSFMADecision = (decision) => {
    setSfmaDecision(decision);
    setStep('sfma_result'); // always show result screen first
  };

  const handleResultContinue = () => {
    if (sfmaDecision?.type === 'red_flag') {
      setStep('red_flag');
    } else {
      setShowTuneUp(true);
    }
  };

  // After TuneUp: user can continue to plan generation or go to flow
  const handleTuneUpClose = (outcome) => {
    setShowTuneUp(false);
    if (outcome?.noImprovement) {
      // No improvement → generate rehab plan
      handleGeneratePlan();
    } else {
      // Improvement → go to flow routines
      window.location.href = createPageUrl('FlowRoutines');
    }
  };

  const handleGeneratePlan = async () => {
    setStep('generating');
    setError(null);

    base44.analytics.track({
      eventName: 'diagnosis_started',
      properties: {
        pain_intensity: sfmaDecision?.nrs || 0,
        region: painMap?.region,
        source: 'sfma_flow'
      }
    });

    await archiveOldPlans();

    try {
      const diagSession = await base44.entities.DiagnosisSession.create({
        symptom_location: painMap?.region || 'unbekannte Region',
        symptom_description: '',
        tested_chains: [],
        hardware_results: {},
        software_results: {},
        diagnosis_type: 'mixed',
        recommendations: [],
        completed: false
      });

      const response = await base44.functions.invoke('generateRehabPlan', {
        diagnosis_session_id: diagSession.id,
        problem_summary: `Schmerzen im Bereich: ${painMap?.region || 'unbekannte Region'}`,
        region: painMap?.region || 'unbekannte Region',
        pain_intensity: sfmaDecision?.nrs || 5,
        affected_chains: '',
        feedback_summary: 'Tune-Up hat keine ausreichende Verbesserung gebracht.'
      });

      if (response.data?.plan_id || response.data?.success) {
        setStep('done');
      } else {
        throw new Error(response.data?.error || 'Plan konnte nicht erstellt werden');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unbekannter Fehler');
      setStep('error');
    }
  };

  // ── BODY MAP ────────────────────────────────────────────────────────────────
  if (step === 'body_map') {
    return (
      <FocusScreenContainer
        title="Wo tut es weh?"
        instruction="Tippe auf die exakte Stelle oder zeichne eine Linie entlang des Schmerzes"
        showBackButton={false}
      >
        <InteractiveBodyMapInput onSubmit={handleBodyMapSubmit} />
      </FocusScreenContainer>
    );
  }

  // ── SFMA QUICK CHECK ────────────────────────────────────────────────────────
  if (step === 'sfma') {
    return (
      <FocusScreenContainer
        title="Kurz-Check"
        instruction={`Schmerzbereich: ${painMap?.region || '—'}`}
        showBackButton={false}
      >
        <SFMAQuickCheck
          region={painMap?.region || 'unbekannte Region'}
          onDecision={handleSFMADecision}
        />

        {/* TuneUp Modal opens on top */}
        {showTuneUp && (
          <DailyTuneUpModal
            isOpen={showTuneUp}
            onClose={handleTuneUpClose}
            rehabPlan={rehabPlan}
            user={user}
            region={painMap?.region}
          />
        )}
      </FocusScreenContainer>
    );
  }

  // ── SFMA RESULT SCREEN ──────────────────────────────────────────────────────
  if (step === 'sfma_result') {
    return (
      <FocusScreenContainer
        title="Deine Analyse"
        instruction={`Schmerzbereich: ${painMap?.region || '—'}`}
        showBackButton={false}
      >
        <SFMAResultScreen
          region={painMap?.region || 'unbekannte Region'}
          type={sfmaDecision?.symptomType || 'schmerz'}
          nrs={sfmaDecision?.nrs || 0}
          stiffness_level={sfmaDecision?.stiffness_level || null}
          isRedFlag={sfmaDecision?.type === 'red_flag'}
          onContinue={handleResultContinue}
        />
        {showTuneUp && (
          <DailyTuneUpModal
            isOpen={showTuneUp}
            onClose={handleTuneUpClose}
            rehabPlan={rehabPlan}
            user={user}
            region={painMap?.region}
          />
        )}
      </FocusScreenContainer>
    );
  }

  // ── RED FLAG RESULT ─────────────────────────────────────────────────────────
  if (step === 'red_flag') {
    return (
      <FocusScreenContainer
        title="Sicherheitsprotokoll"
        instruction="Wir haben wichtige Muster erkannt"
        showBackButton={false}
      >
        <RedFlagResultScreen
          region={painMap?.region || 'unbekannte Region'}
          nrs={sfmaDecision?.nrs || 7}
          flags={sfmaDecision?.flags || []}
          onGoToDiagnosis={handleGeneratePlan}
        />
      </FocusScreenContainer>
    );
  }

  // ── GENERATING ──────────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <FocusScreenContainer
        title="Dein Reha-Plan wird erstellt"
        instruction="Wir analysieren dein Problem und erstellen einen personalisierten 3-Phasen-Plan..."
        showBackButton={false}
      >
        <DiagnosisLoadingAnimation message="Analysiere Faszien-Ketten & erstelle deinen Plan..." />
      </FocusScreenContainer>
    );
  }

  // ── ERROR ───────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <FocusScreenContainer
        title="Fehler beim Erstellen"
        instruction="Es gab ein Problem. Bitte versuche es erneut."
        showBackButton={false}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto text-center space-y-6"
        >
          <div className="glass rounded-2xl p-6 border border-red-500/30">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-slate-300 text-sm">{error}</p>
          </div>
          <Button
            onClick={() => setStep('sfma')}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold"
          >
            Erneut versuchen
          </Button>
        </motion.div>
      </FocusScreenContainer>
    );
  }

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <FocusScreenContainer
        title="Plan erstellt"
        instruction="Dein personalisierter 3-Phasen-Plan ist bereit."
        showBackButton={false}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto space-y-4"
        >
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <p className="text-[10px] font-bold tracking-widest uppercase text-white">AXON-nap Reha-Protokoll</p>
              <span className="ml-auto text-[9px] font-mono text-emerald-400 tracking-widest uppercase">Bereit</span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-400 text-sm leading-relaxed">
                Schmerzbereich: <span className="text-cyan-400 font-mono">{painMap?.region}</span>
              </p>
              <div className="space-y-2">
                {[
                  { phase: 'Phase 1', label: 'Akut-Linderung' },
                  { phase: 'Phase 2', label: 'Aufbau & Stabilität' },
                  { phase: 'Phase 3', label: 'Integration & Prävention' },
                ].map(({ phase, label }) => (
                  <div key={phase} className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3">
                    <span className="text-[10px] font-bold tracking-widest text-cyan-400 font-mono uppercase">{phase}</span>
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = createPageUrl('RehabPlan')}
            className="w-full h-12 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold tracking-widest uppercase text-sm"
          >
            Zum Reha-Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </FocusScreenContainer>
    );
  }

  return null;
}