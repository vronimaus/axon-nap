import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REPORT_SECTIONS = [
  {
    id: 'overview',
    title: '1. Was ist AXON?',
    content: `
AXON (Neuro-Athletic-Protocol) ist eine digitale Therapie- und Trainingsapplikation, die das Wissen aus Faszientherapie, neurologischer Bewegungssteuerung und funktionellem Training in einem strukturierten, KI-gestützten Protokoll verbindet.

Das System arbeitet nach dem Prinzip: Hardware (Faszien/Gelenke) → Software (Nervensystem) → Integration (Bewegung).

Ziel ist es, dem Nutzer ein Werkzeug an die Hand zu geben, das Physiotherapeuten in der Praxis anwenden – jedoch selbstständig, ohne Wartezeit und ohne externe Abhängigkeit.

**Kernversprechen:**
"Kein Physio. Keine Wartezeit. AXON gibt dir das Protokoll, das Physios anwenden – zum selbst machen."
    `
  },
  {
    id: 'target',
    title: '2. Zielgruppe',
    content: `
**Primäre Zielgruppe:**
- Berufstätige zwischen 28–55 Jahren ("C-Level Body")
- Menschen mit chronischen Verspannungen, Rückenschmerzen, Bewegungseinschränkungen
- Hobby-Sportler mit wiederkehrenden Verletzungsmustern
- Menschen, die keine Zeit für regelmäßige Physio-Termine haben

**Sekundäre Zielgruppe:**
- Leistungssportler, die Performance-Gaps (z.B. fehlende Rotation, Instabilität) schließen wollen
- Biohacker und quantified-self affine Nutzer

**Psychografisches Profil:**
- Lösungsorientiert, selbstverantwortlich
- Frustration mit klassischem Gesundheitssystem (Wartezeiten, symptombasierte Behandlung)
- Bereit, in sich zu investieren, wenn der Mechanismus erklärt wird
- Vertraut wissenschaftlichen Quellen (Stecco, Gray Cook, Pavel, Kelly Starrett)
    `
  },
  {
    id: 'causal_chains',
    title: '3. Die Kausalketten — Wie AXON funktioniert',
    content: `
AXON basiert auf drei ineinandergreifenden Kausalketten:

---

**KAUSALKETTE 1: Hardware-Reset (Faszielle Intervention)**

Einschränkung → Faszielle Adhäsion / Hyaluronsäure-Viskosität erhöht → mechanische Kompression (MFR) → Thixotropie-Effekt → Gewebe wird flüssiger → Ruffini & Pacini-Rezeptoren aktiviert → Parasympathikus-Shift → reduzierter Muskeltonus

*Wissenschaftliche Basis:* Stecco Fascial Manipulation, Langevin (2006), Schleip (2012)

---

**KAUSALKETTE 2: Software-Update (Neurologischer Drill)**

Neues Bewegungsfenster nach MFR → Nervensystem hat keine Bewegungssoftware für diesen Range → Neuro-Drill (Sakkadentraining, vestibuläre Stimulation, propriozeptives Feedback) → kortikale Karte wird erweitert → motorische Einheiten-Synchronisation → Myelinisierung neuer Bewegungspfade

*Wissenschaftliche Basis:* Doidge (Neuroplastizität), VOR-Rekalibrierung, Z'Graggen (2014), Michael Merzenich

---

**KAUSALKETTE 3: Integration (3DMAPS nach Gary Gray)**

Hardware frei + Software installiert → funktionelle Bewegung in allen drei Ebenen (sagittal, frontal, transversal) → Cross-Education-Effekt → bilaterale kortikale Aktivierung → Langzeit-Retention der neuen Bewegungsfreiheit

*Wissenschaftliche Basis:* Gary Gray 3DMAPS, Cross-Education-Forschung, Vern Gambetta (funktionelles Training)

---

**Das Gesamtprinzip:**
MFR (90 Sek.) → Neuro-Drill (3 Min.) → Integration (3-5 Reps) = messbarer Outcome in 7-10 Minuten
    `
  },
  {
    id: 'nms',
    title: '4. Das NMS-System (Neuro-Metabolic State)',
    content: `
AXON arbeitet mit einem proprietären Zustandsmodell, das den aktuellen neurometabolischen Systemzustand des Nutzers klassifiziert.

**Input-Zustände (vor Intervention):**
- redline: Chronischer Stress, sympathische Dominanz, Faszien maximal komprimiert
- stressed: Erhöhtes Stresslevel, eingeschränkte Regenerationsfähigkeit
- solid: Stabil, bereit für moderates Training
- peak: Optimale Kapazität, bereit für maximale Belastung
- vulnerable: Akute Schwäche nach Krankheit/Verletzung
- sluggish: Niedrige Energie, träger Lymphfluss
- stuck: Bewegungseinschränkung ohne akuten Schmerz
- weak_pain: Chronischer Schmerz mit Schwächemuster

**Output-Zustände (nach Intervention):**
- balanced: Grundlegende Homöostase wiederhergestellt
- solid: Stabile Belastungsfähigkeit
- resilient: Adaptionsfähigkeit verbessert
- explosive: Maximale neuromuskuläre Aktivierung
- fluid: Optimale Bewegungsqualität
- bulletproof: Hohe Stresstoleranz
- peak: Volle systemische Kapazität

**Verwendung im System:**
Das NMS-Modell bestimmt, welche Routinen, Übungen und Tune-Up-Protokolle dem Nutzer angezeigt werden. Jeder Reha-Plan hat einen definierten Input- und erwarteten Output-Zustand.
    `
  },
  {
    id: 'readiness',
    title: '5. Daily Readiness Check & Bio-Sync',
    content: `
**Tägliche Kalibrierung über 3 Achsen:**

1. **Hardware (Körpergefühl):** 1=steif/eingerostet → 10=geschmeidig/frei
2. **Software (Fokus):** 1=müde/Tunnelblick → 10=hellwach/klar
3. **Batterie (Energie):** 1=leer/erschöpft → 10=volle Kraft

**Berechnungslogik:**
- Jede Achse wird in ROT (1-4), GELB (5-7), GRÜN (8-10) eingestuft
- Gesamtstatus: Eine rote Achse = Gesamtstatus ROT
- Eine gelbe Achse (ohne Rot) = Gesamtstatus GELB
- Alle grün = Gesamtstatus GRÜN

**Konsequenzen je Status:**
- ROT: Nur MFR-Release empfohlen. Kein aktives Training. System in Erholungsmodus.
- GELB: Training möglich, jedoch mit reduzierter Intensität. Technik-Fokus.
- GRÜN: Volle Kapazität. Alle Protokolle verfügbar.

**Datenpersistenz:**
Alle Checks werden in der ReadinessCheck-Entity gespeichert und für Trendanalysen genutzt (30-Tage-History).
    `
  },
  {
    id: 'rehab_flow',
    title: '6. Der Reha-Plan — Aufbau & Ablauf',
    content: `
**Einstieg via Diagnose-Chat:**
1. Nutzer beschreibt Symptom (Textform oder Körperkarte)
2. KI identifiziert Kausalkette via Stecco-Node-Mapping
3. SFMA Quick-Check (Selective Functional Movement Assessment) prüft Bewegungseinschränkungen
4. Red-Flag-Screening (Kontraindikationen)
5. KI generiert 3-phasigen Reha-Plan

**Planstruktur (3 Phasen):**
- Phase 1: Hardware-Reset (MFR + grundlegende Mobilität)
- Phase 2: Software-Update (Neuro-Drills + Stabilisierung)
- Phase 3: Integration (3DMAPS-Bewegungen + Kraft)

**Jede Phase enthält:**
- phase_rationale: Konkreter Zeitgewinn und Fortschritt
- nms_shift_explanation: Was im Körper passiert
- synergy_highlight: Warum Übungen zusammen stärker wirken
- 3-6 Übungen mit Sets/Reps/Tempo + Audio-Coaching

**Daily Tune-Up (15 Min.):**
Test → MFR-Reset → Neuro-Drill → Retest → Integration
Dokumentiert Neural Permission Failures und passt Intensität automatisch an.

**Live-Adjust (NMS Live-Adjust):**
Bei Schmerz während Session → "Ouch"-Button → Algorithmus berechnet sicherere Alternative → Übung wird in laufender Session getauscht ohne Unterbrechung.
    `
  },
  {
    id: 'exercises',
    title: '7. Übungssystem & Taxonomie',
    content: `
**Kategorien (Dan-John-Bewegungsmuster + Neuro):**
- push, pull, squat, hinge, core, carry (klassische Bewegungsmuster)
- neuro (Neuro-Drills: Sakkaden, vestibuläre Drills, Propriozeption)
- mfr (Myofasziale Release-Techniken)
- breath (Atemarbeit, Vagus-Drills)

**Bewegungsebenen (Gary Gray 3DMAPS):**
- sagittal (vor/zurück)
- frontal (seitlich)
- transversal (rotierend)
- multi_planar

**Progressionssystem (AXON Upgrade-System):**
Jede Übung hat eine next_progression_id → bei positivem Feedback ("I feel great!") wird sicher auf die nächste Stufe gewechselt.
Upgrade wird blockiert, wenn bestimmte Stecco-Nodes Schmerz gemeldet haben.

**Smart-Tags (KI-Entscheidungsebene):**
Jede Übung ist annotiert mit:
- biomechanical_stress (Kompression, Scherung, Rotation: 1-10)
- kinetic_chain_slings (anterior, posterior, lateral, spiral, etc.)
- neuro_complexity (Koordination, Balance, visuelles Tracking)
- contraindications (absolute und relative Gegenanzeigen)

**Lateralität:**
bilateral, unilateral_left/right, alternating, asymmetric
→ Für Cross-Education-Algorithmus und symmetrisches Training
    `
  },
  {
    id: 'flow_routines',
    title: '8. FLOW-Routinen — Tägliche Systempflege',
    content: `
FLOW-Routinen sind strukturierte 5-20-minütige Sequenzen für die tägliche Systempflege — unabhängig vom Reha-Plan.

**Kategorien:**
- neuro: Neurologische Aktivierungsroutinen
- mobility: Gelenkspezifische Mobilität
- breathwork: Atemarbeit & Vagus-Aktivierung
- faszien (MFR): Myofasziale Pflege
- funktionale-bewegung: Integriertes Bewegungstraining

**Triage-System:**
Basierend auf dem Session-Decision-Algorithmus werden täglich passende Routinen vorgeschlagen:
- training: Pre-Sport Aktivierung, Morgen-Erwachen
- rehab_override: Schreibtisch-Befreiung, Mittags-Reset
- rest: Abend Wind-Down, Tiefer Schlaf Prep

**Zeitbasierte Empfehlung:**
5-10 Uhr → Morgen-Erwachen
10-15 Uhr → Mittags-Reset
15-18 Uhr → Pre-Sport Aktivierung
18-21 Uhr → Abend Wind-Down

**Progressions-Level:**
1 = Foundation, 2 = Development, 3 = Mastery
    `
  },
  {
    id: 'fitness_snacks',
    title: '9. Fitness Snacks — Hormetic Micro-Doses',
    content: `
Fitness Snacks sind 1-10-minütige hochintensive Micro-Interventionen nach Dr. Rhonda Patricks Hormesis-Prinzip.

**Hormesis-Typen:**
- thermal (Kältebad, Sauna)
- hypoxic (Atemhaltetraining)
- mechanical (Sprint, Loaded Carry)
- metabolic (HIIT, Zone 2)
- oxidative (antioxidative Belastung)

**Snack-Typen:**
HIIT, Zone2, Sprint, Cold Exposure, Heat, Breathwork, Strength Snack, Mobility Snack

**Readiness-Gate:**
Jeder Snack hat einen Mindest-Readiness-Status (red/yellow/green/any).
→ Bei ROT-Status werden hochintensive Snacks automatisch gesperrt.

**Longevity-Outcome:**
Jeder Snack dokumentiert seinen zellulären Nutzen:
"VO2max ↑", "BDNF ↑", "Mitochondrien-Dichte ↑", "HRV ↑"
    `
  },
  {
    id: 'mfr_nodes',
    title: '10. MFR-Node-System (Stecco-basiert)',
    content: `
AXON nutzt 12 definierte MFR-Nodes (N1-N12) basierend auf Luigi Steccos Fascial Manipulation.

**Node-Mapping:**
Jeder Node hat:
- Stecco Center of Coordination (CC)
- Exakte anatomische Platzierung
- Pretest-Anweisung (Ja/Nein/Teilweise)
- Step-by-Step User-Anleitung mit Timer
- Neuro-Drill zur Post-MFR-Verankerung
- Integrations-Bewegung (Gary Gray)

**Kausalkette je Node:**
Symptom → biomechanische Ursache → Hardware-Reset → Software-Update → Finales Outcome (messbar in Grad)

**Vernetzung mit Reha-Plan:**
Jeder Reha-Plan referenziert betroffene Nodes.
Daily Tune-Up wählt automatisch den relevanten Node basierend auf dem Problemgebiet des Plans.

**Wissenschaftliche Tiefe je Node:**
- physio_neurological_impact: Thixotropie, Ruffini/Pacini, Parasympathikus-Shift
- starrett_mobility_principle: Kelly Starretts Mobilisationsprinzipien
- expert_insight_stecco: Peer-reviewed Mechanismen
    `
  },
  {
    id: 'ai_layer',
    title: '11. KI-Schicht — Was die KI tut',
    content: `
**Diagnose-KI (DiagnosisChat):**
- Analysiert Symptombeschreibung im Freitext
- Identifiziert wahrscheinlichste Kausalkette (Stecco-Node-Mapping)
- Führt SFMA-basiertes Screening durch
- Prüft Red Flags (absolute Kontraindikationen)
- Generiert personalisierten 3-Phasen-Reha-Plan

**Session-Generator:**
- Berechnet Movement Consistency Score (MCS) aus: Readiness-Trend, Reha-Plan-Integrität, Historische Konsistenz
- Entscheidet: Training / Rehab / Recovery
- Gibt psychologisches Framing und konkrete CTA aus

**Live-Adjust-Algorithmus:**
- Empfängt: aktuelle Übung, Schmerzlevel (NRS), betroffener Stecco-Node
- NRS 5-7 → "Yellow Pivot" → modifizierte Variante (Regression, Plane-Change)
- NRS 8+ → "Red Stop" → Stop der Übung, vagale Intervention
- Nutzt Smart-Tags zur sicheren Alternative-Suche

**Audio-Coaching (TTS):**
- Alle Übungsanweisungen werden via Gemini TTS generiert
- Caching in privater Storage via SHA-256-Hash
- Automatische Batch-Generierung für alle Übungen und MFR-Nodes

**Reha-Plan-Generierung:**
- Berücksichtigt: DiagnosisSession, 3DMAPS-Assessment, UserNeuroProfile, NMS-Trigger
- Generiert: Problem-Summary, Phase-Rationale, NMS-Shift-Explanation, Synergy-Highlight
- Empfiehlt: Passende MFR-Routinen + FAQs
    `
  },
  {
    id: 'data_model',
    title: '12. Datenmodell — Entitäten-Übersicht',
    content: `
**Nutzer-Daten:**
- User (built-in): Email, Name, Rolle
- UserNeuroProfile: Biologische Parameter, Trainingshistorie, Ziele, Präferenzen
- ReadinessCheck: Tägliche Bio-Sync-Daten (Hardware/Software/Batterie)

**Diagnose & Planung:**
- DiagnosisSession: Symptom, getestete Ketten, Hardware/Software-Ergebnisse
- RehabPlan: 3-phasiger Plan mit Übungen, NMS-Trigger, Live-Adjust-Log, Feedback-History
- ThreeDMAPSAssessment: Bewegungsebenen-Assessment nach Gary Gray
- MovementAssessment: FMS-basierte Bewegungsanalyse

**Wissens-Daten (Admin-only):**
- AxonScenario (20 Szenarien): Vollständige Protokolle Hardware→Software→Integration
- TuneUpCausalChain: Node-spezifische Kausalketten
- MFRNode: 12 Behandlungspunkte mit Stecco-Mapping
- Exercise: Übungsdatenbank mit Smart-Tags und Progressionspfaden
- Routine: FLOW-Routinen mit Sequenzen
- FitnessSnack: Hormetic Micro-Interventionen
- KnowledgeSnippet: Anatomische Wissenshäppchen je Node
- FascialChain: 7 myofasziale Leitbahnen

**Performance:**
- TrainingPlan: KI-generierter Trainingsplan für Performance-Ziele
- PerformanceGoal: Skill-Ziele (Pistol Squat, Handstand etc.)
- UserPerformanceProgress: Fortschritt je Ziel
- PerformanceBaseline: Ausgangsmessungen

**Protokoll-Daten:**
- PavelProtocol, DanJohnProtocol, GaryGrayProtocol, KellyStarrettProtocol, FMSProtocol, VernGambettaProtocol
    `
  },
  {
    id: 'expert_system',
    title: '13. Das Experten-System — Wessen Wissen steckt drin?',
    content: `
AXON synthetisiert das Wissen von 6 Experten-Schulen:

**Luigi & Carla Stecco — Fascial Manipulation:**
Basis für das MFR-Node-System. Centers of Coordination, myofasziale Sequenzen, Hyaluronsäure-Viskosität als therapeutisches Target.

**Gary Gray — 3DMAPS:**
Funktionelle Integration in allen drei Bewegungsebenen. Tri-Plane-Bewegungen als Ausgangspunkt für Kraft und Stabilität.

**Pavel Tsatsouline — Strength Protocol:**
"Grease the Groove", Irradiation, neuronale Effizienz statt Muskelaufbau. Qualität vor Quantität.

**Gray Cook — FMS:**
Joint-by-Joint-Prinzip, Screening vor Training, Movement Competency als Basis.

**Kelly Starrett — Mobility:**
Upstream/Downstream-Prinzip, Voodoo Flossing, Gewebequalität als Performance-Variable.

**Vern Gambetta — Functional Training:**
Athletic Development, Bewegungsketten statt Isolation, Integration im Alltag.

**Wissenschaftliche Ergänzung:**
- Dr. Rhonda Patrick: Hormesis-Konzept für Fitness Snacks
- Robert Schleip: Faszienforschung & Thixotropie
- Michael Merzenich: Neuroplastizität & kortikale Karten
    `
  },
  {
    id: 'unique_selling',
    title: '14. Alleinstellungsmerkmale (USP)',
    content: `
**1. Kausales statt symptomatisches Denken:**
AXON behandelt nicht den Schmerz, sondern die Ursache — via Kausalketten-Mapping über Faszien-Nodes.

**2. Hardware-Software-Sequenz:**
Die Abfolge MFR → Neuro → Integration ist neurobiologisch begründet. Andere Apps überspringen das Nervensystem.

**3. Live-Adapt während der Session:**
Kein anderes Consumer-Produkt passt Übungen in Echtzeit basierend auf Schmerzfeedback an.

**4. NMS-Readiness-Gate:**
Training nur wenn das System bereit ist. Automatischer Schutz vor Übertraining und Verletzungen.

**5. Audio-Coaching ohne App-Wechsel:**
TTS-basiertes Coaching direkt in der Übungs-UI. Kein Wechsel zu YouTube oder separatem Coaching.

**6. Wissenschaftliche Tiefe + Consumer-Erlebnis:**
Alle Mechanismen sind erklärbar und peer-reviewed — aber die UX ist so einfach wie eine Fitness-App.

**7. Lebenslanger Zugang, einmaliger Preis:**
Kein Abo-Modell. Einmalig 59€ statt 100€+/Monat Physiotherapie.
    `
  },
  {
    id: 'limitations',
    title: '15. Grenzen & Kontraindikationen',
    content: `
**AXON ist KEIN Ersatz für:**
- Akute medizinische Notfälle
- Diagnose von Erkrankungen (Arthrose, Nervenwurzelkompression, Frakturen)
- Postoperative Rehabilitation in den ersten Wochen
- Behandlung von Autoimmunerkrankungen oder systemischen Erkrankungen

**Red Flags (automatisch geprüft):**
- Traumatische Verletzungen (Unfälle, Stürze)
- Neurologische Ausfälle (Taubheit, Lähmung)
- Unerklärlicher Gewichtsverlust
- Nächtliche Schmerzen ohne mechanische Ursache
- Beckenbodensymptome
- Fieber kombiniert mit Rückenschmerzen

**Bei Red Flags:**
System weist auf Arztbesuch hin und stellt kein Protokoll bereit.

**AXON empfiehlt ergänzend:**
Regelmäßige ärztliche Kontrolle, HRV-Monitoring via Wearable, professionelles Bewegungsscreening einmal pro Jahr.
    `
  }
];

function Section({ section }) {
  const [open, setOpen] = useState(false);

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-zinc-100 mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="text-zinc-400 ml-4 text-sm leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, (_, m) => m).slice(2)}</li>;
      }
      if (line.startsWith('---')) {
        return <hr key={i} className="border-white/[0.06] my-3" />;
      }
      if (line.trim() === '') return <br key={i} />;
      // Bold inline
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-zinc-400 text-sm leading-relaxed">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-zinc-200">{part}</strong> : part)}
        </p>
      );
    });
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <span className="font-bold text-zinc-200 text-sm">{section.title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-1">
          {renderContent(section.content)}
        </div>
      )}
    </div>
  );
}

export default function SystemReport() {
  const handleCopyAll = () => {
    const fullText = REPORT_SECTIONS.map(s => `# ${s.title}\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(fullText);
  };

  return (
    <div className="min-h-screen bg-[#111111] pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#111111] border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Admin</p>
            <h1 className="text-xl font-bold text-white">AXON Systembericht</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Vollständige Dokumentation für NotebookLM & Content-Produktion</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              className="text-zinc-400 hover:text-zinc-200 text-xs"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Kopieren
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('AdminHub')}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {/* Intro */}
        <div className="rounded-xl border border-white/[0.06] bg-zinc-800/40 px-5 py-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Dieser Bericht dokumentiert das vollständige AXON-System: Kausalketten, Features, Zielgruppe, Datenmodell und wissenschaftliche Grundlagen. 
            Geeignet als Quelle für <strong className="text-zinc-200">NotebookLM</strong>, Content-Produktion, Investor-Pitches und Team-Onboarding.
            Klicke auf einen Abschnitt, um ihn aufzuklappen.
          </p>
        </div>

        {/* Sections */}
        {REPORT_SECTIONS.map(section => (
          <Section key={section.id} section={section} />
        ))}

        {/* Copy full report */}
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-5 text-center">
          <p className="text-xs text-zinc-500 mb-3">Gesamten Bericht in die Zwischenablage kopieren (für NotebookLM / Docs)</p>
          <Button
            onClick={handleCopyAll}
            className="bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] text-white text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Vollständigen Bericht kopieren
          </Button>
        </div>
      </div>
    </div>
  );
}