import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MinusCircle } from 'lucide-react';

export default function BinaryChoiceButtons({ 
  onPositive, 
  onNegative,
  positiveText = "Besser / Freier",
  negativeText = "Gleich geblieben",
  positiveIcon: PositiveIcon = CheckCircle2,
  negativeIcon: NegativeIcon = MinusCircle
}) {
  return (
    <div className="w-full space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          onClick={onPositive}
          className="w-full h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl shadow-lg shadow-green-500/50"
        >
          <PositiveIcon className="w-8 h-8 mr-3" />
          {positiveText}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={onNegative}
          variant="outline"
          className="w-full h-20 border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white font-bold text-xl"
        >
          <NegativeIcon className="w-8 h-8 mr-3" />
          {negativeText}
        </Button>
      </motion.div>
    </div>
  );
}