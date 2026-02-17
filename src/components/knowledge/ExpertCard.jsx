import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function ExpertCard({ 
  expertName, 
  expertImage, 
  shortText, 
  articleSlug, 
  articleCategory = 'experts',
  position = 'bottom-right' // 'bottom-right' | 'top-right' | 'inline'
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!expertName || !shortText) return null;

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6 z-50',
    'top-right': 'fixed top-20 right-6 z-50',
    'inline': 'relative'
  };

  return (
    <div className={positionClasses[position]}>
      <AnimatePresence>
        {!isExpanded ? (
          // Collapsed State - Icon Button
          <motion.button
            key="collapsed"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
            title={`Experten-Tipp von ${expertName}`}
          >
            <Info className="w-6 h-6 text-white" />
          </motion.button>
        ) : (
          // Expanded State - Expert Card
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="glass rounded-2xl border border-purple-500/30 p-4 shadow-2xl max-w-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {expertImage && (
                  <img 
                    src={expertImage} 
                    alt={expertName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h4 className="font-bold text-white text-sm">{expertName}</h4>
                  <p className="text-xs text-purple-400">Experten-Tipp</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {shortText}
            </p>

            {articleSlug && (
              <Button
                onClick={() => window.location.href = createPageUrl(`KnowledgeHubArticle?slug=${articleSlug}&category=${articleCategory}`)}
                size="sm"
                className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Mehr erfahren
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}