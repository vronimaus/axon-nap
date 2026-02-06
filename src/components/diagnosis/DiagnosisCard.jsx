import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, Info, ArrowRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function DiagnosisCard({ 
  title,
  analysis,
  expertInsight,
  callToAction,
  onActionClick,
  showExpertByDefault = false
}) {
  const [showExpert, setShowExpert] = useState(showExpertByDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass rounded-2xl border border-red-500/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500/20 to-transparent p-6 border-b border-red-500/30">
          <h2 className="text-2xl font-bold text-red-400">{title}</h2>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Analysis */}
          <div className="text-slate-300 leading-relaxed">
            <ReactMarkdown
              className="prose prose-sm prose-invert max-w-none"
              components={{
                p: ({ children }) => <p className="mb-3">{children}</p>,
                strong: ({ children }) => <strong className="text-red-400">{children}</strong>,
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
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
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
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-cyan-500/20">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {expertInsight}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Call to Action */}
          {callToAction && onActionClick && (
            <Button
              onClick={handleActionClick}
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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