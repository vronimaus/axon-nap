import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, RefreshCw } from 'lucide-react';

/**
 * Disambiguation Overlay
 *
 * Wird eingeblendet, wenn die angeklickte Körperregion auf einer 2D-Body-Map
 * mehrdeutig ist (z.B. Schulter/Acromion kann Dach, Oberarm oder Schulterblatt
 * bedeuten). Der User wählt die genaue Struktur → die App nutzt den
 * aufgelösten Node für die Diagnose oder schaltet ggf. auf die andere
 * Body-Map-Ansicht um.
 *
 * Props:
 *   region   — erkannte Region-Label (z.B. "Schulter/Acromion links")
 *   options  — Array von { label, subtitle, nodeId, switchView? }
 *   onSelect — Callback(option) beim Wählen einer Option
 *   onSkip   — Callback() zum Überspringen (direkt mit Auto-Erkennung weiter)
 */
export default function RegionDisambiguation({ region, options, onSelect, onSkip }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 flex flex-col bg-slate-950/95 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Genauere Eingrenzung
            </p>
            <p className="text-sm font-bold text-white mt-0.5">
              Wo genau ist der Punkt?
            </p>
          </div>
          <button
            onClick={onSkip}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Überspringen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 py-2">
          <p className="text-xs text-slate-500">
            Erkannte Region: <span className="text-slate-300 font-medium">{region}</span>
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            Die Schulter- und Hüftregion ist auf einer 2D-Karte mehrdeutig.
            Bitte wähle die genaue Struktur, damit wir dich richtig diagnostizieren.
          </p>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
          {options.map((opt, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(opt)}
              className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl
                         border border-white/[0.08] bg-slate-900/60
                         hover:border-cyan-500/40 hover:bg-cyan-500/5
                         transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{opt.label}</p>
                {opt.subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{opt.subtitle}</p>
                )}
              </div>
              {opt.switchView ? (
                <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {opt.switchView === 'back' ? 'Rückseite' : 'Vorderseite'}
                  </span>
                </div>
              ) : (
                <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Skip link */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <button
            onClick={onSkip}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Trotzdem mit automatischer Erkennung fortfahren
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}