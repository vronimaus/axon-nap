import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function GoalCard({ goal, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        onClick={onClick}
        className="p-6 border-0 shadow-xl glass hover:glass-cyan transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
              style={{ backgroundColor: goal.color }}
            >
              {goal.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-cyan-400 mb-2">
                {goal.name}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {goal.description}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0 ml-4" />
        </div>
      </Card>
    </motion.div>
  );
}