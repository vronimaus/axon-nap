import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { getGlossaryTerm } from './glossaryData';

export default function GlossaryTooltip({ term, children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const glossaryEntry = getGlossaryTerm(term);

  if (!glossaryEntry) {
    return children;
  }

  const toggleTooltip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <span className={`relative inline ${className}`}>
      <button
        type="button"
        onClick={toggleTooltip}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 cursor-pointer border-b-2 border-dotted border-cyan-400 text-cyan-400 hover:text-cyan-300 hover:border-cyan-300 transition-colors bg-cyan-500/10 px-1 rounded touch-target"
      >
        {children || glossaryEntry.term}
        <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 z-[100] w-72 sm:w-80 pointer-events-none">
          <div className="bg-slate-900 border-2 border-cyan-500 rounded-lg p-4 shadow-2xl">
            <p className="text-sm font-bold text-cyan-400 mb-2">{glossaryEntry.term}</p>
            <p className="text-sm text-slate-200 leading-relaxed">{glossaryEntry.fullDesc}</p>
            <div className="absolute top-full left-4 w-3 h-3 bg-slate-900 border-r-2 border-b-2 border-cyan-500 transform rotate-45 -mt-1.5" />
          </div>
        </div>
      )}
    </span>
  );
}