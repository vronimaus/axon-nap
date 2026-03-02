import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, Lightbulb, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

export default function KnowledgeHub() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['knowledgeArticles'],
    queryFn: async () => {
      const allArticles = await base44.entities.KnowledgeArticle.list();
      return allArticles.filter(a => a.published === true);
    }
  });

  const categories = {
    all: { label: 'Alle Artikel', icon: BookOpen, color: 'blue' },
    experts: { label: 'Experten', icon: Users, color: 'purple' },
    solutions: { label: 'Lösungen', icon: Lightbulb, color: 'emerald' },
    methods: { label: 'Methoden', icon: BookOpen, color: 'blue' },
    sports: { label: 'Sports Science', icon: Lightbulb, color: 'emerald' }
  };

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Helmet>
        <title>Knowledge Hub - AXON Protocol</title>
        <meta name="description" content="Expertenwissen zu Faszien, Neuro-Athletik und funktionalem Training. Wissenschaftlich fundierte Lösungen für Schmerzen und Performance." />
        <meta property="og:title" content="Knowledge Hub - AXON Protocol" />
        <meta property="og:description" content="Expertenwissen zu Faszien, Neuro-Athletik und funktionalem Training. Wissenschaftlich fundierte Lösungen für Schmerzen und Performance." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Knowledge Hub - AXON Protocol" />
        <meta name="twitter:description" content="Expertenwissen zu Faszien, Neuro-Athletik und funktionalem Training." />
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">Knowledge Hub</h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Expertenwissen für dein System</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = createPageUrl('Landing')}
            className="text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          {Object.entries(categories).map(([key, cat]) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === key;
            
            const activeStyles = {
              blue: 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
              purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
              emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }[cat.color] || 'bg-blue-500/20 text-blue-400 border-blue-500/40';

            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                  isActive
                    ? activeStyles
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Artikel werden geladen...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Noch keine Artikel in dieser Kategorie verfügbar.</p>
            <Button onClick={() => setSelectedCategory('all')} variant="outline">
              Alle Artikel anzeigen
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, idx) => {
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#0f1623] rounded-2xl border border-white/5 hover:border-blue-500/30 overflow-hidden group cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 relative flex flex-col h-full"
                  onClick={() => window.location.href = createPageUrl(`KnowledgeHubArticle?slug=${article.slug}&category=${article.category}`)}
                >
                  {/* Top Bar */}
                  <div className="px-6 py-4 bg-[#161f33] border-b border-white/5">
                     <span className="text-[11px] font-black tracking-widest text-[#398bf7] uppercase">
                        {article.category}
                     </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col pt-8">
                    {/* Title */}
                    <h3 className="text-xl md:text-[22px] font-bold text-white mb-4 leading-snug group-hover:text-blue-100 transition-colors line-clamp-3">
                      {article.headline}
                    </h3>

                    {/* Summary */}
                    <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-4">
                      {article.summary}
                    </p>

                    {/* Link */}
                    <div className="flex items-center gap-2 text-[#398bf7] text-[11px] font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors mt-auto">
                      MEHR ERFAHREN <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}