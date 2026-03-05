import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FocusScreenContainer({ 
  title, 
  instruction, 
  children, 
  onBack,
  showBackButton = false,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-y-auto ${className}`}
    >
      {/* Header */}
      {showBackButton && (
        <div className="sticky top-0 z-40 glass border-b border-red-500/20 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-red-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8 pb-24">
        {/* Title */}
        {title && (
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold text-white text-center mb-4 tracking-tight"
          >
            {title}
          </motion.h1>
        )}

        {/* Instruction */}
        {instruction && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 text-center mb-8 max-w-2xl"
          >
            {instruction}
          </motion.p>
        )}

        {/* Dynamic Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-4xl"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}