import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Sparkles, Download, Image, ChevronUp, ChevronDown, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const AXON_STYLE_SUFFIX = `
Visueller Stil: Dunkler Hintergrund (Dunkelblau/Schwarz), cyan/blaue Akzentfarbe (#06b6d4), 
moderne minimalistische Typografie, kein Clipart-Look. 
Medizinisch-athletisch, professionell, kein Stock-Photo-Feel.
Das Bild soll zu einem LinkedIn-Karussell-Post passen, hochkant (4:5 Format).`;

const EMPTY_SLIDE = { title: '', text: '', visualIdea: '', imageUrl: null, isGenerating: false };

export default function CarouselBuilder() {
  const [slides, setSlides] = useState([
    { ...EMPTY_SLIDE },
    { ...EMPTY_SLIDE },
    { ...EMPTY_SLIDE },
  ]);
  const [topic, setTopic] = useState('');
  const [isParsingAgent, setIsParsingAgent] = useState(false);
  const [agentOutput, setAgentOutput] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const updateSlide = (index, field, value) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSlide = () => {
    setSlides(prev => [...prev, { ...EMPTY_SLIDE }]);
    setActiveSlide(slides.length);
  };

  const removeSlide = (index) => {
    setSlides(prev => prev.filter((_, i) => i !== index));
    setActiveSlide(Math.max(0, activeSlide - 1));
  };

  const moveSlide = (index, dir) => {
    const newSlides = [...slides];
    const target = index + dir;
    if (target < 0 || target >= newSlides.length) return;
    [newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]];
    setSlides(newSlides);
    setActiveSlide(target);
  };

  const generateImageForSlide = async (index) => {
    const slide = slides[index];
    if (!slide.visualIdea && !slide.title) return;
    updateSlide(index, 'isGenerating', true);
    try {
      const prompt = `LinkedIn Karussell Folie ${index + 1}: "${slide.title}". ${slide.visualIdea || slide.text}${AXON_STYLE_SUFFIX}`;
      const result = await base44.integrations.Core.GenerateImage({ prompt });
      updateSlide(index, 'imageUrl', result.url);
    } finally {
      updateSlide(index, 'isGenerating', false);
    }
  };

  const generateAllImages = async () => {
    for (let i = 0; i < slides.length; i++) {
      if (!slides[i].imageUrl && (slides[i].visualIdea || slides[i].title)) {
        await generateImageForSlide(i);
      }
    }
  };

  const parseAgentOutput = async () => {
    if (!agentOutput.trim()) return;
    setIsParsingAgent(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extrahiere aus folgendem Agenten-Output die Karussell-Folien und gib sie als JSON zurück.
        
Agenten-Output:
${agentOutput}

Gib zurück als JSON Array: [{"title": "...", "text": "...", "visualIdea": "..."}, ...]
Nur das JSON Array, kein anderer Text.`,
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
                  visualIdea: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (result?.slides?.length > 0) {
        setSlides(result.slides.map(s => ({ ...EMPTY_SLIDE, ...s })));
        setActiveSlide(0);
      }
    } finally {
      setIsParsingAgent(false);
    }
  };

  const hasImages = slides.some(s => s.imageUrl);
  const pendingSlides = slides.filter(s => !s.imageUrl && (s.visualIdea || s.title)).length;

  return (
    <div className="space-y-6">
      {/* Agent Output Parser */}
      <div className="glass rounded-2xl border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-purple-400">Agenten-Output importieren</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">Kopiere den kompletten Output des LinkedIn-Agenten hier rein – er wird automatisch in Folien umgewandelt.</p>
        <textarea
          value={agentOutput}
          onChange={(e) => setAgentOutput(e.target.value)}
          placeholder="Agenten-Output hier einfügen (Folie 1: Titel | Text | Visual-Idee ...)..."
          className="w-full h-32 px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
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

      {/* Slides Editor + Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Slide List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-cyan-400">{slides.length} Folien</h3>
            <div className="flex gap-2">
              {pendingSlides > 0 && (
                <Button
                  size="sm"
                  onClick={generateAllImages}
                  className="bg-cyan-600 hover:bg-cyan-700 gap-1.5 text-xs"
                >
                  <Image className="w-3.5 h-3.5" />
                  Alle Bilder generieren ({pendingSlides})
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={addSlide} className="border-slate-600 text-slate-300 gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Folie
              </Button>
            </div>
          </div>

          {slides.map((slide, index) => (
            <motion.div
              key={index}
              layout
              onClick={() => setActiveSlide(index)}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                activeSlide === index
                  ? 'border-cyan-500/60 bg-cyan-500/5'
                  : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => updateSlide(index, 'title', e.target.value)}
                    placeholder="Folientitel..."
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none mb-1"
                  />
                  <textarea
                    value={slide.text}
                    onChange={(e) => updateSlide(index, 'text', e.target.value)}
                    placeholder="Text der Folie..."
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                    rows={2}
                  />
                  <input
                    type="text"
                    value={slide.visualIdea}
                    onChange={(e) => updateSlide(index, 'visualIdea', e.target.value)}
                    placeholder="Visual-Idee für KI-Bild..."
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-xs text-purple-400/70 placeholder-slate-600 focus:outline-none mt-1"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); moveSlide(index, -1); }} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveSlide(index, 1); }} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); generateImageForSlide(index); }}
                    disabled={slide.isGenerating}
                    className="p-1 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                    title="Bild generieren"
                  >
                    {slide.isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : slide.imageUrl ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Image className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeSlide(index); }} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right: Preview */}
        <div className="sticky top-24">
          <h3 className="text-base font-bold text-slate-300 mb-3">Vorschau – Folie {activeSlide + 1}</h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="aspect-[4/5] rounded-2xl overflow-hidden relative bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 flex flex-col"
            >
              {slides[activeSlide]?.imageUrl ? (
                <img
                  src={slides[activeSlide].imageUrl}
                  alt="Generated"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30" />
              )}
              {/* AXON Brand overlay */}
              <div className="relative z-10 flex flex-col h-full p-8 justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-cyan-400/80 uppercase">AXON-nap</span>
                  <span className="text-[10px] text-slate-500">{activeSlide + 1}/{slides.length}</span>
                </div>
                <div>
                  {slides[activeSlide]?.title && (
                    <h2 className="text-2xl font-black text-white leading-tight mb-4">
                      {slides[activeSlide].title}
                    </h2>
                  )}
                  {slides[activeSlide]?.text && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {slides[activeSlide].text}
                    </p>
                  )}
                  {!slides[activeSlide]?.title && !slides[activeSlide]?.text && (
                    <p className="text-slate-600 text-sm italic">Folie bearbeiten...</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-8 bg-cyan-400 rounded-full" />
                  <span className="text-[10px] text-slate-500 font-mono">axon-nap.de</span>
                </div>
              </div>
              {/* Generate button overlay if no image */}
              {!slides[activeSlide]?.imageUrl && !slides[activeSlide]?.isGenerating && (
                <button
                  onClick={() => generateImageForSlide(activeSlide)}
                  className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold transition-all backdrop-blur-sm"
                >
                  <Image className="w-3.5 h-3.5" />
                  Bild generieren
                </button>
              )}
              {slides[activeSlide]?.isGenerating && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-xs text-slate-400">Generiere Bild...</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`rounded-full transition-all ${
                  i === activeSlide ? 'w-4 h-2 bg-cyan-400' : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          {/* Download all images */}
          {hasImages && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-500 text-center">Bilder speichern</p>
              <div className="grid grid-cols-2 gap-2">
                {slides.filter(s => s.imageUrl).map((s, i) => (
                  <a
                    key={i}
                    href={s.imageUrl}
                    download={`axon-karussell-folie-${i + 1}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-400 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Folie {slides.indexOf(s) + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}