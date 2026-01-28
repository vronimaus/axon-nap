import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function GoalCard({ goal, onClick, index }) {
  // Icon-Mapping für die 12 Performance-Ziele
  const iconEmojis = {
    'backbend': '🌉',
    'middle_split': '🤸',
    'pancake': '🥞',
    'deep_squat': '🦵',
    'front_split': '🧘',
    'overhead': '🙌',
    'pistol_squat': '⚡',
    'dragon_squat': '🐉',
    'handstand': '🤹',
    'l_sit': '💺',
    'skin_the_cat': '🐱',
    'jefferson_curl': '🌀'
  };

  // Neon-Dark Farbschema - Cyan & Purple Gradient
  const colorSchemes = [
    { bg: 'from-cyan-500/10 to-purple-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
    { bg: 'from-purple-500/10 to-cyan-500/5', border: 'border-purple-500/20', text: 'text-purple-400', icon: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { bg: 'from-cyan-400/10 to-slate-700/5', border: 'border-cyan-400/20', text: 'text-cyan-300', icon: 'bg-gradient-to-br from-cyan-400 to-cyan-500' },
    { bg: 'from-purple-400/10 to-slate-700/5', border: 'border-purple-400/20', text: 'text-purple-300', icon: 'bg-gradient-to-br from-purple-400 to-purple-500' },
    { bg: 'from-cyan-600/10 to-purple-600/5', border: 'border-cyan-600/20', text: 'text-cyan-500', icon: 'bg-gradient-to-br from-cyan-600 to-purple-500' },
    { bg: 'from-purple-600/10 to-cyan-600/5', border: 'border-purple-600/20', text: 'text-purple-500', icon: 'bg-gradient-to-br from-purple-600 to-cyan-500' }
  ];

  const scheme = colorSchemes[index % colorSchemes.length];
  const emoji = goal.icon || iconEmojis[goal.code] || '🎯';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-5 cursor-pointer
        bg-gradient-to-br ${scheme.bg}
        backdrop-blur-sm border ${scheme.border}
        transition-all duration-300 hover:scale-[1.02]
        group
      `}
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Glühender Hintergrund-Effekt bei Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-semibold ${scheme.text} mb-1 group-hover:translate-x-1 transition-transform truncate`}>
              {goal.name}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              {goal.description || 'Master-Ziel für Bewegungsqualität'}
            </p>
          </div>
        </div>
        
        {/* Arrow */}
        <ArrowRight className={`
          w-5 h-5 ${scheme.text} flex-shrink-0
          transform group-hover:translate-x-2 transition-all
          opacity-60 group-hover:opacity-100
        `} />
      </div>
    </motion.div>
  );
}