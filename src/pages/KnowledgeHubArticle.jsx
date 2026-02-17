import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import FAQWidget from '../components/knowledge/FAQWidget';
import { Helmet } from 'react-helmet-async';

export default function KnowledgeHubArticle() {
  const [slug, setSlug] = useState(null);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const slugParam = urlParams.get('slug');
    const categoryParam = urlParams.get('category');
    
    if (slugParam && categoryParam) {
      setSlug(slugParam);
      setCategory(categoryParam);
    }
  }, []);

  const { data: article, isLoading } = useQuery({
    queryKey: ['knowledgeArticle', slug],
    queryFn: async () => {
      const articles = await base44.entities.KnowledgeArticle.filter({ 
        slug, 
        category,
        published: true 
      });
      return articles[0] || null;
    },
    enabled: !!slug && !!category
  });

  if (isLoading || !slug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400">Laden...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Artikel nicht gefunden</h1>
          <Button onClick={() => window.location.href = createPageUrl('Landing')}>
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    );
  }

  // JSON-LD Schema für SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.headline,
    "description": article.summary,
    "author": {
      "@type": "Person",
      "name": article.expert_name || "AXON Protocol Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AXON Protocol",
      "logo": {
        "@type": "ImageObject",
        "url": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
      }
    },
    "datePublished": article.created_date,
    "dateModified": article.updated_date
  };

  const medicalSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": article.headline,
    "description": article.summary,
    "about": {
      "@type": "MedicalCondition",
      "name": article.headline
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Helmet>
        <title>{article.meta_title || article.headline}</title>
        <meta name="description" content={article.meta_description || article.summary} />
        
        {/* Open Graph */}
        <meta property="og:title" content={article.meta_title || article.headline} />
        <meta property="og:description" content={article.meta_description || article.summary} />
        <meta property="og:type" content="article" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(medicalSchema)}
        </script>
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = createPageUrl('Landing')}
            className="text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <span className="text-sm text-slate-400 capitalize">{category}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* TL;DR Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-cyan-500/30 p-6 mb-8"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">TL;DR</h2>
              <p className="text-slate-300 leading-relaxed">{article.summary}</p>
            </div>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
        >
          {article.headline}
        </motion.h1>

        {/* Expert Info */}
        {article.expert_name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl border border-purple-500/30 p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              {article.expert_image_url && (
                <img 
                  src={article.expert_image_url} 
                  alt={article.expert_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-1">{article.expert_name}</h3>
                <p className="text-sm text-slate-400">{article.expert_credentials}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Deep Dive Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prose prose-lg max-w-none mb-12"
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-slate-300 leading-relaxed mb-4">{children}</p>,
              h2: ({ children }) => <h2 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">{children}</h3>,
              ul: ({ children }) => <ul className="text-slate-300 space-y-2 mb-4 ml-6 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="text-slate-300 space-y-2 mb-4 ml-6 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="text-slate-300">{children}</li>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-cyan-400 italic">{children}</em>
            }}
          >
            {article.deep_dive_content}
          </ReactMarkdown>
        </motion.div>

        {/* Triage Ampel */}
        {(article.triage_red || article.triage_yellow || article.triage_green) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl border border-slate-700 p-6 mb-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Die AXON-Ampel (Triage)</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Die AXON-Ampel hilft dir einzuschätzen, ob deine Beschwerden medizinische Abklärung benötigen oder ob AXON die richtige Lösung für dich ist. Diese Orientierung ersetzt keine ärztliche Diagnose.
            </p>
            
            <div className="space-y-4">
              {article.triage_red && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-400 mb-1">Rot</h4>
                    <p className="text-slate-300 text-sm">{article.triage_red}</p>
                  </div>
                </div>
              )}

              {article.triage_yellow && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-400 mb-1">Gelb</h4>
                    <p className="text-slate-300 text-sm">{article.triage_yellow}</p>
                  </div>
                </div>
              )}

              {article.triage_green && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-400 mb-1">Grün</h4>
                    <p className="text-slate-300 text-sm">{article.triage_green}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Related FAQs */}
        {article.related_faqs && article.related_faqs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <FAQWidget faqIds={article.related_faqs} />
          </motion.div>
        )}

        {/* Rechtlicher Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl border border-slate-700 p-6 mb-8"
        >
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Rechtlicher Hinweis:</strong> AXON ist ein Informations- und Trainingstool zur Steigerung der körperlichen Mobilität und Performance. Die Inhalte dienen der allgemeinen Information und ersetzen keine ärztliche Diagnose oder Behandlung. Bei akuten Schmerzen konsultieren Sie bitte einen Arzt oder Physiotherapeuten. Die Nennung von Experten wie Dr. Robert Schleip, Thomas W. Myers, Kelly Starrett oder Gray Cook dient der Erläuterung der sportwissenschaftlichen Theorien, auf denen AXON basiert. Es besteht keine geschäftliche Verbindung oder offizielle Partnerschaft mit den genannten Personen oder deren Marken (wie z.B. FMS, Anatomy Trains oder The Ready State).
          </p>
        </motion.div>

        {/* App CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-2xl border border-cyan-500/30 p-8 text-center bg-gradient-to-r from-cyan-500/10 to-purple-500/10"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            {article.app_cta_text || "Erlebe AXON selbst"}
          </h3>
          <p className="text-slate-300 mb-6">
            Starte jetzt deine 7-tägige kostenlose Testphase und optimiere dein System
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Landing')}
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Jetzt kostenlos testen
          </Button>
        </motion.div>
      </div>
    </div>
  );
}