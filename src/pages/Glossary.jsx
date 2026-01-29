import React, { useState } from 'react';
import { glossaryTerms } from '@/components/glossary/glossaryData';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function Glossary() {
  const [searchTerm, setSearchTerm] = useState('');

  const basics = Object.values(glossaryTerms).filter(t => t.category === 'basics');
  const deepdive = Object.values(glossaryTerms).filter(t => t.category === 'deepdive');

  const filterTerms = (terms) => {
    return terms.filter(t => 
      t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.shortDesc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AXON Glossar
          </h1>
          <p className="text-lg text-slate-400">
            Verstehe die Sprache deines Nervensystems
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Begriffe suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-800/50 border border-cyan-500/30 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Basics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
            Die Grundlagen der Methodik
          </h2>

          <div className="space-y-4">
            {filterTerms(basics).map((entry, idx) => (
              <motion.div
                key={entry.term}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                className="glass rounded-xl border border-cyan-500/20 p-6 hover:border-cyan-500/50 transition-all"
              >
                <h3 className="text-lg font-bold text-cyan-400 mb-2">{entry.term}</h3>
                <p className="text-sm text-slate-400 mb-3">{entry.shortDesc}</p>
                <p className="text-slate-300 leading-relaxed">{entry.fullDesc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Deep Dive Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full" />
            Tieferes Verständnis (Deep Dive)
          </h2>

          <div className="space-y-4">
            {filterTerms(deepdive).map((entry, idx) => (
              <motion.div
                key={entry.term}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="glass rounded-xl border border-purple-500/20 p-6 hover:border-purple-500/50 transition-all"
              >
                <h3 className="text-lg font-bold text-purple-400 mb-2">{entry.term}</h3>
                <p className="text-sm text-slate-400 mb-3">{entry.shortDesc}</p>
                <p className="text-slate-300 leading-relaxed">{entry.fullDesc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* No Results */}
        {filterTerms(basics).length === 0 && filterTerms(deepdive).length === 0 && searchTerm && (
          <div className="text-center py-12">
            <p className="text-slate-400">Keine Begriffe gefunden für "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}