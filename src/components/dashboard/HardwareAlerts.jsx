import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Eye, AlertTriangle, User } from 'lucide-react';

export default function HardwareAlerts({ profile }) {
  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-yellow-400 mb-1">
              Neuro-Passport Unvollständig
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Vervollständige deinen Neuro-Passport für präzisere Diagnosen und personalisierte Protokolle.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const alerts = [];
  
  // Check for scars
  if (profile.scar_tissue_locations && profile.scar_tissue_locations.trim()) {
    alerts.push({
      icon: Scissors,
      label: 'Narbengewebe',
      value: profile.scar_tissue_locations,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30'
    });
  }
  
  // Check for visual correction
  if (profile.visual_status && profile.visual_status !== 'no_correction') {
    const visualLabels = {
      glasses: 'Brille',
      contacts: 'Kontaktlinsen',
      lasered: 'Gelasert'
    };
    alerts.push({
      icon: Eye,
      label: 'Sehhilfe',
      value: visualLabels[profile.visual_status],
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    });
  }
  
  // Check for jaw tension
  if (profile.jaw_tension_history) {
    alerts.push({
      icon: AlertTriangle,
      label: 'Kieferspannung',
      value: 'Historie vorhanden',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30'
    });
  }

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-green-500/30 bg-green-500/10 p-6"
      >
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-green-400" />
          <div>
            <h3 className="text-sm font-bold text-green-400">Hardware-Profil Clean</h3>
            <p className="text-xs text-slate-300 mt-1">
              Keine Störfaktoren im System erkannt
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-cyan-500/20 p-6"
    >
      <h3 className="text-sm font-bold text-white mb-4">Hardware-Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-lg border ${alert.borderColor} ${alert.bgColor} p-3 flex items-start gap-3`}
          >
            <alert.icon className={`w-4 h-4 ${alert.color} flex-shrink-0 mt-0.5`} />
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${alert.color}`}>
                {alert.label}
              </p>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                {alert.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}