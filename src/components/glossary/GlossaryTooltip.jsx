import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { getGlossaryTerm } from './glossaryData';

export default function GlossaryTooltip({ term, children, className = '' }) {
  const [isHovered, setIsHovered] = useState(false);
  const glossaryEntry = getGlossaryTerm(term);

  if (!glossaryEntry) {
    return children;
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-cyan-400 text-cyan-400 hover:text-cyan-300 transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children || glossaryEntry.term}
        <HelpCircle className="w-3.5 h-3.5" />
      </div>

      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 z-50 max-w-xs">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-3 shadow-lg">
            <p className="text-xs font-bold text-cyan-400 mb-2">{glossaryEntry.term}</p>
            <p className="text-xs text-slate-300 leading-relaxed">{glossaryEntry.fullDesc}</p>
            <div className="absolute top-full left-3 w-2 h-2 bg-slate-900 border-r border-b border-cyan-500/50 transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}