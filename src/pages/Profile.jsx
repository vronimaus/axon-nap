import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, Save, AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
        hrv_score: profile.hrv_score || '',
        strength_score: profile.strength_score || ''
      });
    }
  }, [profile]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const cleanData = {
        ...data,
        hrv_score: data.hrv_score ? parseInt(data.hrv_score) : null,
        strength_score: data.strength_score ? parseFloat(data.strength_score) : null,
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
        <Section title="Account-Status" icon="🔐">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-cyan rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Nutzer-Rolle</p>
              <p className="text-lg font-semibold text-cyan-400">
                {user?.role === 'admin' ? 'Admin' : 'Benutzer'}
              </p>
            </div>
            <div className={`rounded-lg p-4 ${user?.has_paid ? 'glass-cyan' : 'bg-amber-900/20 border border-amber-500/30'}`}>
              <p className="text-sm text-slate-400 mb-1">Zahlungsstatus</p>
              <p className={`text-lg font-semibold ${user?.has_paid ? 'text-green-400' : 'text-amber-400'}`}>
                {user?.has_paid ? '✓ Bezahlt (59€)' : '⏳ 7-Tage Trial'}
              </p>
            </div>
          </div>
        </Section>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Hardware Basis */}
          <Section title="Meine Hardware" icon="⚙️">
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
                  { value: '', label: 'Bitte wählen' },
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
          <Section title="Meine Sensorik" icon="👁️">
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
              />
              <FormField
                label="Zähneknirschen / Spangen-Historie"
                type="checkbox"
                value={formData.jaw_tension_history}
                onChange={(e) => handleChange('jaw_tension_history', e.target.checked)}
              />
            </div>
          </Section>

          {/* Kontext & Lifestyle */}
          <Section title="Mein Alltag" icon="🏢">
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
          <Section title="Meine Leistungsmetriken" icon="📊">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
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
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
        <span>{icon}</span>
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
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
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
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
      )}
      {type === 'date' && (
        <input
          type="date"
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        />
      )}
      {type === 'textarea' && (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows="3"
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
        />
      )}
      {type === 'select' && (
        <select
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        >
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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