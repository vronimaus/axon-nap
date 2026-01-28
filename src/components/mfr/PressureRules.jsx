import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Timer, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PressureRules({ node, onClose }) {
  if (!node) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 max-w-md glass"
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{node.node_id}: Druck-Regeln</h2>
              <p className="text-sm text-slate-400">{node.name_de}</p>
            </div>
          </div>

          {/* Compression Time */}
          <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-cyan-400">Kompression-Zeit</h3>
            </div>
            <p className="text-sm text-slate-300">
              Halten Sie den Druck <span className="font-bold text-cyan-300">
                {node.compression_time_min}-{node.compression_time_max} Sekunden
              </span> konstant.
            </p>
          </div>

          {/* Burning Rule */}
          {node.pressure_rule_burning && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-400">Bei brennendem Gefühl</h3>
              </div>
              <p className="text-sm text-slate-300">{node.pressure_rule_burning}</p>
            </div>
          )}

          {/* Depth Rule */}
          {node.pressure_rule_depth && (
            <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-purple-400">Bei tiefen Punkten</h3>
              </div>
              <p className="text-sm text-slate-300">{node.pressure_rule_depth}</p>
            </div>
          )}

          {/* General Rule */}
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-slate-300">
              <span className="text-green-400 font-semibold">Honig-Prinzip:</span> Langsam eindringen, nicht ruckartig. Der Druck sollte auf 6-7/10 sein (unangenehm, aber erträglich).
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            Verstanden, starten
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}