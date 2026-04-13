import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ChevronRight, X } from 'lucide-react';

// Body region → Stecco Node mapping
const BODY_REGIONS = [
  { label: 'Kopf / Kiefer',         icon: '🧠', nodes: ['CP-P'] },
  { label: 'Nacken',                 icon: '🔝', nodes: ['CP-P', 'TH-P'] },
  { label: 'Schulter',               icon: '🤷', nodes: ['TH-A', 'TH-P'] },
  { label: 'Brust / Thorax',         icon: '💢', nodes: ['TH-A'] },
  { label: 'Ellenbogen / Unterarm',  icon: '💪', nodes: ['PE-A'] },
  { label: 'Lendenwirbel / Rücken',  icon: '⚡', nodes: ['LU-P'] },
  { label: 'Hüfte',                  icon: '🦵', nodes: ['LU-A', 'CX-A'] },
  { label: 'Gesäß / Glute',          icon: '🍑', nodes: ['CX-P'] },
  { label: 'Knie',                   icon: '🦿', nodes: ['GE-A', 'GE-P'] },
  { label: 'Wade / Schienbein',      icon: '🦶', nodes: ['TA-A', 'TA-P'] },
  { label: 'Fuß / Knöchel',          icon: '👟', nodes: ['PE-A'] },
];

const SLIDER_CONFIG = [
  {
    key: 'feeling_hardware',
    label: 'Körpergefühl',
    sub: 'Wie fühlt sich dein Körper an?',
    left: '😤 Steif & eingerostet',
    right: '🌊 Geschmeidig & frei',
    color: 'cyan',
  },
  {
    key: 'focus_software',
    label: 'Mentaler Fokus',
    sub: 'Wie klar ist dein Kopf?',
    left: '😴 Müde & Tunnelblick',
    right: '⚡ Hellwach & klar',
    color: 'purple',
  },
  {
    key: 'energy_battery',
    label: 'Energie',
    sub: 'Wie voll ist deine Batterie?',
    left: '🪫 Leer',
    right: '🔋 Volle Kraft',
    color: 'emerald',
  },
];

function calcReadiness(values) {
  const avg = (values.feeling_hardware + values.focus_software + values.energy_battery) / 3;
  const minVal = Math.min(values.feeling_hardware, values.focus_software, values.energy_battery);
  let status = 'green';
  if (avg < 4 || minVal <= 2) status = 'red';
  else if (avg < 6.5 || minVal <= 4) status = 'yellow';
  return { status, score: Math.round(avg * 10) / 10 };
}

export default function CombinedReadinessAssessment({ user, destinationLabel, onComplete, onSkip }) {
  const [step, setStep] = useState(1); // 1 = sliders, 2 = body regions
  const [values, setValues] = useState({ feeling_hardware: 5, focus_software: 5, energy_battery: 5 });
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleRegion = (label) => {
    setSelectedRegions(prev =>
      prev.includes(label) ? prev.filter(r => r !== label) : [...prev, label]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const { status, score } = calcReadiness(values);

    // Save ReadinessCheck
    await base44.entities.ReadinessCheck.create({
      user_email: user.email,
      feeling_hardware: values.feeling_hardware,
      focus_software: values.focus_software,
      energy_battery: values.energy_battery,
      readiness_status: status,
      readiness_score: score,
      check_date: today,
    });

    // Update complaint_history in UserNeuroProfile if regions selected
    if (selectedRegions.length > 0) {
      const profiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
      const newComplaints = selectedRegions.map(label => {
        const region = BODY_REGIONS.find(r => r.label === label);
        return {
          date: today,
          location: label,
          intensity: 5,
          description: `Daily Check-in: ${label}`,
          status: 'active',
          stecco_nodes: region?.nodes || [],
        };
      });

      if (profiles.length > 0) {
        const existing = profiles[0].complaint_history || [];
        // Remove old "active" entries for same locations, then add new
        const filtered = existing.filter(c =>
          c.status !== 'active' || !selectedRegions.includes(c.location)
        );
        await base44.entities.UserNeuroProfile.update(profiles[0].id, {
          complaint_history: [...filtered, ...newComplaints],
        });
      } else {
        await base44.entities.UserNeuroProfile.create({
          user_email: user.email,
          complaint_history: newComplaints,
        });
      }
    }

    sessionStorage.setItem('readiness_check_done', today);
    setSaving(false);
    onComplete({ status, score, selectedRegions });
  };

  const colorMap = {
    cyan: { track: 'accent-cyan-400', text: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    purple: { track: 'accent-purple-400', text: 'text-purple-400', bg: 'bg-purple-500/20' },
    emerald: { track: 'accent-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              {step === 1 ? 'Schritt 1 / 2 · System-Check' : 'Schritt 2 / 2 · Körperscan'}
            </p>
            <h2 className="text-base font-black text-white mt-0.5">
              {step === 1
                ? `Damit wir dich für "${destinationLabel}" optimal vorbereiten…`
                : 'Gibt es heute Einschränkungen?'}
            </h2>
          </div>
          <button onClick={onSkip} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Sliders ── */}
            {step === 1 && (
              <motion.div key="sliders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                {SLIDER_CONFIG.map(cfg => {
                  const c = colorMap[cfg.color];
                  return (
                    <div key={cfg.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold ${c.text}`}>{cfg.label}</span>
                        <span className={`text-sm font-black ${c.text} ${c.bg} px-2 py-0.5 rounded-lg`}>
                          {values[cfg.key]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{cfg.sub}</p>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={values[cfg.key]}
                        onChange={e => setValues(v => ({ ...v, [cfg.key]: Number(e.target.value) }))}
                        className={`w-full h-2 rounded-full appearance-none bg-slate-700 cursor-pointer ${c.track}`}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-500">{cfg.left}</span>
                        <span className="text-[10px] text-slate-500">{cfg.right}</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Step 2: Body Regions ── */}
            {step === 2 && (
              <motion.div key="regions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Wähle alle Regionen aus, die sich heute eingeschränkt, steif oder schmerzhaft anfühlen. (Optional)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {BODY_REGIONS.map(region => {
                    const isSelected = selectedRegions.includes(region.label);
                    return (
                      <button
                        key={region.label}
                        onClick={() => toggleRegion(region.label)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-base flex-shrink-0">{region.icon}</span>
                        <span className="leading-tight text-xs">{region.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setSelectedRegions([])}
                  className="mt-3 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Keine Einschränkungen heute ✓
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-800">
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-black font-black rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Weiter <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-black font-black rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {saving ? 'Speichert…' : `Los geht's → ${destinationLabel}`}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}