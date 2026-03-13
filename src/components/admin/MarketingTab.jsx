import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, ExternalLink, Copy, Check, Sparkles, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import CarouselBuilder from './CarouselBuilder';

const LINKEDIN_PROFILE = 'https://www.linkedin.com/in/v-schumacher/';

const POST_TEMPLATES = [
  {
    label: '🧠 Neuro-Athletic Launch',
    text: `Ich habe die letzten Monate daran gearbeitet, etwas Neues aufzubauen – und heute teile ich es:

🔬 AXON Protocol – das erste Neuro-Athletic-System für Selbstdiagnose, Rehab und Performance.

Kein klassisches Fitnessprogramm. Keine App, die dir sagt "mach 3x10".

Sondern ein System, das dein Nervensystem versteht – und darauf aufbaut.

Fasziale Ketten nach Stecco → Neuro-Drills → Bewegungsintegration.

7 Tage kostenlos testen → axon-nap.de

#NeuroAthletics #Rehab #Movement #AXON`,
  },
  {
    label: '💡 Pain is a Signal',
    text: `Ein Gedanke, der alles verändert hat:

Schmerz ist kein Gewebsproblem. Schmerz ist ein Gehirnsignal.

Das bedeutet: Wenn dein Rücken wehtut, ist die Ursache fast nie dort, wo der Schmerz ist.

Stuart McGill hat das in Jahrzehnten Forschung belegt.
Kelly Starrett hat es in Millionen Behandlungen gesehen.

AXON übersetzt diese Erkenntnisse in ein 10-Minuten-Protokoll – für jeden, täglich.

Mehr dazu: axon-nap.de/Wissen

#NeuroAthletics #Schmerz #Performance #AXON`,
  },
  {
    label: '⚡ Hardware vs Software',
    text: `Warum klassisches Dehnen nicht funktioniert (und was wirklich hilft):

Dein Körper hat zwei Probleme:
🔧 HARDWARE → Fasziale Einschränkungen, Gewebsspannung
💻 SOFTWARE → Das Nervensystem, das diese Spannung steuert

Die meisten Trainingsansätze arbeiten nur an einem.

AXON adressiert beide – in der richtigen Reihenfolge.

Hardware-Release (90s MFR) → Software-Reset (Neuro-Drill) → Integration (Kraft)

Das ist kein Trend. Das ist Neurologie.

#Bewegung #Faszien #NeuroAthletics`,
  },
];

export default function MarketingTab() {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [aiTopic, setAiTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGeneratePost = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    setGeneratedPost('');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Erstelle einen professionellen LinkedIn-Post für Vanessa Schumacher, Gründerin von AXON Protocol (axon-nap.de).

Thema: ${aiTopic}

AXON ist ein Neuro-Athletic-Protokoll basierend auf:
- Faszien-Wissenschaft (Stecco, Myers)
- Neuro-Drills (neurologische Steuerung)
- Bewegungsintegration (McGill, Starrett, Gray Cook)

Stil: Authentisch, direkt, wissenschaftlich fundiert aber verständlich. Deutsche Sprache. 
Keine Hashtag-Flut. Max 4-5 relevante Hashtags am Ende.
Länge: 150-250 Wörter. Mit Zeilenumbrüchen für Lesbarkeit auf Mobile.`,
      });
      setGeneratedPost(result);
    } catch (e) {
      setGeneratedPost('Fehler beim Generieren. Bitte erneut versuchen.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* LinkedIn Profile Card */}
      <div className="glass rounded-2xl border border-blue-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0077B5]/20 border border-[#0077B5]/40 flex items-center justify-center">
              <Linkedin className="w-6 h-6 text-[#0077B5]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">LinkedIn</h2>
              <p className="text-sm text-slate-400">v-schumacher</p>
            </div>
          </div>
          <a
            href={LINKEDIN_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="border-[#0077B5]/50 text-[#0077B5] hover:bg-[#0077B5]/10 gap-2">
              <ExternalLink className="w-4 h-4" />
              Profil öffnen
            </Button>
          </a>
        </div>
        <p className="text-slate-300 text-sm">
          Dein LinkedIn-Profil ist verknüpft. Erstelle Posts direkt hier und poste sie mit einem Klick.
        </p>
      </div>

      {/* AI Post Generator */}
      <div className="glass rounded-2xl border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-purple-400">KI Post-Generator</h3>
        </div>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Thema eingeben (z.B. 'Rückenschmerzen MRT', 'Neuro-Drills erklären'...)"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGeneratePost()}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
          <Button
            onClick={handleGeneratePost}
            disabled={isGenerating || !aiTopic.trim()}
            className="bg-purple-600 hover:bg-purple-700 gap-2 shrink-0"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Generiert...' : 'Generieren'}
          </Button>
        </div>
        {generatedPost && (
          <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4 relative">
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{generatedPost}</pre>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(generatedPost, 'ai')}
                className="gap-2 border-slate-600 text-slate-300"
              >
                {copiedIndex === 'ai' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copiedIndex === 'ai' ? 'Kopiert!' : 'Kopieren'}
              </Button>
              <a
                href={`https://www.linkedin.com/feed/?shareActive=true`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" className="bg-[#0077B5] hover:bg-[#006396] gap-2">
                  <Linkedin className="w-4 h-4" />
                  Auf LinkedIn posten
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Post Templates */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">
        <h3 className="text-lg font-bold text-cyan-400 mb-4">📋 Post-Vorlagen</h3>
        <div className="space-y-4">
          {POST_TEMPLATES.map((template, index) => (
            <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-200">{template.label}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(template.text, index)}
                    className="gap-1.5 text-slate-400 hover:text-white h-8"
                  >
                    {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-xs">{copiedIndex === index ? 'Kopiert!' : 'Kopieren'}</span>
                  </Button>
                  <a
                    href={`https://www.linkedin.com/feed/?shareActive=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="bg-[#0077B5]/80 hover:bg-[#0077B5] h-8 gap-1.5">
                      <Linkedin className="w-3.5 h-3.5" />
                      <span className="text-xs">Posten</span>
                    </Button>
                  </a>
                </div>
              </div>
              <pre className="text-slate-400 text-xs whitespace-pre-wrap font-sans leading-relaxed line-clamp-4">
                {template.text}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}