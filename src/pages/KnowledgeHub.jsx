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
    queryFn: () => base44.entities.KnowledgeArticle.filter({ published: true })
  });

  const categories = {
    all: { label: 'Alle Artikel', icon: BookOpen, color: 'cyan' },
    experts: { label: 'Experten', icon: Users, color: 'purple' },
    solutions: { label: 'Lösungen', icon: Lightbulb, color: 'amber' },
    methods: { label: 'Methoden', icon: BookOpen, color: 'green' }
  };

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Helmet>
        <title>Knowledge Hub - AXON Protocol</title>
        <meta name="description" content="Expertenwissen zu Faszien, Neuro-Athletik und funktionalem Training. Wissenschaftlich fundierte Lösungen für Schmerzen und Performance." />
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Hub</h1>
            <p className="text-sm text-slate-400 mt-1">Expertenwissen für dein System</p>
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
            
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isActive
                    ? `bg-${cat.color}-500/20 text-${cat.color}-400 border border-${cat.color}-500/30`
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
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
              const catColor = categories[article.category]?.color || 'cyan';
              
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-2xl border border-slate-700 hover:border-slate-600 overflow-hidden group cursor-pointer transition-all"
                  onClick={() => window.location.href = createPageUrl(`KnowledgeHubArticle?slug=${article.slug}&category=${article.category}`)}
                >
                  {/* Category Badge */}
                  <div className={`px-3 py-1 bg-${catColor}-500/20 border-b border-${catColor}-500/30`}>
                    <span className={`text-xs font-semibold text-${catColor}-400 capitalize`}>
                      {article.category}
                    </span>
                  </div>

                  <div className="p-6">
                    {/* Expert Info */}
                    {article.expert_name && (
                      <div className="flex items-center gap-2 mb-3">
                        {article.expert_image_url && (
                          <img 
                            src={article.expert_image_url} 
                            alt={article.expert_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <span className="text-xs text-purple-400 font-semibold">{article.expert_name}</span>
                      </div>
                    )}

                    {/* Headline */}
                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                      {article.headline}
                    </h3>

                    {/* Summary */}
                    <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                      {article.summary}
                    </p>

                    {/* Read More */}
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium group-hover:gap-3 transition-all">
                      Mehr erfahren
                      <ArrowRight className="w-4 h-4" />
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