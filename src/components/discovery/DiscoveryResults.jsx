import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, CheckCircle2, Zap, AlertTriangle } from 'lucide-react';

const LEVEL_CONFIG = {
  beginner:     { label: 'Beginner',     color: 'text-slate-400',  bg: 'bg-slate-500/20',  border: 'border-slate-500/40' },
  intermediate: { label: 'Intermediate', color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/40' },
  advanced:     { label: 'Advanced',     color: 'text-emerald-400',  bg: 'bg-emerald-500/20',  border: 'border-emerald-500/40' },
  elite:        { label: 'Elite',        color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
};

const getLevel = (value, thresholds) => {
  if (value >= thresholds.elite) return 'elite';
  if (value >= thresholds.advanced) return 'advanced';
  if (value >= thresholds.intermediate) return 'intermediate';
  return 'beginner';
};

// Generates the conversation script based on results
const buildScript = (results, goalLabel) => {
  const weakLinks = results.filter(r => r.level === 'beginner');
  const strengths = results.filter(r => r.level === 'advanced' || r.level === 'elite');
  const allIntermediate = weakLinks.length === 0 && strengths.length === 0;

  const messages = [];

  // Step 1: Acknowledge
  messages.push({
    id: 'ack',
    type: 'axon',
    text: goalLabel
      ? `Alright. Ich hab deine Baseline für **${goalLabel}** analysiert.`
      : 'Alright. Deine Baseline ist kalibriert.',
    delay: 400,
  });

  // Step 2: Results reveal
  messages.push({
    id: 'results',
    type: 'results_card',
    delay: 1200,
  });

  // Step 3: Interpretation
  if (weakLinks.length > 0) {
    const names = weakLinks.map(w => w.name).join(' und ');
    messages.push({
      id: 'weak',
      type: 'axon',
      icon: 'warning',
      text: `**${names}** ist dein limitierender Faktor. Das ist die Lücke, die deinen Fortschritt bremst — und genau da setzen wir zuerst an.`,
      delay: 800,
    });
  }

  if (strengths.length > 0) {
    const names = strengths.map(s => s.name).join(' und ');
    messages.push({
      id: 'strong',
      type: 'axon',
      icon: 'check',
      text: `**${names}** ist solide. Das ist dein Fundament — hier können wir direkt mit höherer Intensität einsteigen.`,
      delay: 800,
    });
  }

  if (allIntermediate) {
    messages.push({
      id: 'balanced',
      type: 'axon',
      icon: 'check',
      text: `Gutes Niveau, ausgewogen über alle Tests. Kein klarer Schwachpunkt — das bedeutet wir können direkt auf dein Ziel zusteuern.`,
      delay: 800,
    });
  }

  // Step 4: Plan teaser
  messages.push({
    id: 'plan',
    type: 'axon',
    icon: 'zap',
    text: goalLabel
      ? `Dein Plan für **${goalLabel}** wird gerade generiert — maßgeschneidert auf exakt diese Baseline.`
      : `AXON kennt jetzt dein Fundament. Jeder Plan wird präzise darauf aufgebaut.`,
    delay: 800,
  });

  // Step 5: CTA
  messages.push({
    id: 'cta',
    type: 'cta',
    delay: 600,
  });

  return messages;
};

export default function DiscoveryResults({ tests, answers, onContinue, isGeneratingPlan, goalLabel }) {
  const results = tests.map(test => {
    const val = answers[test.id];
    const level = getLevel(val, test.thresholds);
    return { ...test, value: val, level };
  });

  const script = buildScript(results, goalLabel);
  const [visibleCount, setVisibleCount] = useState(0);

  // Reveal messages one by one
  useEffect(() => {
    if (visibleCount >= script.length) return;
    const next = script[visibleCount];
    const timer = setTimeout(() => {
      setVisibleCount(c => c + 1);
    }, next.delay);
    return () => clearTimeout(timer);
  }, [visibleCount, script.length]);

  const renderMessage = (msg) => {
    if (msg.type === 'results_card') {
      return (
        <div className="space-y-2">
          {results.map((r, i) => {
            const cfg = LEVEL_CONFIG[r.level];
            const displayVal = r.unit === 'level' && r.labels ? r.labels[r.value] : `${r.value} ${r.metric_label}`;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900/50">
                    <r.icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-slate-400">{displayVal}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${cfg.border} ${cfg.bg} ${cfg.color} whitespace-nowrap`}>
                  {cfg.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      );
    }

    if (msg.type === 'cta') {
      return (
        <Button
          onClick={onContinue}
          disabled={isGeneratingPlan}
          className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold text-base shadow-lg shadow-blue-500/20"
        >
          {isGeneratingPlan ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Plan wird fertiggestellt…
            </span>
          ) : goalLabel ? (
            <span className="flex items-center gap-2">Trainingsplan anzeigen <ArrowRight className="w-5 h-5" /></span>
          ) : (
            <span className="flex items-center gap-2">Zum Dashboard <ArrowRight className="w-5 h-5" /></span>
          )}
        </Button>
      );
    }

    // AXON text message
    const renderText = (text) =>
      text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
      );

    const IconComp = msg.icon === 'warning' ? AlertTriangle : msg.icon === 'zap' ? Zap : CheckCircle2;
    const iconColor = msg.icon === 'warning' ? 'text-amber-400' : msg.icon === 'zap' ? 'text-cyan-400' : 'text-green-400';

    return (
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-slate-800 border border-slate-700`}>
          {msg.icon ? (
            <IconComp className={`w-4 h-4 ${iconColor}`} />
          ) : (
            <span className="text-xs font-bold text-cyan-400">A</span>
          )}
        </div>
        <div className="glass rounded-xl rounded-tl-sm border border-slate-700 px-4 py-3 text-sm text-slate-300 leading-relaxed">
          {renderText(msg.text)}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg w-full space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <span className="text-sm font-bold text-white">A</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white">AXON</p>
          <p className="text-xs text-slate-500">Ergebnis-Analyse</p>
        </div>
      </div>

      {/* Conversation */}
      <div className="space-y-4">
        <AnimatePresence>
          {script.slice(0, visibleCount).map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {renderMessage(msg)}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {visibleCount < script.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800 border border-slate-700">
              <span className="text-xs font-bold text-cyan-400">A</span>
            </div>
            <div className="glass rounded-xl rounded-tl-sm border border-slate-700 px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}