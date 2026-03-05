import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Zap, Activity, Brain, Lightbulb, Wrench } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const dbFaqs = [];

  const faqs = [
    {
      question: "Was ist AXON-nap und was bedeutet der Name?",
      answer: "AXON-nap steht für Neuro Athletic Protocol – ein ganzheitliches Trainingssystem, das Faszien-Release (MFR), Neuro-Athletik und funktionelles Training kombiniert. Der Name verweist auf das Nervensystem (AXON = Nervenfaser) und das zugrundeliegende Protokoll (nap = Neuro Athletic Protocol). AXON-nap analysiert dein System über Hardware-Tests und Neuro-Drills, identifiziert Schwachstellen und erstellt personalisierte Trainingspläne. Du erhältst präzise Anleitungen für jeden Schritt – von der Diagnose bis zur Rehabilitation oder Performance-Steigerung."
    },
    {
      question: "Für wen ist AXON-nap geeignet?",
      answer: "AXON-nap eignet sich für jeden, der seinen Körper besser verstehen und optimieren möchte. Ob du akute Schmerzen lösen, sportliche Ziele erreichen oder dein System täglich pflegen willst – AXON-nap passt sich deinem Level an. Von Anfängern bis zu fortgeschrittenen Athleten."
    },
    {
      question: "Was bedeuten REHAB, GOALS und FLOW?",
      answer: "REHAB analysiert akute Beschwerden und erstellt einen phasierten Wiederherstellungsplan. GOALS hilft dir, konkrete sportliche Ziele zu erreichen (z.B. Klimmzüge, Pistol Squat) durch strukturierte Trainingspläne. FLOW bietet tägliche 5-30 Min Wartungsroutinen für Faszien, Mobility und Regeneration."
    },
    {
      question: "Wie funktioniert der Daily Readiness Check?",
      answer: "Der Daily Readiness Check basiert auf wissenschaftlichen Erkenntnissen aus der HRV-Forschung (Heart Rate Variability) und Neuro-Athletik. Jeden Tag bewertest du drei Bereiche: Gefühl (Hardware) = Wie beweglich fühlt sich dein Gewebe an? Studien zeigen, dass subjektive Steifheit stark mit faszialer Dehydrierung korreliert. Fokus (Software) = Wie klar ist deine kognitive Leistung? Die Pupillenweite und Reaktionszeit korrelieren direkt mit ZNS-Müdigkeit. Energie (Batterie) = Wie voll sind deine Reserven? Dies reflektiert HRV und autonome Balance. AXON-nap kombiniert diese 3 Dimensionen zu einem Readiness-Score (Grün/Gelb/Rot) und passt deine Trainingsempfehlungen automatisch an. Das Prinzip: Wenn dein Nervensystem gestresst ist (Rot), erhöht intensives Training das Verletzungsrisiko – stattdessen fokussiert AXON-nap auf Regeneration und sanfte Reize."
    },
    {
      question: "Was sind MFR-Nodes und wie setze ich sie ein?",
      answer: "MFR (Myofascial Release) Nodes sind 12 präzise Punkte am Körper basierend auf dem Stecco-Modell. Jeder Node entspricht einem fascial coordination center. Du komprimierst den Punkt 60-90 Sekunden mit einem Lacrosse-Ball oder ähnlichem Tool, um verklebtes Gewebe zu lösen und die Bewegungsfreiheit wiederherzustellen."
    },
    {
      question: "Brauche ich Equipment für AXON-nap?",
      answer: "Für die meisten Flow-Routinen brauchst du nur deinen Körper. Für MFR-Release empfehlen wir einen Lacrosse-Ball oder Faszienball. Für Performance-Training können je nach Ziel eine Klimmzugstange, Widerstandsbänder oder ähnliches Equipment hilfreich sein – aber nicht zwingend notwendig."
    },
    {
      question: "Wie oft sollte ich AXON-nap nutzen?",
      answer: "Das hängt von deinem Modus ab: FLOW-Routinen sind als tägliche Maintenance gedacht (5-15 Min). REHAB-Pläne folgen einem strukturierten Phasenmodell. GOALS-Training ist 3-5x pro Woche optimal. Der Daily Readiness Check hilft dir, die richtige Frequenz für deinen Körper zu finden."
    },
    {
      question: "Was ist der Unterschied zwischen Hardware und Software?",
      answer: "Hardware = mechanische Einschränkungen (steife Faszien, eingeschränkte Gelenke, Muskelspannung). Software = neurologische Limitierungen (fehlerhafte Bewegungsmuster, visuelle/vestibulare Defizite, eingeschränkte Koordination). AXON-nap testet beide Ebenen und adressiert die Root Cause deines Problems."
    },
    {
      question: "Kann AXON-nap einen Physiotherapeuten ersetzen?",
      answer: "AXON-nap ist ein Werkzeug zur Selbsthilfe und Prävention, kein Ersatz für medizinische Behandlung. Bei akuten Verletzungen, chronischen Erkrankungen oder starken Schmerzen solltest du immer einen Arzt oder Physiotherapeuten konsultieren. AXON-nap hilft dir, dein System zwischen Therapiesitzungen zu pflegen und langfristig gesund zu halten."
    },
    {
      question: "Wie funktioniert die 7-Tage-Testphase?",
      answer: "Du erhältst 7 Tage vollen Zugriff auf alle Features – REHAB, GOALS und FLOW. Keine Kreditkarte erforderlich. Nach 7 Tagen entscheidest du, ob du für 59€ einmalig lebenslangen Zugriff kaufen möchtest. Kein Abo, keine versteckten Kosten."
    },
    {
      question: "Was passiert nach dem Kauf?",
      answer: "Nach der einmaligen Zahlung von 59€ hast du lebenslangen Zugriff auf AXON-nap – alle aktuellen und zukünftigen Features inklusive. Kein monatliches Abo. Du zahlst einmal und nutzt AXON-nap unbegrenzt. 30 Tage Geld-zurück-Garantie, falls du nicht zufrieden bist."
    },
    {
      question: "Sind meine Daten sicher?",
      answer: "Ja. Alle deine Gesundheitsdaten werden verschlüsselt gespeichert und nur zur Personalisierung deiner Trainingspläne verwendet. Wir verkaufen keine Daten an Dritte. Du kannst dein Konto und alle Daten jederzeit löschen."
    },
    {
      question: "Funktioniert AXON-nap auf meinem Smartphone?",
      answer: "Ja, AXON-nap ist eine Progressive Web App (PWA) und funktioniert auf jedem modernen Smartphone, Tablet oder Desktop-Browser. Du brauchst keine native App herunterzuladen. Tipp: Installiere AXON-nap auf deinem Homescreen für eine App-ähnliche Erfahrung. So geht's: iPhone: Safari öffnen → Teilen-Icon → 'Zum Home-Bildschirm'. Android: Chrome öffnen → Menü (3 Punkte) → 'Zum Startbildschirm hinzufügen'. Danach startet AXON-nap wie eine native App – kein Browser-Interface, Vollbild-Modus und schnellerer Zugriff."
    },
    {
      question: "Was ist, wenn ich eine Übung nicht verstehe?",
      answer: "Jede Übung hat detaillierte Schritt-für-Schritt-Anleitungen, Bilder und Tooltips mit Fachbegriffen (z.B. Dorsiflexion, Torque). Du kannst jederzeit Progressions-Varianten (leichter/schwerer) einsehen. Bei Fragen steht dir der AI-Coach zur Seite."
    },
    {
      question: "Kann ich AXON-nap parallel zu meinem aktuellen Training nutzen?",
      answer: "Absolut! AXON-nap ergänzt dein bestehendes Training perfekt. FLOW-Routinen sind ideal als Warm-up oder Cool-down. REHAB hilft bei akuten Problemen. GOALS kann als eigenständiges Programm oder als Ergänzung zu deinem Sport genutzt werden. Der Readiness Check stellt sicher, dass du nicht übertrainierst."
    }
  ];

  // Kombiniere statische + DB-FAQs für JSON-LD Schema
  const allForSchema = [
    ...faqs,
    ...dbFaqs.map(f => ({ question: f.question, answer: f.answer }))
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allForSchema.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20 px-4">
      <Helmet>
        <title>FAQ - Häufig gestellte Fragen | AXON-nap – Neuro Athletic Protocol</title>
        <meta name="description" content="Alle Antworten zu AXON-nap (Neuro Athletic Protocol): Funktionsweise, Training, MFR-Nodes, Daily Readiness Check und mehr." />
        <meta name="keywords" content="AXON-nap FAQ, Neuro Athletic Protocol, Neuro-Training Anleitung, MFR erklärt, Faszienmobilität Tutorial" />
        
        {/* Open Graph */}
        <meta property="og:title" content="FAQ - AXON-nap Neuro Athletic Protocol" />
        <meta property="og:description" content="Alle Antworten zu AXON-nap Training, MFR-Nodes, Readiness Check und mehr" />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FAQ - AXON-nap | Neuro Athletic Protocol" />
        <meta name="twitter:description" content="Alle Antworten zu AXON-nap: Funktionsweise, Training, MFR-Nodes und mehr." />
        
        {/* Structured Data - alle FAQs inkl. DB-FAQs */}
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 mx-auto shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4 tracking-tight">
            Häufig gestellte Fragen
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Schnelle Antworten zum AXON-Protokoll – versteh dein System, kenn dein Protokoll.
          </p>
        </motion.div>

        {/* Hero: AXON Workflow – kausal verbunden */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-14 rounded-3xl border border-slate-700/50 bg-slate-900/70 overflow-hidden p-6 md:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 text-center mb-6">So funktioniert AXON – in einem Beispiel</p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">

            {/* Schritt 1: Symptom */}
            <div className="rounded-xl bg-slate-950 border border-slate-700/80 overflow-hidden flex flex-col">
              {/* Header Bar wie echter Check */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white">AXON Bio-Sync</p>
                  <p className="text-[9px] text-slate-500 tracking-widest uppercase">System-Kalibrierung</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { Icon: Wrench, label: 'HARDWARE', sublabel: 'Körpergefühl', value: 7, status: 'NOMINAL', critical: false },
                  { Icon: Brain, label: 'SOFTWARE', sublabel: 'Fokus & Kognition', value: 3, status: 'KRITISCH', critical: true },
                  { Icon: Zap, label: 'BATTERIE', sublabel: 'Energielevel', value: 6, status: 'NOMINAL', critical: false },
                ].map(({ Icon, label, sublabel, value, status, critical }) => (
                  <div key={label} className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-slate-200 uppercase">{label}</p>
                          <p className="text-[10px] text-slate-400">{sublabel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-white">{value}</span>
                        <span className="text-xs text-slate-600 font-mono">/10</span>
                        <p className={`text-[9px] font-bold tracking-widest mt-0.5 ${critical ? 'text-red-400' : 'text-cyan-400'}`}>{status}</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-lg bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-lg ${critical ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${value * 10}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] font-mono text-slate-500 border-l-2 border-cyan-500/40 pl-2">SOFTWARE kritisch — neurologische Ursache erkannt</p>
              </div>
            </div>

            {/* Pfeil 1 */}
            <div className="flex justify-center items-center text-slate-500 text-xl font-black rotate-90 md:rotate-0">→</div>

            {/* Schritt 2: Ursache */}
            <div className="rounded-xl bg-slate-950 border border-slate-700/80 overflow-hidden flex flex-col">
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white">Ursache lokalisiert</p>
                  <p className="text-[9px] text-slate-500 tracking-widest uppercase">MFR Node Analyse</p>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
                  <p className="text-[10px] font-bold tracking-widest text-purple-400 uppercase mb-1">MFR Node N3</p>
                  <p className="text-white font-bold text-sm">Schädelbasis</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">Stecco CC · Koordiniert vestibuläre Stabilität und visuelle Schärfe – typische Ursache für Tunnelblick und Konzentrationsmangel.</p>
                <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5">
                  <Brain className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <p className="text-[10px] font-mono text-slate-300">Nicht der Muskel – neurologischer Ursprung</p>
                </div>
              </div>
            </div>

            {/* Pfeil 2 */}
            <div className="flex justify-center items-center text-slate-500 text-xl font-black rotate-90 md:rotate-0">→</div>

            {/* Schritt 3: Ergebnis */}
            <div className="rounded-xl bg-slate-950 border border-slate-700/80 overflow-hidden flex flex-col">
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white">Problem gelöst</p>
                  <p className="text-[9px] text-slate-500 tracking-widest uppercase">90s Protokoll</p>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-xs text-slate-200">Horizontale Sakkaden (30s) → Fokus ↑</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-xs text-slate-200">Integration: Chin Tucks · neuronale Verankerung</p>
                  </div>
                </div>
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 px-3 py-2.5">
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-400 font-mono text-[10px] tracking-widest uppercase">Fokus (Software)</span>
                    <span className="text-emerald-400 font-mono">3 → 8/10</span>
                  </div>
                  <div className="h-1.5 rounded-lg bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-lg bg-emerald-500 w-4/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              to={createPageUrl('Landing')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Dein System analysieren – 7 Tage kostenlos →
            </Link>
          </div>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass rounded-2xl border transition-all duration-300 overflow-hidden group ${
                openIndex === index ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-slate-900/80' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h3 className={`text-lg font-bold pr-4 transition-colors ${
                  openIndex === index ? 'text-blue-400' : 'text-slate-200 group-hover:text-blue-300'
                }`}>
                  {faq.question}
                </h3>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  openIndex === index ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-blue-300'
                }`}>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-slate-800/50 pt-4">
                      <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                      {faq.pro_tip && (
                        <div className="mt-4 flex gap-3 border-l-2 border-cyan-500/60 pl-4 py-1">
                          <Lightbulb className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-cyan-300/80 leading-relaxed">{faq.pro_tip}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Dynamische FAQs aus der Datenbank */}
        {dbFaqs.length > 0 && (
          <div className="space-y-4 mt-4">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 mt-8">Neuroathletik & Training</h2>
            {dbFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`glass rounded-2xl border transition-all duration-300 overflow-hidden group ${
                  openIndex === `db-${index}` ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-slate-900/80' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === `db-${index}` ? null : `db-${index}`)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <h3 className={`text-lg font-bold pr-4 transition-colors ${
                    openIndex === `db-${index}` ? 'text-blue-400' : 'text-slate-200 group-hover:text-blue-300'
                  }`}>
                    {faq.question}
                  </h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    openIndex === `db-${index}` ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-blue-300'
                  }`}>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIndex === `db-${index}` ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openIndex === `db-${index}` && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 border-t border-slate-800/50 pt-4">
                        <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                        {faq.pro_tip && (
                          <div className="mt-4 flex gap-3 border-l-2 border-cyan-500/60 pl-4 py-1">
                            <Lightbulb className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-cyan-300/80 leading-relaxed">{faq.pro_tip}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 glass rounded-3xl border border-purple-500/30 p-8 sm:p-12 text-center bg-gradient-to-br from-slate-900/50 to-purple-950/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-2xl sm:text-3xl font-bold text-purple-400 mb-3 tracking-tight">
            Noch Fragen?
          </h3>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto">
            Starte deine 7-Tage-Testphase und erlebe AXON selbst – alle Features, kein Risiko.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-95 relative z-10"
          >
            Jetzt kostenlos testen
          </a>
        </motion.div>
      </div>
    </div>
  );
}