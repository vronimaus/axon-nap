import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Was ist AXON und wie funktioniert es?",
      answer: "AXON ist ein Neuro-Athletic Protocol, das Faszien-Release (MFR), Neuro-Athletik und funktionelles Training kombiniert. Die App analysiert dein System über Hardware-Tests und Neuro-Drills, identifiziert Schwachstellen und erstellt personalisierte Trainingspläne. Du erhältst präzise Anleitungen für jeden Schritt – von der Diagnose bis zur Rehabilitation oder Performance-Steigerung."
    },
    {
      question: "Für wen ist AXON geeignet?",
      answer: "AXON eignet sich für jeden, der seinen Körper besser verstehen und optimieren möchte. Ob du akute Schmerzen lösen, sportliche Ziele erreichen oder dein System täglich pflegen willst – AXON passt sich deinem Level an. Von Anfängern bis zu fortgeschrittenen Athleten."
    },
    {
      question: "Was bedeuten REHAB, GOALS und FLOW?",
      answer: "REHAB analysiert akute Beschwerden und erstellt einen phasierten Wiederherstellungsplan. GOALS hilft dir, konkrete sportliche Ziele zu erreichen (z.B. Klimmzüge, Pistol Squat) durch strukturierte Trainingspläne. FLOW bietet tägliche 5-30 Min Wartungsroutinen für Faszien, Mobility und Regeneration."
    },
    {
      question: "Wie funktioniert der Daily Readiness Check?",
      answer: "Der Daily Readiness Check basiert auf wissenschaftlichen Erkenntnissen aus der HRV-Forschung (Heart Rate Variability) und Neuro-Athletik. Jeden Tag bewertest du drei Bereiche: **Gefühl (Hardware)** = Wie beweglich fühlt sich dein Gewebe an? Studien zeigen, dass subjektive Steifheit stark mit faszialer Dehydrierung korreliert. **Fokus (Software)** = Wie klar ist deine kognitive Leistung? Die Pupillenweite und Reaktionszeit korrelieren direkt mit ZNS-Müdigkeit. **Energie (Batterie)** = Wie voll sind deine Reserven? Dies reflektiert HRV und autonome Balance. AXON kombiniert diese 3 Dimensionen zu einem Readiness-Score (Grün/Gelb/Rot) und passt deine Trainingsempfehlungen automatisch an. Das Prinzip: Wenn dein Nervensystem gestresst ist (Rot), erhöht intensives Training das Verletzungsrisiko – stattdessen fokussiert AXON auf Regeneration und sanfte Reize."
    },
    {
      question: "Was sind MFR-Nodes und wie setze ich sie ein?",
      answer: "MFR (Myofascial Release) Nodes sind 12 präzise Punkte am Körper basierend auf dem Stecco-Modell. Jeder Node entspricht einem fascial coordination center. Du komprimierst den Punkt 60-90 Sekunden mit einem Lacrosse-Ball oder ähnlichem Tool, um verklebtes Gewebe zu lösen und die Bewegungsfreiheit wiederherzustellen."
    },
    {
      question: "Brauche ich Equipment für AXON?",
      answer: "Für die meisten Flow-Routinen brauchst du nur deinen Körper. Für MFR-Release empfehlen wir einen Lacrosse-Ball oder Faszienball. Für Performance-Training können je nach Ziel eine Klimmzugstange, Widerstandsbänder oder ähnliches Equipment hilfreich sein – aber nicht zwingend notwendig."
    },
    {
      question: "Wie oft sollte ich AXON nutzen?",
      answer: "Das hängt von deinem Modus ab: FLOW-Routinen sind als tägliche Maintenance gedacht (5-15 Min). REHAB-Pläne folgen einem strukturierten Phasenmodell. GOALS-Training ist 3-5x pro Woche optimal. Der Daily Readiness Check hilft dir, die richtige Frequenz für deinen Körper zu finden."
    },
    {
      question: "Was ist der Unterschied zwischen Hardware und Software?",
      answer: "Hardware = mechanische Einschränkungen (steife Faszien, eingeschränkte Gelenke, Muskelspannung). Software = neurologische Limitierungen (fehlerhafte Bewegungsmuster, visuelle/vestibulare Defizite, eingeschränkte Koordination). AXON testet beide Ebenen und adressiert die Root Cause deines Problems."
    },
    {
      question: "Kann AXON einen Physiotherapeuten ersetzen?",
      answer: "AXON ist ein Werkzeug zur Selbsthilfe und Prävention, kein Ersatz für medizinische Behandlung. Bei akuten Verletzungen, chronischen Erkrankungen oder starken Schmerzen solltest du immer einen Arzt oder Physiotherapeuten konsultieren. AXON hilft dir, dein System zwischen Therapiesitzungen zu pflegen und langfristig gesund zu halten."
    },
    {
      question: "Wie funktioniert die 7-Tage-Testphase?",
      answer: "Du erhältst 7 Tage vollen Zugriff auf alle Features – REHAB, GOALS und FLOW. Keine Kreditkarte erforderlich. Nach 7 Tagen entscheidest du, ob du für 59€ einmalig lebenslangen Zugriff kaufen möchtest. Kein Abo, keine versteckten Kosten."
    },
    {
      question: "Was passiert nach dem Kauf?",
      answer: "Nach der einmaligen Zahlung von 59€ hast du lebenslangen Zugriff auf AXON – alle aktuellen und zukünftigen Features inklusive. Kein monatliches Abo. Du zahlst einmal und nutzt AXON unbegrenzt. 30 Tage Geld-zurück-Garantie, falls du nicht zufrieden bist."
    },
    {
      question: "Sind meine Daten sicher?",
      answer: "Ja. Alle deine Gesundheitsdaten werden verschlüsselt gespeichert und nur zur Personalisierung deiner Trainingspläne verwendet. Wir verkaufen keine Daten an Dritte. Du kannst dein Konto und alle Daten jederzeit löschen."
    },
    {
      question: "Funktioniert AXON auf meinem Smartphone?",
      answer: "Ja, AXON ist eine Progressive Web App (PWA) und funktioniert auf jedem modernen Smartphone, Tablet oder Desktop-Browser. Du brauchst keine native App herunterzuladen. **Tipp: Installiere AXON auf deinem Homescreen für App-ähnliche Erfahrung.** So geht's: iPhone: Safari öffnen → Teilen-Icon → 'Zum Home-Bildschirm'. Android: Chrome öffnen → Menü (3 Punkte) → 'Zum Startbildschirm hinzufügen'. Danach startet AXON wie eine native App – kein Browser-Interface, Vollbild-Modus und schnellerer Zugriff."
    },
    {
      question: "Was ist, wenn ich eine Übung nicht verstehe?",
      answer: "Jede Übung hat detaillierte Schritt-für-Schritt-Anleitungen, Bilder und Tooltips mit Fachbegriffen (z.B. Dorsiflexion, Torque). Du kannst jederzeit Progressions-Varianten (leichter/schwerer) einsehen. Bei Fragen steht dir der AI-Coach zur Seite."
    },
    {
      question: "Kann ich AXON parallel zu meinem aktuellen Training nutzen?",
      answer: "Absolut! AXON ergänzt dein bestehendes Training perfekt. FLOW-Routinen sind ideal als Warm-up oder Cool-down. REHAB hilft bei akuten Problemen. GOALS kann als eigenständiges Programm oder als Ergänzung zu deinem Sport genutzt werden. Der Readiness Check stellt sicher, dass du nicht übertrainierst."
    }
  ];

  // Schema.org FAQ Structured Data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
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
        <title>FAQ - Häufig gestellte Fragen | AXON Protocol</title>
        <meta name="description" content="Alle Antworten zu AXON: Funktionsweise, Training, MFR-Nodes, Daily Readiness Check und mehr. Deine Bedienungsanleitung für optimales Training." />
        <meta name="keywords" content="AXON FAQ, Neuro-Training Anleitung, MFR erklärt, Faszienmobilität Tutorial, Training FAQ" />
        
        {/* Open Graph */}
        <meta property="og:title" content="FAQ - AXON Protocol" />
        <meta property="og:description" content="Alle Antworten zu AXON Training, MFR-Nodes, Readiness Check und mehr" />
        <meta property="og:type" content="website" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-6 mx-auto">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
            Häufig gestellte Fragen
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Alles, was du über AXON wissen musst – von den Grundlagen bis zu fortgeschrittenen Techniken
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl border border-cyan-500/20 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-cyan-500/5 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-cyan-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
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
                    <div className="px-6 pb-6 text-slate-300 leading-relaxed border-t border-cyan-500/20 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 glass rounded-xl border border-purple-500/30 p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-purple-400 mb-3">
            Noch Fragen?
          </h3>
          <p className="text-slate-300 mb-6">
            Starte deine 7-Tage-Testphase und erlebe AXON selbst – alle Features, kein Risiko.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold transition-all"
          >
            Jetzt kostenlos testen
          </a>
        </motion.div>
      </div>
    </div>
  );
}