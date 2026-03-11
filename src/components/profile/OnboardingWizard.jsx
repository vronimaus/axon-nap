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
    activity_level: 'lightly_active',
    training_experience: 'beginner',
    primary_sport: '',
    training_frequency: '1_2_times_week',
    fitness_goals: [],
    current_complaints: '',
    injury_history_major: '',
    scar_tissue_locations: '',
    hand_dominance: 'right',
    eye_dominance: 'right',
    visual_status: 'no_correction',
    vestibular_sensitivity: 3,
    jaw_tension_history: false,
    primary_posture: 'mostly_sitting',
    baseline_stress_level: 5,
    sleep_quality_avg: 'medium',
    previous_assessments: [],
    training_preferences: [],
    preferred_coach: 'male'
  });

  const COACHES = [
    {
      id: 'female',
      name: 'Empathetic Guide',
      label: 'Energie & Regeneration',
      vibe: 'Warm · Unterstützend · Sicher',
      url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/90a93629b_EmpatheticGuideAXON-nap.jpg'
    },
    {
      id: 'neuro',
      name: 'Neural Guide',
      label: 'Biologie & System',
      vibe: 'Funktional · Neutral · Futuristisch',
      url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/252797126_NeuralGuideAXON-nap.jpg'
    },
    {
      id: 'male',
      name: 'Systems Architect',
      label: 'Software & Daten',
      vibe: 'Präzise · Klinisch · Analytisch',
      url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/4851700fc_TechnicalSystemsArchitectAXON-nap.jpg'
    }
  ];

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

  const TOTAL_STEPS = 6;

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
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
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= step ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Schritt {step + 1} von 7</p>
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
                Trainings-Hintergrund
              </h2>
              <div className="space-y-4">
                <Field
                  label="Aktivitätslevel"
                  type="select"
                  value={formData.activity_level}
                  onChange={(e) => handleChange('activity_level', e.target.value)}
                  options={[
                    { value: 'sedentary', label: 'Wenig aktiv (Desk-Job)' },
                    { value: 'lightly_active', label: 'Leicht aktiv (1-3x/Woche)' },
                    { value: 'moderately_active', label: 'Moderat aktiv (3-5x/Woche)' },
                    { value: 'very_active', label: 'Sehr aktiv (5-6x/Woche)' },
                    { value: 'athlete', label: 'Athlet (täglich)' }
                  ]}
                />
                <Field
                  label="Trainings-Erfahrung"
                  type="select"
                  value={formData.training_experience}
                  onChange={(e) => handleChange('training_experience', e.target.value)}
                  options={[
                    { value: 'beginner', label: 'Anfänger (< 1 Jahr)' },
                    { value: 'intermediate', label: 'Fortgeschritten (1-3 Jahre)' },
                    { value: 'advanced', label: 'Erfahren (3-10 Jahre)' },
                    { value: 'elite', label: 'Elite (> 10 Jahre)' }
                  ]}
                />
                <Field
                  label="Primäre Sportart (falls vorhanden)"
                  type="text"
                  value={formData.primary_sport}
                  onChange={(e) => handleChange('primary_sport', e.target.value)}
                  placeholder="z.B. BJJ, CrossFit, Laufen, Yoga"
                />
                <Field
                  label="Trainings-Frequenz pro Woche"
                  type="select"
                  value={formData.training_frequency}
                  onChange={(e) => handleChange('training_frequency', e.target.value)}
                  options={[
                    { value: 'none', label: 'Nicht aktiv' },
                    { value: '1_2_times_week', label: '1-2x pro Woche' },
                    { value: '3_4_times_week', label: '3-4x pro Woche' },
                    { value: '5_6_times_week', label: '5-6x pro Woche' },
                    { value: 'daily', label: 'Täglich' }
                  ]}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                Ziele & Beschwerden
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Deine Trainingsziele
                  </label>
                  <div className="space-y-2">
                    {['improve_mobility', 'reduce_pain', 'build_strength', 'improve_performance', 'general_fitness', 'recovery'].map(goal => (
                      <label key={goal} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.fitness_goals.includes(goal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleChange('fitness_goals', [...formData.fitness_goals, goal]);
                            } else {
                              handleChange('fitness_goals', formData.fitness_goals.filter(g => g !== goal));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-slate-300 text-sm">
                          {{
                            'improve_mobility': 'Mobilität verbessern',
                            'reduce_pain': 'Schmerzen reduzieren',
                            'build_strength': 'Kraft aufbauen',
                            'improve_performance': 'Leistung verbessern',
                            'general_fitness': 'Allgemeine Fitness',
                            'recovery': 'Regeneration'
                          }[goal]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <Field
                  label="Aktuelle Beschwerden oder Schmerzen"
                  type="textarea"
                  value={formData.current_complaints}
                  onChange={(e) => handleChange('current_complaints', e.target.value)}
                  placeholder="z.B. Knieschmerz beim Hocken, Schulterverspannungen, Rückenschmerz nach langem Sitzen"
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
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

          {step === 5 && (
            <motion.div
              key="step5"
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
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-semibold text-white mb-2">
                Wähle deinen Coach 🎯
              </h2>
              <p className="text-slate-400 text-sm mb-6">Mit wem fühlst du dich am wohlsten beim Training?</p>
              <div className="grid grid-cols-3 gap-4">
                {COACHES.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => handleChange('preferred_coach', coach.id)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      formData.preferred_coach === coach.id
                        ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <img
                      src={coach.url}
                      alt={coach.name}
                      className="w-full aspect-square object-cover object-top"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent`} />
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                      <p className="text-white text-xs font-bold">{coach.name}</p>
                      <p className="text-slate-400 text-[10px]">{coach.label}</p>
                    </div>
                    {formData.preferred_coach === coach.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-slate-900 text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
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
                {step === 6 ? 'Fertig!' : 'Weiter'}
                {step < 6 && <ChevronRight className="w-4 h-4" />}
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
      {type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
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