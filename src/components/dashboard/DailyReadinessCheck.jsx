import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Zap, AlertCircle, Moon, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyReadinessCheck({ user, onClose }) {
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [hrv, setHrv] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateReadiness = () => {
    const avgScore = (energy + (10 - stress) + sleep) / 3;
    
    if (avgScore > 7.5) return { status: 'green', score: avgScore };
    if (avgScore >= 4) return { status: 'yellow', score: avgScore };
    return { status: 'red', score: avgScore };
  };

  const { status, score } = calculateReadiness();

  const statusConfig = {
    green: {
      title: 'Du bist im Angriffsmodus! 🎯',
      message: 'Dein System ist bereit. Zeit für den nächsten Meilenstein!',
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/40',
      textColor: 'text-green-400',
      mode: 'goals'
    },
    yellow: {
      title: 'Stabil, aber nicht bei 100% 🛡️',
      message: 'Lass uns dein System heute pflegen. Body Journey ist dein Fokus.',
      color: 'from-amber-500/20 to-yellow-500/20',
      borderColor: 'border-amber-500/40',
      textColor: 'text-amber-400',
      mode: 'flow'
    },
    red: {
      title: 'Akku ist kritisch 🔴',
      message: 'Heute: Entspannung & Schmerz-Release. Dein Körper braucht Recovery.',
      color: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/40',
      textColor: 'text-red-400',
      mode: 'rehab'
    }
  };

  const config = statusConfig[status];

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      await base44.entities.ReadinessCheck.create({
        user_email: user.email,
        energy_level: energy,
        stress_level: stress,
        sleep_quality: sleep,
        hrv_value: hrv ? parseInt(hrv) : null,
        readiness_status: status,
        readiness_score: Math.round(score * 10) / 10,
        check_date: today
      });

      // Update user metadata with today's readiness
      await base44.auth.updateMe({
        daily_readiness_status: status,
        daily_readiness_mode: config.mode,
        last_readiness_check: today
      });

      toast.success('Daily Check gespeichert!');
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl border border-cyan-500/20 max-w-2xl w-full p-8 bg-slate-900/80"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Daily Ready-Check ⚡</h1>
          <p className="text-slate-400">Wie geht es dir heute? (15 Sekunden)</p>
        </div>

        {/* Sliders */}
        <div className="space-y-6 mb-8">
          {/* Energy */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <label className="text-white font-semibold">Energie-Level</label>
              <span className="text-cyan-400 font-bold ml-auto">{energy}/10</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">1 = platt, 10 = Supermann</p>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
          </div>

          {/* Stress */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <label className="text-white font-semibold">Stress-Level</label>
              <span className="text-cyan-400 font-bold ml-auto">{stress}/10</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">1 = Zen-Meister, 10 = Burnout</p>
            <input
              type="range"
              min="1"
              max="10"
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-400"
            />
          </div>

          {/* Sleep */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Moon className="w-5 h-5 text-blue-400" />
              <label className="text-white font-semibold">Schlafqualität letzte Nacht</label>
              <span className="text-cyan-400 font-bold ml-auto">{sleep}/10</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">1 = furchtbar, 10 = perfekt</p>
            <input
              type="range"
              min="1"
              max="10"
              value={sleep}
              onChange={(e) => setSleep(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
            />
          </div>

          {/* HRV Optional */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-5 h-5 text-pink-400" />
              <label className="text-white font-semibold">HRV-Wert (optional)</label>
            </div>
            <p className="text-xs text-slate-400 mb-3">In Millisekunden (ms) — leer lassen, falls nicht verfügbar</p>
            <input
              type="number"
              value={hrv}
              onChange={(e) => setHrv(e.target.value)}
              placeholder="z.B. 45"
              className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Readiness Status Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl border ${config.borderColor} bg-gradient-to-br ${config.color} p-6 mb-8`}
        >
          <h3 className={`text-xl font-bold ${config.textColor} mb-2`}>
            {config.title}
          </h3>
          <p className="text-slate-200 text-sm leading-relaxed">
            {config.message}
          </p>
          <div className={`mt-4 pt-4 border-t ${config.borderColor}`}>
            <p className="text-xs text-slate-400">
              Readiness Score: <span className={`font-bold ${config.textColor}`}>{Math.round(score * 10) / 10}/10</span>
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-400"
          >
            Später
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            {isLoading ? 'Speichert...' : 'Speichern & Starten'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}