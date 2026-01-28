import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    date_of_birth: '',
    biological_sex: '',
    injury_history_major: '',
    scar_tissue_locations: '',
    hand_dominance: 'right',
    eye_dominance: 'right',
    visual_status: 'no_correction',
    vestibular_sensitivity: 3,
    jaw_tension_history: false,
    primary_posture: 'mostly_sitting',
    baseline_stress_level: 5,
    sleep_quality_avg: 'medium'
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.UserNeuroProfile.create({
        user_email: user.email,
        ...data,
        profile_complete: true
      });
    },
    onSuccess: () => {
      toast.success('Profil erstellt!');
      onComplete?.();
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      createProfileMutation.mutate(formData);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    // Create minimal profile
    createProfileMutation.mutate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl max-w-2xl w-full border border-cyan-500/20 p-8"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">
            Willkommen zu AXON! 🧠
          </h1>
          <p className="text-slate-400">
            Lass uns dein Profil erstellen für präzisere Diagnosen.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= step ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Schritt {step + 1} von 3</p>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                Basisdaten
              </h2>
              <div className="space-y-4">
                <Field
                  label="Geburtsdatum"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                />
                <Field
                  label="Biologisches Geschlecht"
                  type="select"
                  value={formData.biological_sex}
                  onChange={(e) => handleChange('biological_sex', e.target.value)}
                  options={[
                    { value: '', label: 'Bitte wählen' },
                    { value: 'male', label: 'Männlich' },
                    { value: 'female', label: 'Weiblich' },
                    { value: 'diverse', label: 'Divers' }
                  ]}
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                Verletzungen & Narben
              </h2>
              <div className="space-y-4">
                <Field
                  label="Historische Verletzungen"
                  type="textarea"
                  value={formData.injury_history_major}
                  onChange={(e) => handleChange('injury_history_major', e.target.value)}
                  placeholder="z.B. Schienbeinkantensyndrom 2020, ACL-Riss rechts 2018"
                />
                <Field
                  label="Narbengewebe-Lokalisationen"
                  type="textarea"
                  value={formData.scar_tissue_locations}
                  onChange={(e) => handleChange('scar_tissue_locations', e.target.value)}
                  placeholder="z.B. Knie-OP rechts, Blinddarm 2015"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                Sensorik & Alltag
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Hand-Dominanz"
                    type="select"
                    value={formData.hand_dominance}
                    onChange={(e) => handleChange('hand_dominance', e.target.value)}
                    options={[
                      { value: 'left', label: 'Linkshänder' },
                      { value: 'right', label: 'Rechtshänder' }
                    ]}
                  />
                  <Field
                    label="Augen-Dominanz"
                    type="select"
                    value={formData.eye_dominance}
                    onChange={(e) => handleChange('eye_dominance', e.target.value)}
                    options={[
                      { value: 'left', label: 'Linkes Auge' },
                      { value: 'right', label: 'Rechtes Auge' }
                    ]}
                  />
                </div>
                <Field
                  label="Sehkorrektion"
                  type="select"
                  value={formData.visual_status}
                  onChange={(e) => handleChange('visual_status', e.target.value)}
                  options={[
                    { value: 'no_correction', label: 'Keine Korrektur' },
                    { value: 'glasses', label: 'Brille' },
                    { value: 'contacts', label: 'Kontaktlinsen' },
                    { value: 'lasered', label: 'Laser-OP' }
                  ]}
                />
                <Field
                  label="Primäre Körperhaltung"
                  type="select"
                  value={formData.primary_posture}
                  onChange={(e) => handleChange('primary_posture', e.target.value)}
                  options={[
                    { value: 'mostly_sitting', label: 'Überwiegend sitzend' },
                    { value: 'mostly_standing', label: 'Überwiegend stehend' },
                    { value: 'very_active', label: 'Sehr aktiv' }
                  ]}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Buttons */}
        <div className="mt-8 flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={step > 0 ? handlePrev : handleSkip}
            className="border-slate-600"
            disabled={createProfileMutation.isPending}
          >
            {step > 0 ? (
              <>
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </>
            ) : (
              'Überspringen'
            )}
          </Button>
          <Button
            onClick={handleNext}
            className="bg-cyan-500 hover:bg-cyan-600 gap-2"
            disabled={createProfileMutation.isPending}
          >
            {createProfileMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {step === 2 ? 'Fertig!' : 'Weiter'}
                {step < 2 && <ChevronRight className="w-4 h-4" />}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, type, value, onChange, placeholder, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      {type === 'date' && (
        <input
          type="date"
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-sm"
        />
      )}
      {type === 'select' && (
        <select
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-sm"
        >
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      {type === 'textarea' && (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows="2"
          className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm resize-none"
        />
      )}
    </div>
  );
}