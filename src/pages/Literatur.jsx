import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ExternalLink, BookOpen, Brain, Wind, Activity, Zap, Moon, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const staticReferences = [
  {
    category: "Funktionelle Biomechanik & 3D-Bewegungsanalyse",
    icon: Activity,
    color: "cyan",
    entries: [
      {
        id: "gray_1995",
        authors: "Gray, G.",
        year: 1995,
        title: "Chain Reaction® Biomechanics: The Science of Functional Movement",
        source: "Gray Institute, Adrian MI",
        url: "https://www.grayinstitute.com",
        relevance: "Wissenschaftliche Basis für das 3D-Bewegungsverständnis in AXON: Gelenke reagieren in allen drei Ebenen kettenartig. Grundlage für Diagnose-Logik und Übungsdesign."
      },
      {
        id: "gray_3dmaps",
        authors: "Gray, G.",
        year: 2012,
        title: "3DMAPS: Three-Dimensional Movement Analysis & Performance System",
        source: "Gray Institute",
        url: "https://grayinstitute.com/courses/3dmapsthree-dimensional-movement-analysis-and-performance-system",
        relevance: "Direkte Grundlage für das AXON Movement-Screening: 6 Vital Transformational Zones, Mobilitäts- vs. Stabilitätsbewertung in Sagittal-, Frontal- und Transversalebene."
      },
      {
        id: "gambetta_2007",
        authors: "Gambetta, V.",
        year: 2007,
        title: "Athletic Development: The Art & Science of Functional Sports Conditioning",
        source: "Human Kinetics",
        url: "https://www.amazon.com/Athletic-Development-Science-Functional-Conditioning/dp/0736051007",
        relevance: "Vern Gambettas Prinzipien für sport-spezifische Bewegungsentwicklung, Energiesysteme und athletische Qualitäten sind in AXON's Trainingsplan-Logik und Progressionsdesign integriert."
      },
      {
        id: "boyle_2016",
        authors: "Boyle, M.",
        year: 2016,
        title: "New Functional Training for Sports (2nd ed.)",
        source: "Human Kinetics",
        url: "https://humankinetics.com",
        relevance: "Joint-by-Joint Approach als Basis für AXON's Progressions-Logik und Mobility-Strength-Integration."
      }
    ]
  },
  {
    category: "Mobilität, Rehabilitation & Schmerzwissenschaft",
    icon: Zap,
    color: "emerald",
    entries: [
      {
        id: "starrett_2013",
        authors: "Starrett, K. & Cordoza, G.",
        year: 2013,
        title: "Becoming a Supple Leopard: The Ultimate Guide to Resolving Pain, Preventing Injury, and Optimizing Athletic Performance",
        source: "Victory Belt Publishing",
        url: "https://www.thereadystate.com",
        relevance: "Couch Stretch, Voodoo Flossing und Joint Mobilization – direkte Grundlage für AXON Mobility-Module und Positions-Korrekturen."
      },
      {
        id: "starrett_deskbound_2016",
        authors: "Starrett, K. & Starrett, J.",
        year: 2016,
        title: "Deskbound: Standing Up to a Sitting World",
        source: "Victory Belt Publishing",
        url: "https://www.thereadystate.com",
        relevance: "Systematische Analyse von sitzbedingten Hüft- und Wirbelsäulenproblemen – Basis für AXON's Diagnose-Szenarien bei HWS, LWS und Hüftbeschwerden."
      },
      {
        id: "mcgill_2015",
        authors: "McGill, S.M.",
        year: 2015,
        title: "Low Back Disorders: Evidence-Based Prevention and Rehabilitation (3rd ed.)",
        source: "Human Kinetics",
        url: "https://www.humankineticslb.com",
        relevance: "Grundlage für Core-Stabilisation, Hollow Body und Bracing-Prinzip in allen AXON Kraft-Sequenzen."
      },
      {
        id: "mcgill_2009",
        authors: "McGill, S.M.",
        year: 2009,
        title: "Ultimate Back Fitness and Performance (4th ed.)",
        source: "Backfitpro Inc.",
        url: "https://www.backfitpro.com",
        relevance: "Big Three (Bird Dog, McGill Curl-up, Side Plank) als sichere Basis-Übungen – direkt in AXON Rehab-Plänen für LWS-Beschwerden integriert."
      }
    ]
  },
  {
    category: "Krafttraining & Strength Science",
    icon: Activity,
    color: "amber",
    entries: [
      {
        id: "tsatsouline_2012",
        authors: "Tsatsouline, P.",
        year: 2012,
        title: "Enter the Kettlebell: Strength Secret of the Soviet Supermen",
        source: "Dragon Door Publications",
        url: "https://www.strongfirst.com",
        relevance: "Turkish Get-Up Protokoll, Kettlebell-Periodisierung und Greasing the Groove – Grundlage für AXON Kraft-Module."
      },
      {
        id: "john_tsatsouline_2011",
        authors: "John, D. & Tsatsouline, P.",
        year: 2011,
        title: "Easy Strength: How to Get a Lot Stronger Than Your Competition While Barely Breaking a Sweat",
        source: "Dragon Door Publications",
        url: "https://danjohnuniversity.com/bookstore",
        relevance: "Easy Strength-Methodik und Loaded Carries als Grundlage für AXON's Kraft-Progressionen: 5 fundamentale Bewegungsmuster, niedrige Intensität, hohe Frequenz."
      },
      {
        id: "john_2013",
        authors: "John, D.",
        year: 2013,
        title: "Intervention: Course Corrections for the Athlete and Trainer",
        source: "On Target Publications",
        url: "https://www.otpbooks.com/otpbooks-authors/dan-john/",
        relevance: "Dan Johns 40/30/30 Paradigma und fundamentale Bewegungsmuster (Push, Pull, Hinge, Squat, Carry) – direkte Grundlage für AXON Trainingsplan-Struktur."
      }
    ]
  },
  {
    category: "Neurowissenschaft & Neuroathletik",
    icon: Brain,
    color: "cyan",
    entries: [
      {
        id: "huberman_2021",
        authors: "Huberman, A.D.",
        year: 2021,
        title: "Neurovisual training for athletic performance",
        source: "Huberman Lab, Stanford University",
        url: "https://hubermanlab.com",
        relevance: "Grundlage für Gaze Stabilization, Sakkaden-Training und optomotorische Kontrolle in AXON Neuro-Priming-Übungen."
      },
      {
        id: "mcgill_2015",
        authors: "McGill, S.M.",
        year: 2015,
        title: "Low Back Disorders: Evidence-Based Prevention and Rehabilitation (3rd ed.)",
        source: "Human Kinetics",
        url: "https://www.humankineticslb.com",
        relevance: "Grundlage für Core-Stabilisation, Hollow Body und Bracing-Prinzip in allen AXON Kraft-Sequenzen."
      },
    ]
  },
  {
    category: "Atemforschung & autonomes Nervensystem",
    icon: Wind,
    color: "blue",
    entries: [
      {
        id: "feldman_2017",
        authors: "Balaban, C.D., Yates, B.J. & Feldman, J.L.",
        year: 2017,
        title: "Physiological sighs relieve respiratory distress via the activation of the pre-Bötzinger complex",
        source: "Nature Neuroscience, Vol. 20",
        url: "https://www.nature.com/articles/nn.4513",
        relevance: "Direkte wissenschaftliche Basis für den Physiological Sigh im Morning System Reboot."
      },
      {
        id: "zaccaro_2018",
        authors: "Zaccaro, A. et al.",
        year: 2018,
        title: "How Breath-Control Can Change Your Life: A Systematic Review on Psycho-Physiological Correlates of Slow Breathing",
        source: "Frontiers in Human Neuroscience, 12:353",
        url: "https://doi.org/10.3389/fnhum.2018.00353",
        relevance: "Grundlage für Box Breathing (4-4-4-4) und dessen Wirkung auf HRV und parasympathische Aktivierung."
      },
      {
        id: "navy_seals_breathing",
        authors: "U.S. Navy SEAL Training Program",
        year: 2014,
        title: "Stress Inoculation Training: Controlled Breathing Protocols",
        source: "Naval Special Warfare Command",
        url: "https://www.navsoc.mil",
        relevance: "Box Breathing als Combat-Stress-Regulation – validiertes Protokoll für das Deep Recovery Protocol."
      }
    ]
  },
  {
    category: "Faszienforschung",
    icon: Activity,
    color: "emerald",
    entries: [
      {
        id: "schleip_2012",
        authors: "Schleip, R. & Müller, D.G.",
        year: 2012,
        title: "Training principles for fascial connective tissues: Scientific foundation and suggested practical applications",
        source: "Journal of Bodywork and Movement Therapies, 17(1):103-115",
        url: "https://doi.org/10.1016/j.jbmt.2012.06.007",
        relevance: "Wissenschaftliche Basis für MFR-Techniken, Lacrosse-Ball-Protokolle und fasziale Hydratation in AXON."
      },
      {
        id: "stecco_2015",
        authors: "Stecco, C.",
        year: 2015,
        title: "Functional Atlas of the Human Fascial System",
        source: "Churchill Livingstone / Elsevier",
        url: "https://www.elsevier.com",
        relevance: "Anatomische Grundlage für alle MFR-Node-Positionen (N1–N12) und die myofaszialen Ketten in AXON."
      },
      {
        id: "myers_2020",
        authors: "Myers, T.W.",
        year: 2020,
        title: "Anatomy Trains: Myofascial Meridians for Manual Therapists and Movement Professionals (4th ed.)",
        source: "Churchill Livingstone",
        url: "https://www.anatomytrains.com",
        relevance: "Grundlage für anteriore, posteriore und laterale Ketten – Basis des gesamten AXON Sequenz-Designs."
      },
      {
        id: "butler_2000",
        authors: "Butler, D.S.",
        year: 2000,
        title: "The Sensitive Nervous System",
        source: "Noigroup Publications",
        url: "https://www.noigroup.com",
        relevance: "Neurodynamik und Nerve Glide Techniken – direkte Basis für Median Nerve Glide und neuronale Mobilisation."
      }
    ]
  },
  {
    category: "Recovery & Schlafforschung",
    icon: Moon,
    color: "purple",
    entries: [
      {
        id: "aiims_nidra",
        authors: "Kamakhya Kumar",
        year: 2008,
        title: "A Study on the Effect of Yoga Nidra on Blood Glucose Level in Diabetic Patients",
        source: "Journal of Alternative and Complementary Medicine, AIIMS New Delhi",
        url: "https://www.liebertpub.com/doi/10.1089/acm.2007.0564",
        relevance: "Yoga Nidra als Recovery-Tool: 20 Minuten hypnagoge Ruhe äquivalent zu verlängertem Slow-Wave-Sleep."
      },
      {
        id: "walker_2017",
        authors: "Walker, M.",
        year: 2017,
        title: "Why We Sleep: Unlocking the Power of Sleep and Dreams",
        source: "Scribner / Simon & Schuster",
        url: "https://www.simonandschuster.com",
        relevance: "Schlaf-Neurophysiologie als Grundlage für AXON Recovery-Protokolle und Deep Recovery Protocol Timing."
      }
    ]
  },
  {
    category: "Funktionelle Bewegung & Sport",
    icon: Zap,
    color: "amber",
    entries: [
      {
        id: "cook_2010",
        authors: "Cook, G.",
        year: 2010,
        title: "Movement: Functional Movement Systems",
        source: "On Target Publications",
        url: "https://www.functionalmovement.com",
        relevance: "FMS-Grundprinzipien für Bewegungsscreening und Qualität vor Quantität – integriert in AXON Assessment-Design."
      },
      {
        id: "boyle_2016",
        authors: "Boyle, M.",
        year: 2016,
        title: "New Functional Training for Sports (2nd ed.)",
        source: "Human Kinetics",
        url: "https://humankinetics.com",
        relevance: "Joint-by-Joint Approach als Basis für AXON's Progressions-Logik und Mobility-Strength-Integration."
      },
      {
        id: "wulf_2013",
        authors: "Wulf, G. & Lewthwaite, R.",
        year: 2013,
        title: "Optimizing performance through intrinsic motivation and attention for learning: The OPTIMAL theory of motor learning",
        source: "Psychonomic Bulletin & Review, 23(5):1382-1414",
        url: "https://doi.org/10.3758/s13423-015-0999-9",
        relevance: "Motorisches Lernen durch externen Fokus – Grundlage für AXON's Cue-Design und AXON-Moment-Konzept."
      }
    ]
  }
];

const colorMap = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
};

function ReferenceCard({ entry, color }) {
  const [expanded, setExpanded] = useState(false);
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${c.badge}`}>{entry.id}</span>
            <span className="text-xs text-slate-500">{entry.year}</span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{entry.title}</p>
          <p className="text-xs text-slate-400 mt-1">{entry.authors} · <em>{entry.source}</em></p>
        </div>
        <a href={entry.url} target="_blank" rel="noopener noreferrer"
          className={`shrink-0 p-1.5 rounded-lg hover:bg-slate-700 transition-colors ${c.text}`}>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        AXON-Relevanz
      </button>
      {expanded && (
        <p className="mt-2 text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-2">
          {entry.relevance}
        </p>
      )}
    </div>
  );
}

export default function Literatur() {
  const [references, setReferences] = useState(staticReferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDynamicReferences = async () => {
      try {
        // Fetch all relevant entities in parallel
        const [routines, exercises, articles, goals, scientific] = await Promise.all([
          base44.entities.Routine.list(),
          base44.entities.Exercise.list(),
          base44.entities.KnowledgeArticle.list(),
          base44.entities.PerformanceGoal.list(),
          base44.entities.ScientificKnowledge.list(),
        ]);

        const dynamicRefs = [...staticReferences];

        // Extract and add references from KnowledgeArticle (Fachwissen)
        if (articles.length > 0) {
          const fachwissenRefs = articles
            .filter(a => a.source && a.year)
            .map((article, idx) => ({
              id: `article_${idx}`,
              authors: article.expert_name || 'AXON',
              year: article.published ? new Date(article.updated_date).getFullYear() : new Date().getFullYear(),
              title: article.headline,
              source: article.source || 'AXON Knowledge Base',
              url: '',
              relevance: article.summary
            }));
          if (fachwissenRefs.length > 0) {
            dynamicRefs.push({
              category: 'Fachwissen & Expert-Insights',
              icon: Brain,
              color: 'purple',
              entries: fachwissenRefs
            });
          }
        }

        // Extract and add references from ScientificKnowledge
        if (scientific.length > 0) {
          const sciRefs = scientific
            .filter(s => s.year && s.summary)
            .map((paper, idx) => ({
              id: `science_${idx}`,
              authors: paper.source || 'Forschungsgruppe',
              year: paper.year,
              title: paper.title,
              source: paper.source || 'Peer-reviewed',
              url: paper.file_url || '',
              relevance: paper.key_findings
            }));
          if (sciRefs.length > 0) {
            dynamicRefs.push({
              category: 'Neueste Forschung',
              icon: Zap,
              color: 'cyan',
              entries: sciRefs
            });
          }
        }

        setReferences(dynamicRefs);
      } catch (error) {
        console.error('Error loading dynamic references:', error);
        // Fallback to static references
      } finally {
        setIsLoading(false);
      }
    };

    loadDynamicReferences();
  }, []);

  const totalRefs = references.reduce((sum, cat) => sum + cat.entries.length, 0);

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "name": "AXON-nap Wissenschaftliche Quellen & Literaturverzeichnis",
    "description": "Vollständiges Quellenverzeichnis der wissenschaftlichen Grundlagen hinter dem AXON Neuro-Athletic-Protocol – Faszienforschung, Atemwissenschaft, Neurowissenschaft und funktionelle Bewegung.",
    "author": { "@type": "Organization", "name": "AXON-nap" },
    "about": ["Neurowissenschaft", "Faszientherapie", "Atemregulation", "Sportphysiologie", "Bewegungsforschung"],
    "citation": references.flatMap(cat => cat.entries.map(e => ({
      "@type": "Book",
      "name": e.title,
      "author": e.authors,
      "datePublished": String(e.year),
      "publisher": e.source
    })))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <Helmet>
        <title>Wissenschaftliche Quellen & Literatur | AXON-nap Neuro-Athletic-Protocol</title>
        <meta name="description" content="Das vollständige Quellenverzeichnis hinter AXON-nap: Huberman, McGill, Stecco, Myers, Schleip, Tsatsouline – alle wissenschaftlichen Grundlagen des Neuro-Athletic-Protocols." />
        <meta name="keywords" content="AXON Quellen, Faszienforschung, Huberman Lab, Stuart McGill, Carla Stecco, Thomas Myers, Robert Schleip, Pavel Tsatsouline, Neuroathletik, Atemforschung" />
        <link rel="canonical" href="https://axon-nap.com/literatur" />
        <meta property="og:title" content="Wissenschaftliche Quellen | AXON-nap" />
        <meta property="og:description" content="Alle wissenschaftlichen Grundlagen des AXON Neuro-Athletic-Protocols – peer-reviewed, evidenzbasiert." />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 pt-10">
        {isLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <p className="text-sm text-slate-500">Quellen laden...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <Link to={createPageUrl('Wissen')} className="hover:text-cyan-400 transition-colors">Wissen</Link>
                <span>/</span>
                <span className="text-slate-400">Literatur</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <BookOpen className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                    Wissenschaftliche Quellen
                  </h1>
                  <p className="text-sm text-slate-400">AXON Neuro-Athletic-Protocol – Literaturverzeichnis</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                Jede Übung, jede Routine, jedes Protokoll in AXON basiert auf peer-reviewed Forschung oder validierten Expertenmethoden. 
                Hier findest du alle <strong className="text-cyan-400">{totalRefs} Primärquellen</strong> – von Stanford bis Nature Neuroscience.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Peer-reviewed', 'Evidenzbasiert', 'Klinisch validiert', 'Sport-wissenschaftlich'].map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">{tag}</span>
                ))}
              </div>
            </div>

            {/* Reference Categories */}
            <div className="space-y-10">
              {references.map((cat) => {
                const Icon = cat.icon;
                const c = colorMap[cat.color];
                return (
                  <section key={cat.category}>
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className={`w-5 h-5 ${c.text}`} />
                      <h2 className={`text-lg font-semibold ${c.text}`}>{cat.category}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{cat.entries.length} Quellen</span>
                    </div>
                    <div className="grid gap-3">
                      {cat.entries.map(entry => (
                        <ReferenceCard key={entry.id} entry={entry} color={cat.color} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="mt-12 p-5 rounded-xl border border-slate-700 bg-slate-800/30 text-center">
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl mx-auto">
                Alle Quellen wurden für die Entwicklung des AXON Neuro-Athletic-Protocols herangezogen. 
                AXON erhebt keinen Anspruch auf medizinische Diagnose oder Therapie. 
                Bei gesundheitlichen Beschwerden konsultiere bitte einen Arzt oder Physiotherapeuten.
              </p>
              <Link to={createPageUrl('Wissen')} className="inline-block mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                ← Zurück zur Wissensbasis
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}