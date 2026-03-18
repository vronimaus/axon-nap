import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Sparkles, ChevronUp, ChevronDown, Loader2, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import html2canvas from 'html2canvas';

// Farbschemas für Folien
const SLIDE_THEMES = [
  { id: 'axon-dark',    label: 'AXON Dark',     bg: 'from-slate-950 to-slate-900',     accent: '#06b6d4', text: 'text-white',       border: 'border-cyan-500/30' },
  { id: 'axon-cyan',   label: 'Cyan Highlight', bg: 'from-cyan-950 to-slate-900',      accent: '#22d3ee', text: 'text-white',       border: 'border-cyan-400/40' },
  { id: 'axon-blue',   label: 'Deep Blue',      bg: 'from-blue-950 to-slate-950',      accent: '#60a5fa', text: 'text-white',       border: 'border-blue-400/40' },
  { id: 'axon-purple', label: 'Neuro Purple',   bg: 'from-purple-950 to-slate-950',    accent: '#a78bfa', text: 'text-white',       border: 'border-purple-400/40' },
  { id: 'axon-emerald',label: 'Rehab Green',    bg: 'from-emerald-950 to-slate-950',   accent: '#34d399', text: 'text-white',       border: 'border-emerald-400/40' },
  { id: 'axon-light',  label: 'Light Mode',     bg: 'from-slate-100 to-white',         accent: '#0891b2', text: 'text-slate-900',   border: 'border-slate-300' },
];

// Grafische Elemente / Icons als SVG-Shapes
const GRAPHIC_ELEMENTS = [
  { id: 'none',    label: 'Keine',         render: () => null },
  { id: 'brain',   label: 'Gehirn (Neuro)',render: (color) => (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-15" fill={color}>
      <ellipse cx="50" cy="45" rx="30" ry="25" /><ellipse cx="35" cy="60" rx="15" ry="12" /><ellipse cx="65" cy="60" rx="15" ry="12" />
      <line x1="50" y1="20" x2="50" y2="70" stroke={color} strokeWidth="2" /><line x1="25" y1="45" x2="75" y2="45" stroke={color} strokeWidth="2" />
    </svg>
  )},
  { id: 'network', label: 'Netzwerk',      render: (color) => (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-15" stroke={color} strokeWidth="1.5" fill="none">
      <circle cx="50" cy="50" r="6" fill={color} opacity="0.4"/>
      <circle cx="20" cy="25" r="4" fill={color} opacity="0.4"/><circle cx="80" cy="25" r="4" fill={color} opacity="0.4"/>
      <circle cx="20" cy="75" r="4" fill={color} opacity="0.4"/><circle cx="80" cy="75" r="4" fill={color} opacity="0.4"/>
      <circle cx="50" cy="10" r="3" fill={color} opacity="0.3"/><circle cx="50" cy="90" r="3" fill={color} opacity="0.3"/>
      <line x1="50" y1="50" x2="20" y2="25"/><line x1="50" y1="50" x2="80" y2="25"/>
      <line x1="50" y1="50" x2="20" y2="75"/><line x1="50" y1="50" x2="80" y2="75"/>
      <line x1="50" y1="50" x2="50" y2="10"/><line x1="50" y1="50" x2="50" y2="90"/>
      <line x1="20" y1="25" x2="80" y2="25"/><line x1="20" y1="75" x2="80" y2="75"/>
    </svg>
  )},
  { id: 'hexagons', label: 'Hexagone',    render: (color) => (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-10" fill={color}>
      {[[50,30],[25,47],[75,47],[50,64],[25,81],[75,81]].map(([cx,cy],i) => (
        <polygon key={i} points={`${cx},${cy-12} ${cx+10},${cy-6} ${cx+10},${cy+6} ${cx},${cy+12} ${cx-10},${cy+6} ${cx-10},${cy-6}`} />
      ))}
    </svg>
  )},
  { id: 'wave',    label: 'Welle',         render: (color) => (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-20" fill="none" stroke={color} strokeWidth="2">
      <path d="M0,50 Q12,35 25,50 T50,50 T75,50 T100,50" /><path d="M0,60 Q12,45 25,60 T50,60 T75,60 T100,60" opacity="0.5"/>
      <path d="M0,40 Q12,25 25,40 T50,40 T75,40 T100,40" opacity="0.5"/>
    </svg>
  )},
  { id: 'dna',     label: 'DNA / Helix',   render: (color) => (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-15" fill="none" stroke={color} strokeWidth="2">
      <path d="M30,10 Q60,25 30,50 Q0,75 30,90" /><path d="M70,10 Q40,25 70,50 Q100,75 70,90" />
      {[20,35,50,65,80].map((y,i) => <line key={i} x1="30" y1={y} x2="70" y2={y} opacity="0.5"/>)}
    </svg>
  )},
  { id: 'arrow',   label: 'Pfeil / Fokus', render: (color) => (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-20" fill={color}>
      <polygon points="50,10 90,55 68,55 68,90 32,90 32,55 10,55" />
    </svg>
  )},
  { id: 'dots',    label: 'Punkte-Muster', render: (color) => (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-10" fill={color}>
      {Array.from({length:7}, (_,row) => Array.from({length:7}, (_,col) => (
        <circle key={`${row}-${col}`} cx={10+col*14} cy={10+row*14} r="2.5" />
      )))}
    </svg>
  )},
];

const EMPTY_SLIDE = { title: '', text: '', theme: 'axon-dark', graphic: 'none', tag: '' };

// Slide Preview Component
function SlidePreview({ slide, index, total }) {
  const theme = SLIDE_THEMES.find(t => t.id === slide.theme) || SLIDE_THEMES[0];
  const graphicEl = GRAPHIC_ELEMENTS.find(g => g.id === slide.graphic) || GRAPHIC_ELEMENTS[0];

  return (
    <div className={`aspect-[4/5] rounded-2xl overflow-hidden relative bg-gradient-to-br ${theme.bg} border ${theme.border} flex flex-col`}>
      {/* Background graphic */}
      {graphicEl.id !== 'none' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="w-3/4 h-3/4">
            {graphicEl.render(theme.accent)}
          </div>
        </div>
      )}

      {/* Accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }} />

      {/* Content */}
      <div className={`relative z-10 flex flex-col h-full p-7 justify-between ${theme.text}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black tracking-[0.25em] uppercase" style={{ color: theme.accent }}>AXON-nap</span>
          <span className="text-[9px] opacity-40">{index + 1}/{total}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center py-4 gap-3">
          {slide.tag && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit" style={{ background: theme.accent + '22', color: theme.accent }}>
              {slide.tag}
            </span>
          )}
          {slide.title && (
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              {slide.title}
            </h2>
          )}
          {slide.text && (
            <p className="text-base leading-relaxed opacity-90 whitespace-pre-wrap font-medium">
              {slide.text}
            </p>
          )}
          {!slide.title && !slide.text && (
            <p className="opacity-30 text-xs italic">Folie bearbeiten...</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-6 rounded-full" style={{ background: theme.accent }} />
          <span className="text-[9px] opacity-40 font-mono">axon-nap.de</span>
        </div>
      </div>
    </div>
  );
}

export default function CarouselBuilder() {
  const [slides, setSlides] = useState([
    { ...EMPTY_SLIDE, theme: 'axon-cyan' },
    { ...EMPTY_SLIDE, theme: 'axon-dark' },
    { ...EMPTY_SLIDE, theme: 'axon-blue' },
  ]);
  const [agentOutput, setAgentOutput] = useState('');
  const [isParsingAgent, setIsParsingAgent] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  const updateSlide = (index, field, value) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSlide = () => {
    const themes = SLIDE_THEMES.map(t => t.id);
    const nextTheme = themes[slides.length % themes.length];
    setSlides(prev => [...prev, { ...EMPTY_SLIDE, theme: nextTheme }]);
    setActiveSlide(slides.length);
  };

  const removeSlide = (index) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== index));
    setActiveSlide(Math.max(0, activeSlide > 0 ? activeSlide - 1 : 0));
  };

  const moveSlide = (index, dir) => {
    const newSlides = [...slides];
    const target = index + dir;
    if (target < 0 || target >= newSlides.length) return;
    [newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]];
    setSlides(newSlides);
    setActiveSlide(target);
  };

  const parseAgentOutput = async () => {
    if (!agentOutput.trim()) return;
    setIsParsingAgent(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extrahiere aus folgendem Agenten-Output die Karussell-Folien und gib sie als strukturiertes JSON zurück.

Agenten-Output:
${agentOutput}

Gib zurück: { "slides": [ { "title": "...", "text": "...", "tag": "optionaler kurzer Tag/Label" }, ... ] }
- title: kurze, prägnante Überschrift (max. 8 Wörter)
- text: Fließtext der Folie (max. 5 Sätze)
- tag: optionaler Kategorie-Tag (z.B. "Tipp #1", "Fakt", "Warum?")
Nur JSON zurückgeben, kein anderer Text.`,
        response_json_schema: {
          type: "object",
          properties: {
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  text: { type: "string" },
                  tag: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (result?.slides?.length > 0) {
        const themes = SLIDE_THEMES.map(t => t.id);
        setSlides(result.slides.map((s, i) => ({
          ...EMPTY_SLIDE,
          ...s,
          theme: themes[i % themes.length],
          graphic: i === 0 ? 'network' : i % 3 === 1 ? 'dots' : 'none'
        })));
        setActiveSlide(0);
      }
    } finally {
      setIsParsingAgent(false);
    }
  };

  const copyAllText = () => {
    const text = slides.map((s, i) =>
      `--- Folie ${i + 1} ---\n${s.tag ? `[${s.tag}]\n` : ''}${s.title}\n${s.text}`
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const active = slides[activeSlide] || slides[0];

  return (
    <div className="space-y-6">
      {/* Agent Output Parser */}
      <div className="glass rounded-2xl border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-purple-400">Agenten-Output importieren</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">Kopiere den Output des LinkedIn-Agenten hier rein – er wird automatisch in Folien umgewandelt.</p>
        <textarea
          value={agentOutput}
          onChange={(e) => setAgentOutput(e.target.value)}
          placeholder="Agenten-Output hier einfügen..."
          className="w-full h-28 px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
        />
        <Button
          onClick={parseAgentOutput}
          disabled={isParsingAgent || !agentOutput.trim()}
          className="mt-3 bg-purple-600 hover:bg-purple-700 gap-2"
        >
          {isParsingAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isParsingAgent ? 'Wird verarbeitet...' : 'Folien extrahieren'}
        </Button>
      </div>

      {/* Editor + Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Slide List + Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-cyan-400">{slides.length} Folien</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyAllText} className="border-slate-600 text-slate-300 gap-1.5 text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Kopiert!' : 'Text kopieren'}
              </Button>
              <Button size="sm" variant="outline" onClick={addSlide} className="border-slate-600 text-slate-300 gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Folie
              </Button>
            </div>
          </div>

          {/* Slide List */}
          <div className="space-y-2">
            {slides.map((slide, index) => {
              const theme = SLIDE_THEMES.find(t => t.id === slide.theme) || SLIDE_THEMES[0];
              return (
                <motion.div
                  key={index}
                  layout
                  onClick={() => setActiveSlide(index)}
                  className={`rounded-xl border p-3 cursor-pointer transition-all ${
                    activeSlide === index
                      ? 'border-cyan-500/60 bg-cyan-500/5'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: theme.accent }} />
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{slide.title || <span className="text-slate-600 italic text-xs">Kein Titel</span>}</p>
                      {slide.text && <p className="text-xs text-slate-500 truncate mt-0.5">{slide.text}</p>}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); moveSlide(index, -1); }} className="p-1 text-slate-500 hover:text-slate-300"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveSlide(index, 1); }} className="p-1 text-slate-500 hover:text-slate-300"><ChevronDown className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeSlide(index); }} className="p-1 text-slate-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Active Slide Editor */}
          {active && (
            <div className="glass rounded-xl border border-slate-700 p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-300">Folie {activeSlide + 1} bearbeiten</h4>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Tag / Label (optional)</label>
                <input
                  type="text"
                  value={active.tag}
                  onChange={(e) => updateSlide(activeSlide, 'tag', e.target.value)}
                  placeholder="z.B. Tipp #1 · Fakt · Warum?"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Titel</label>
                <input
                  type="text"
                  value={active.title}
                  onChange={(e) => updateSlide(activeSlide, 'title', e.target.value)}
                  placeholder="Kurze, prägnante Überschrift..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Text</label>
                <textarea
                  value={active.text}
                  onChange={(e) => updateSlide(activeSlide, 'text', e.target.value)}
                  placeholder="Inhalt der Folie..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
                />
              </div>

              {/* Theme picker */}
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Farbschema</label>
                <div className="flex flex-wrap gap-2">
                  {SLIDE_THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateSlide(activeSlide, 'theme', t.id)}
                      title={t.label}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${t.bg} border-2 transition-all ${active.theme === t.id ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Graphic picker */}
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Hintergrund-Grafik</label>
                <div className="flex flex-wrap gap-2">
                  {GRAPHIC_ELEMENTS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => updateSlide(activeSlide, 'graphic', g.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                        active.graphic === g.id
                          ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="sticky top-24">
          <h3 className="text-base font-bold text-slate-300 mb-3">Vorschau – Folie {activeSlide + 1}</h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide + '-' + active?.theme + '-' + active?.graphic}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <SlidePreview slide={active} index={activeSlide} total={slides.length} />
            </motion.div>
          </AnimatePresence>

          {/* Navigation dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`rounded-full transition-all ${i === activeSlide ? 'w-4 h-2 bg-cyan-400' : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'}`}
              />
            ))}
          </div>

          {/* Theme preview row */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 mb-2">Alle Folien – Farbübersicht</p>
            <div className="flex gap-2 flex-wrap">
              {slides.map((s, i) => {
                const t = SLIDE_THEMES.find(th => th.id === s.theme) || SLIDE_THEMES[0];
                return (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs transition-all ${i === activeSlide ? 'border-cyan-500/60 text-cyan-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${t.bg} border border-slate-600`} />
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}