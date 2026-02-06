import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MinusCircle, Loader2 } from 'lucide-react';

export default function BinaryChoiceButtons({ 
  onPositive, 
  onNegative,
  positiveText = "Besser / Freier",
  negativeText = "Gleich geblieben",
  positiveIcon: PositiveIcon = CheckCircle2,
  negativeIcon: NegativeIcon = MinusCircle
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handlePositive = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onPositive();
  };
  
  const handleNegative = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onNegative();
  };
  return (
    <div className="w-full space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          onClick={handlePositive}
          disabled={isSubmitting}
          className="w-full h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl shadow-lg shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-8 h-8 mr-3 animate-spin" />
              Wird verarbeitet...
            </>
          ) : (
            <>
              <PositiveIcon className="w-8 h-8 mr-3" />
              {positiveText}
            </>
          )}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleNegative}
          disabled={isSubmitting}
          variant="outline"
          className="w-full h-20 border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-8 h-8 mr-3 animate-spin" />
              Wird verarbeitet...
            </>
          ) : (
            <>
              <NegativeIcon className="w-8 h-8 mr-3" />
              {negativeText}
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}