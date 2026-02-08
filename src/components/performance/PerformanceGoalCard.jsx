import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, Info, ArrowRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PerformanceGoalCard({ 
  title,
  analysis,
  expertInsight,
  callToAction,
  onActionClick,
  onFrequencySelect,
  showExpertByDefault = false
}) {
  const [showExpert, setShowExpert] = useState(showExpertByDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  
  // Check if analysis contains frequency question
  const hasFrequencyQuestion = analysis?.includes('Wie oft kannst du trainieren') || 
                                analysis?.includes('2-3x/Woche') ||
                                analysis?.includes('4-5x/Woche');
  
  const handleActionClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onActionClick();
    } catch (error) {
      console.error('Action error:', error);
      setIsSubmitting(false);
    }
  };

  const handleFrequencyClick = async (frequency) => {
    if (isSubmitting) return;
    setSelectedFrequency(frequency);
    setIsSubmitting(true);
    try {
      if (onFrequencySelect) {
        await onFrequencySelect(frequency);
      }
    } catch (error) {
      console.error('Frequency selection error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass rounded-2xl border border-amber-500/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 to-transparent p-6 border-b border-amber-500/30">
          <h2 className="text-2xl font-bold text-amber-400">{title}</h2>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Analysis */}
          <div className="text-slate-300 leading-relaxed">
            <ReactMarkdown
              className="prose prose-sm prose-invert max-w-none"
              components={{
                p: ({ children }) => <p className="mb-3">{children}</p>,
                strong: ({ children }) => <strong className="text-amber-400">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc ml-6 mb-3">{children}</ul>,
                li: ({ children }) => <li className="mb-1">{children}</li>
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>

          {/* Expert Insight Toggle */}
          {expertInsight && (
            <div className="border-t border-slate-700 pt-4">
              <button
                onClick={() => setShowExpert(!showExpert)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>Wissenschaftlicher Hintergrund</span>
                <motion.div
                  animate={{ rotate: showExpert ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showExpert && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-amber-500/20">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {expertInsight}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Frequency Selection (if question is in analysis) */}
          {hasFrequencyQuestion && !selectedFrequency && onFrequencySelect && (
            <div className="space-y-3">
              <p className="text-sm text-amber-400 font-semibold">Wie oft kannst du trainieren?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleFrequencyClick('2-3x/Woche')}
                  disabled={isSubmitting}
                  className="h-auto py-4 bg-slate-800 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500 text-white"
                >
                  <div className="text-center">
                    <div className="font-bold">2-3x/Woche</div>
                    <div className="text-xs text-slate-400">= 8 Wochen Plan</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleFrequencyClick('4-5x/Woche')}
                  disabled={isSubmitting}
                  className="h-auto py-4 bg-slate-800 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500 text-white"
                >
                  <div className="text-center">
                    <div className="font-bold">4-5x/Woche</div>
                    <div className="text-xs text-slate-400">= 6 Wochen Plan</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleFrequencyClick('Täglich')}
                  disabled={isSubmitting}
                  className="h-auto py-4 bg-slate-800 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500 text-white"
                >
                  <div className="text-center">
                    <div className="font-bold">Täglich</div>
                    <div className="text-xs text-slate-400">= 4 Wochen Plan</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Call to Action (shown after frequency selection OR if no frequency question) */}
          {callToAction && onActionClick && (!hasFrequencyQuestion || selectedFrequency) && (
            <Button
              onClick={handleActionClick}
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  {callToAction}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}