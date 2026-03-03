import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';

export default function FAQWidget({ faqIds = [], category = null, tags = [], limit = null }) {
  const [openIndex, setOpenIndex] = useState(null);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs', faqIds, category, tags],
    queryFn: async () => {
      let filteredFaqs = [];

      if (faqIds.length > 0) {
        // Lade spezifische FAQs nach IDs
        const allFaqs = await base44.entities.FAQ.list();
        filteredFaqs = allFaqs.filter(faq => faqIds.includes(faq.faq_id) && faq.published !== false);
      } else {
        // Lade FAQs nach Kategorie und/oder Tags
        const query = { published: true };
        if (category) query.category = category;
        
        const allFaqs = await base44.entities.FAQ.list('order', 100);
        
        filteredFaqs = allFaqs.filter(faq => {
          if (category && faq.category !== category) return false;
          if (tags.length > 0 && !tags.some(tag => faq.tags?.includes(tag))) return false;
          return true;
        });
      }

      // Sortiere nach order
      filteredFaqs.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Limitiere Anzahl wenn angegeben
      if (limit) {
        filteredFaqs = filteredFaqs.slice(0, limit);
      }

      return filteredFaqs;
    }
  });

  if (isLoading) {
    return (
      <div className="glass rounded-2xl border border-slate-700 p-6">
        <div className="text-slate-400">FAQs werden geladen...</div>
      </div>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div className="glass rounded-2xl border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Häufige Fragen</h3>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={faq.id}
            className="border border-slate-700 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <span className="font-semibold text-white pr-4">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 text-slate-300">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-6 mb-2 text-slate-300">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-6 mb-2 text-slate-300">{children}</ol>,
                          li: ({ children }) => <li className="mb-1 text-slate-300">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>
                        }}
                      >
                        {faq.answer}
                      </ReactMarkdown>
                    </div>
                    {faq.tags && faq.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {faq.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}