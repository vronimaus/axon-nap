import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle2, Target, Zap } from 'lucide-react';

// Recommendation Engine
const generateRecommendations = (profile) => {
  if (!profile) return null;

  const recs = {
    assessment: [],
    framework: [],
    routine: '',
    reasoning: ''
  };

  // Assessment basierend auf Activity Level
  if (profile.activity_level === 'sedentary') {
    recs.assessment.push('FMS Screening (Gray Cook)');
    recs.reasoning = 'Deine Bewegungsmuster sind eingerostet – FMS findet die Dysfunktionen';
  } else if (profile.activity_level === 'very_active' || profile.activity_level === 'athlete') {
    recs.assessment.push('Gary Gray 3DMAPS');
    recs.reasoning = 'Du brauchst fortgeschrittene Analyse deiner 3D-Bewegungen';
  } else {
    recs.assessment.push('Hybrid Assessment (FMS + Gary Gray)');
  }

  // Framework basierend auf Goals
  if (profile.fitness_goals?.includes('reduce_pain')) {
    recs.framework.push('Stecco Hardware-Diagnose');
    recs.framework.push('Neuro-Drills (neurologische Kalibrierung)');
  }

  if (profile.fitness_goals?.includes('build_strength')) {
    recs.framework.push('Pavel Strength Protocol');
    recs.framework.push('Easy Strength 5x5');
  }

  if (profile.fitness_goals?.includes('improve_performance')) {
    recs.framework.push('Gary Gray 3DMAPS Integration');
    recs.framework.push('Vern Gambetta Athletic Development');
  }

  if (profile.fitness_goals?.includes('improve_mobility')) {
    recs.framework.push('Stecco Fascial Release');
    recs.framework.push('FMS Mobility Progression');
  }

  // Routine basierend auf Activity Level + Goals
  if (profile.activity_level === 'sedentary' && profile.fitness_goals?.includes('reduce_pain')) {
    recs.routine = '10-Min "Desk Detox" (täglich) + 1x/Woche 30-Min Deep Reset';
  } else if (profile.activity_level === 'very_active' || profile.activity_level === 'athlete') {
    recs.routine = '20-Min "Full System" (5-6x/Woche) + Sport-Spezifische Drills';
  } else {
    recs.routine = '15-Min "Standard Flow" (3-4x/Woche)';
  }

  // Special considerations
  if (profile.current_complaints) {
    recs.reasoning += ` | Spezial-Fokus: "${profile.current_complaints}"`;
  }

  if (profile.injury_history_major) {
    recs.reasoning += ` | Alte Verletzung: ${profile.injury_history_major}`;
  }

  return recs;
};

export default function ProfileComparison() {
  const { data: profiles = {}, isLoading } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: async () => {
      const sandra = await base44.entities.UserNeuroProfile.filter({ user_email: 'sandra@test.axon.local' });
      const alex = await base44.entities.UserNeuroProfile.filter({ user_email: 'alex@test.axon.local' });
      return {
        sandra: sandra[0] || null,
        alex: alex[0] || null
      };
    }
  });

  const sandraRecs = generateRecommendations(profiles.sandra);
  const alexRecs = generateRecommendations(profiles.alex);

  const ProfileCard = ({ profile, recs, title, emoji }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="bg-slate-800/50 border-cyan-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{emoji}</span>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400">{profile?.user_email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-6 pb-6 border-b border-slate-700">
          <div>
            <p className="text-slate-400">Activity Level</p>
            <p className="font-semibold text-cyan-400">{profile?.activity_level || '-'}</p>
          </div>
          <div>
            <p className="text-slate-400">Experience</p>
            <p className="font-semibold text-cyan-400">{profile?.training_experience || '-'}</p>
          </div>
          <div>
            <p className="text-slate-400">Frequency</p>
            <p className="font-semibold text-cyan-400">{profile?.training_frequency || '-'}</p>
          </div>
          <div>
            <p className="text-slate-400">Sport</p>
            <p className="font-semibold text-cyan-400">{profile?.primary_sport || 'keine'}</p>
          </div>
        </div>

        {/* Goals */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Ziele
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile?.fitness_goals?.map(goal => (
              <span key={goal} className="px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300">
                {goal.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Complaints */}
        {profile?.current_complaints && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-300">
              <strong>Beschwerden:</strong> {profile.current_complaints}
            </p>
          </div>
        )}

        {/* Injury History */}
        {profile?.injury_history_major && (
          <div className="mb-6 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <p className="text-sm text-orange-300">
              <strong>Verletzung:</strong> {profile.injury_history_major}
            </p>
          </div>
        )}
      </Card>

      {/* Recommendations */}
      {recs && (
        <div className="space-y-4">
          {/* Assessment */}
          <Card className="bg-gradient-to-r from-cyan-500/10 to-transparent border-cyan-500/30 p-4">
            <h4 className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Assessment
            </h4>
            <ul className="space-y-1">
              {recs.assessment.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Frameworks */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/30 p-4">
            <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Frameworks
            </h4>
            <ul className="space-y-1">
              {recs.framework.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Routine */}
          <Card className="bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30 p-4">
            <h4 className="font-bold text-amber-400 mb-2">Empfohlene Routine</h4>
            <p className="text-sm text-slate-300">{recs.routine}</p>
          </Card>

          {/* Reasoning */}
          {recs.reasoning && (
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <p className="text-sm text-slate-300 italic">{recs.reasoning}</p>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  );

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Profile Comparison Test</h1>
          <p className="text-slate-400">
            Unterschiedliche Profile → Unterschiedliche Empfehlungen
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Sandra */}
          <ProfileCard
            profile={profiles.sandra}
            recs={sandraRecs}
            title="Sandra"
            emoji="👩‍💼"
          />

          {/* Alex */}
          <ProfileCard
            profile={profiles.alex}
            recs={alexRecs}
            title="Alex"
            emoji="🥋"
          />
        </div>

        {/* Comparison Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Der Unterschied</h3>
            <div className="space-y-4 text-slate-300">
              <p>
                <strong className="text-cyan-400">Sandra</strong> (sedentary, reduce_pain) → beginnt mit FMS Screening + Stecco Hardware-Diagnose, langsame Progression
              </p>
              <p>
                <strong className="text-cyan-400">Alex</strong> (very_active, build_strength) → beginnt mit 3DMAPS + Pavel Strength, höhere Intensität
              </p>
              <p className="text-sm text-slate-400 italic">
                Das ist die Kraft der Personalisierung: Das System passt sich an **dein** Profil an, nicht umgekehrt.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}