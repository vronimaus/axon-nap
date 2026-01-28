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

  // Farbschema für Karten
  const colorSchemes = [
    { bg: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-500/30', text: 'text-pink-400', icon: 'bg-pink-500' },
    { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'bg-blue-500' },
    { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'bg-orange-500' },
    { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-500/30', text: 'text-green-400', icon: 'bg-green-500' },
    { bg: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'bg-cyan-500' },
    { bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'bg-purple-500' },
    { bg: 'from-red-500/10 to-red-600/5', border: 'border-red-500/30', text: 'text-red-400', icon: 'bg-red-500' },
    { bg: 'from-yellow-500/10 to-yellow-600/5', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: 'bg-yellow-500' },
    { bg: 'from-indigo-500/10 to-indigo-600/5', border: 'border-indigo-500/30', text: 'text-indigo-400', icon: 'bg-indigo-500' },
    { bg: 'from-teal-500/10 to-teal-600/5', border: 'border-teal-500/30', text: 'text-teal-400', icon: 'bg-teal-500' },
    { bg: 'from-lime-500/10 to-lime-600/5', border: 'border-lime-500/30', text: 'text-lime-400', icon: 'bg-lime-500' },
    { bg: 'from-fuchsia-500/10 to-fuchsia-600/5', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', icon: 'bg-fuchsia-500' }
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
          {/* Icon */}
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center text-2xl
            ${scheme.icon} shadow-lg
            transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300
          `}>
            {emoji}
          </div>
          
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