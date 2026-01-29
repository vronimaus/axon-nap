import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Target, Zap } from 'lucide-react';

export default function SystemStatus({ mode, profile, lastSession }) {
  // Calculate system focus based on mode and data
  const getFocus = () => {
    if (mode === 'rehab' && lastSession?.symptom_location) {
      return {
        title: 'SYSTEM STATUS',
        message: `Focus: ${lastSession.symptom_location} Pain Relief & Neural Safety`,
        icon: Target,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30'
      };
    }
    
    if (mode === 'performance') {
      return {
        title: 'SYSTEM STATUS',
        message: 'Focus: Performance Enhancement & ROM Expansion',
        icon: Zap,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30'
      };
    }
    
    return {
      title: 'SYSTEM STATUS',
      message: 'Ready for Assessment',
      icon: AlertCircle,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30'
    };
  };

  const status = getFocus();
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl border ${status.borderColor} ${status.bgColor} p-6`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${status.bgColor} border ${status.borderColor} flex items-center justify-center flex-shrink-0`}>
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold ${status.color} tracking-wider mb-1`}>
            {status.title}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {status.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}