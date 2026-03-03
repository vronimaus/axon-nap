import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, Save, LogOut, Trash2, Lock, Dumbbell, Target, Settings, Eye, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error('Not authenticated');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch or create user neuro profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userNeuroProfile', user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const profiles = await base44.entities.UserNeuroProfile.filter({
        user_email: user.email
      });
      if (profiles.length > 0) {
        return profiles[0];
      }
      // Create new profile if doesn't exist
      const newProfile = await base44.entities.UserNeuroProfile.create({
        user_email: user.email
      });
      return newProfile;
    }
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        date_of_birth: profile.date_of_birth || '',
        biological_sex: profile.biological_sex || '',
        activity_level: profile.activity_level || 'lightly_active',
        training_experience: profile.training_experience || 'beginner',
        primary_sport: profile.primary_sport || '',
        training_frequency: profile.training_frequency || '1_2_times_week',
        fitness_goals: profile.fitness_goals || [],
        current_complaints: profile.current_complaints || '',
        injury_history_major: profile.injury_history_major || '',
        scar_tissue_locations: profile.scar_tissue_locations || '',
        hand_dominance: profile.hand_dominance || 'right',
        eye_dominance: profile.eye_dominance || 'right',
        visual_status: profile.visual_status || 'no_correction',
        vestibular_sensitivity: profile.vestibular_sensitivity || 3,
        jaw_tension_history: profile.jaw_tension_history || false,
        primary_posture: profile.primary_posture || 'mostly_sitting',
        baseline_stress_level: profile.baseline_stress_level || 5,
        sleep_quality_avg: profile.sleep_quality_avg || 'medium',
        
      });
    }
  }, [profile]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const cleanData = {
        ...data,
        fitness_goals: Array.isArray(data.fitness_goals) ? data.fitness_goals : [],
        profile_complete: true
      };
      return base44.entities.UserNeuroProfile.update(profile.id, cleanData);
    },
    onSuccess: () => {
      toast.success('Profil gespeichert');
      queryClient.invalidateQueries({ queryKey: ['userNeuroProfile'] });
      queryClient.invalidateQueries({ queryKey: ['neuroProfile'] });
    },
    onError: (error) => {
      console.error('Fehler beim Speichern:', error);
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  });

  const handleSave = () => {
    if (formData) {
      saveMutation.mutate(formData);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    await base44.auth.deleteMe();
    window.location.href = createPageUrl('Landing');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading || profileLoading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Mein Neuro-Passport
          </h1>
          <p className="text-slate-400 mt-2">
            Deine neuro-athletischen Basisdaten für präzise Diagnosen
          </p>
        </motion.div>

        {/* Account Status */}
         <Section title="Account-Status" icon={Lock}>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <FormField
              label="Vollständiger Name"
              type="text"
              value={user?.full_name || ''}
              onChange={(e) => {
                base44.auth.updateMe({ full_name: e.target.value }).then(() => {
                  setUser({ ...user, full_name: e.target.value });
                  toast.success('Name aktualisiert');
                });
              }}
              placeholder="Dein Name"
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="px-4 py-2 rounded-lg bg-slate-800/30 border border-slate-700 text-slate-400">
                {user?.email}
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-lg p-4 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <p className="text-sm text-slate-400 mb-1">Nutzer-Rolle</p>
              <p className="text-lg font-semibold text-cyan-400">
                {user?.role === 'admin' ? 'Admin' : 'Benutzer'}
              </p>
            </div>
            <div className={`rounded-lg p-4 border ${user?.has_paid ? 'glass border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'bg-amber-950/20 border-amber-500/30'}`}>
              <p className="text-sm text-slate-400 mb-1">Zahlungsstatus</p>
              <p className={`text-lg font-semibold ${user?.has_paid ? 'text-green-400' : 'text-amber-400'}`}>
                {user?.has_paid ? '✓ Bezahlt (59€)' : '⏳ 7-Tage Trial'}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {!user?.has_paid && user?.role !== 'admin' && (
              <Button
                onClick={async () => {
                  localStorage.setItem('axon_selected_mode', 'direct');
                  try {
                    const { data } = await base44.functions.invoke('createCheckoutSession', {
                      mode: 'direct',
                      email: user.email
                    });
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (error) {
                    console.error('Checkout error:', error);
                    toast.error('Fehler beim Laden des Checkouts');
                  }
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
              >
                Jetzt freischalten (59€) →
              </Button>
            )}
            {!user?.has_paid && user?.role !== 'admin' && (
              <Button
                onClick={() => {
                  if (window.confirm('Möchtest du deine Testphase wirklich beenden? Du verlierst sofort den Zugriff.')) {
                    base44.auth.updateMe({ trial_start_date: null }).then(() => {
                      toast.success('Testphase beendet');
                      window.location.href = createPageUrl('Landing');
                    });
                  }
                }}
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Testphase beenden
              </Button>
            )}
          </div>
        </Section>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Trainings-Hintergrund */}
          <Section title="Trainings-Hintergrund" icon={Dumbbell}>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
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
              <FormField
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
            </div>
            <FormField
              label="Primäre Sportart (falls vorhanden)"
              type="text"
              value={formData.primary_sport}
              onChange={(e) => handleChange('primary_sport', e.target.value)}
              placeholder="z.B. BJJ, CrossFit, Laufen, Yoga"
            />
            <FormField
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
          </Section>

          {/* Ziele & Beschwerden */}
          <Section title="Ziele & Beschwerden" icon={Target}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Deine Trainingsziele
              </label>
              <div className="space-y-2">
                {['improve_mobility', 'reduce_pain', 'build_strength', 'improve_performance', 'general_fitness', 'recovery'].map(goal => (
                  <label key={goal} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.fitness_goals?.includes(goal) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleChange('fitness_goals', [...(formData.fitness_goals || []), goal]);
                        } else {
                          handleChange('fitness_goals', (formData.fitness_goals || []).filter(g => g !== goal));
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
            <FormField
              label="Aktuelle Beschwerden oder Schmerzen"
              type="textarea"
              value={formData.current_complaints}
              onChange={(e) => handleChange('current_complaints', e.target.value)}
              placeholder="z.B. Knieschmerz beim Hocken, Schulterverspannungen, Rückenschmerz nach langem Sitzen"
            />
          </Section>

          {/* Hardware Basis */}
          <Section title="Meine Hardware" icon={Settings}>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="Geburtsdatum"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
              <FormField
                label="Biologisches Geschlecht"
                type="select"
                value={formData.biological_sex}
                onChange={(e) => handleChange('biological_sex', e.target.value)}
                options={[
                  { value: 'none', label: 'Bitte wählen' },
                  { value: 'male', label: 'Männlich' },
                  { value: 'female', label: 'Weiblich' },
                  { value: 'diverse', label: 'Divers' }
                ]}
              />
            </div>
            <FormField
              label="Verletzungsgeschichte (Major)"
              type="textarea"
              value={formData.injury_history_major}
              onChange={(e) => handleChange('injury_history_major', e.target.value)}
              placeholder="z.B. Schienbeinkantensyndrom 2020, Riss ACL rechts 2018"
            />
            <FormField
              label="Narbengewebe-Lokalisationen"
              type="textarea"
              value={formData.scar_tissue_locations}
              onChange={(e) => handleChange('scar_tissue_locations', e.target.value)}
              placeholder="z.B. Knie-OP rechts, Blinddarm 2015"
            />
          </Section>

          {/* Software Eingänge */}
          <Section title="Meine Sensorik" icon={Eye}>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="Hand-Dominanz"
                type="select"
                value={formData.hand_dominance}
                onChange={(e) => handleChange('hand_dominance', e.target.value)}
                options={[
                  { value: 'left', label: 'Linkshänder' },
                  { value: 'right', label: 'Rechtshänder' }
                ]}
              />
              <FormField
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
            <FormField
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
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="Gleichgewichtssystem-Empfindlichkeit"
                type="range"
                value={formData.vestibular_sensitivity}
                onChange={(e) => handleChange('vestibular_sensitivity', parseInt(e.target.value))}
                min="1"
                max="5"
                displayValue={`${formData.vestibular_sensitivity}/5`}
                help="1 = keine Probleme, 5 = sehr empfindlich (Schwindel, Übelkeit bei Bewegung)"
              />
              <FormField
                label="Zähneknirschen / Spangen-Historie"
                type="checkbox"
                value={formData.jaw_tension_history}
                onChange={(e) => handleChange('jaw_tension_history', e.target.checked)}
                help="Beeinflusst die Nacken- und Kiefermuskulatur"
              />
            </div>
          </Section>

          {/* Kontext & Lifestyle */}
          <Section title="Mein Alltag" icon={Building2}>
            <FormField
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
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="Alltags-Stressniveau"
                type="range"
                value={formData.baseline_stress_level}
                onChange={(e) => handleChange('baseline_stress_level', parseInt(e.target.value))}
                min="1"
                max="10"
                displayValue={`${formData.baseline_stress_level}/10`}
                help="1 = sehr niedrig, 10 = sehr hoch"
              />
              <FormField
                label="Durchschnittliche Schlafqualität"
                type="select"
                value={formData.sleep_quality_avg}
                onChange={(e) => handleChange('sleep_quality_avg', e.target.value)}
                options={[
                  { value: 'poor', label: 'Schlecht (ca. 5,5h)' },
                  { value: 'medium', label: 'Mittelmäßig (ca. 7,5h)' },
                  { value: 'good', label: 'Gut (ca. 8,5h)' }
                ]}
                help="Beeinflusst deine Recovery und mentale Klarheit"
              />
            </div>
          </Section>

          {/* Hardware Metriken */}
          <Section title="Meine Leistungsmetriken" icon={BarChart3}>
            <div className="glass rounded-lg p-4 mb-6 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <div className="flex gap-2 mb-3">
                    <HelpCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-cyan-300">
                      Diese Metriken werden im Dashboard angezeigt und helfen, deine Trainingsfortschritte zu verfolgen.
                    </p>
                  </div>
                </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="HRV Score (Herzfrequenzvariabilität)"
                type="number"
                value={formData.hrv_score}
                onChange={(e) => handleChange('hrv_score', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="z.B. 45"
                help="Misst die Variabilität deines Herzrhythmus in Millisekunden. Höhere Werte = bessere Recovery & Stressresistenz. Nutze ein HRV-Messgerät oder App."
              />
              <FormField
                label="Strength Score (Kraftniveau)"
                type="number"
                value={formData.strength_score}
                onChange={(e) => handleChange('strength_score', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0-100"
                min="0"
                max="100"
                help="Deine subjektive Einschätzung deiner Kraft (0-100%). 0% = sehr schwach, 100% = maximum Kraft."
              />
            </div>
          </Section>
          </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-end gap-3"
        >
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="gap-2 bg-cyan-500 hover:bg-cyan-600 h-12 px-6"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Profil speichern
          </Button>
        </motion.div>

        {/* Delete Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 glass rounded-xl p-6 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.05)] mb-24 md:mb-8"
        >
          <h2 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Account löschen
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Alle deine Daten, Trainingspläne und Fortschritte werden unwiderruflich gelöscht.
          </p>
          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Account löschen
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-red-400">Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Ja, Account löschen
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-400"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.05)]"
    >
      <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}

function FormField({ label, type, value, onChange, placeholder, options, min, max, displayValue, help }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      {help && (
        <p className="text-xs text-slate-400 mb-2">
          {help}
        </p>
      )}
      {type === 'text' && (
         <input
           type="text"
           value={value}
           onChange={onChange}
           placeholder={placeholder}
           className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
         />
       )}
      {type === 'number' && (
        <input
          type="number"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
        />
      )}
      {type === 'date' && (
        <input
          type="date"
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
        />
      )}
      {type === 'textarea' && (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows="3"
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 resize-none"
        />
      )}
      {type === 'select' && (
        <Select value={value} onValueChange={(val) => onChange({ target: { value: val } })}>
          <SelectTrigger className="w-full bg-slate-800/50 border-slate-600 text-white focus:ring-1 focus:ring-cyan-400/30 focus:border-cyan-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            {options?.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-slate-700 focus:text-cyan-400">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {type === 'range' && (
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={onChange}
            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-cyan-400 font-semibold min-w-12 text-right">
            {displayValue}
          </span>
        </div>
      )}
      {type === 'checkbox' && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={onChange}
            className="w-5 h-5 rounded accent-cyan-400"
          />
          <span className="text-slate-400">Ja, zutreffend</span>
        </label>
      )}
    </div>
  );
}