# NotebookLM-Prompt 2: Neue Exercise-Einträge (MFR/Neuro/Breath/Mobility)

## Kontext für NotebookLM
In unserer App fehlen Übungen der Kategorien `mfr`, `neuro`, `breath` und `mobility` als eigenständige Einträge. Diese Übungen werden in Flow-Routinen (3-5 Min. morgens/abends) und Tune-Up-Protokollen verwendet, sind aber noch nicht sauber in der Übungsdatenbank angelegt.

## Aufgabe
Erstelle für jede der folgenden Übungen einen vollständigen Exercise-Datensatz im untenstehenden Format. Nutze deine Quellen (Stecco, Starrett, McGill, Pavel, Dan John, Gray Cook, Andrew Huberman, Rhonda Patrick) für korrekte wissenschaftliche Beschreibungen.

## Die Übungen (42 Stück)

### Breath-Übungen
1. Physiologisches Seufzen (Doppelter Einatem, langer Ausatem)
2. Summen-Atemübung (Bhramari)
3. Box Breathing
4. 4-8-verlängerte Schlafatmung
5. Parasympathisches Atmen mit peripherem Sehen
6. Kalte Wasser Atemvorbereitung

### Neuro / NSDR-Übungen
7. NSDR Body-Scan (Non-Sleep Deep Rest)
8. Fokus-Shift (Nah-Fern-Kalibrierung)
9. Horizontale Sakkaden
10. Vagus-Nerv-Stimulation (Summen + Diaphragmaatmung)

### MFR-Übungen (Faszien-Release mit Ball/Rolle)
11. BWS Release — Schaumrolle
12. Subokzipitaler Release (Schädelbasis)
13. Pectoralis Minor Release
14. Parasternaler Release (Brustbein-Seiten)
15. Psoas Release (Darmbein)
16. Glute / Piriformis Release
17. IT-Band Release
18. Plantarfaszien-Release (Fußsohle)

### Mobility-Übungen
19. Katzenkuh-Flow mit Rotation
20. Downward Dog Flow (Walking Dog + Three-Legged Dog)
21. Lizard → Pigeon Flow
22. Child's Pose mit Side Stretch
23. 90/90 Hip Switch Flow
24. Ausfallschritt mit Thorax-Rotation
25. Stehende Wirbelsäulenrotation
26. Squat mit Arm-Reach — Air Squat Flow
27. Schulter-Flow mit Brustöffnung
28. Beckenkippen im Sitz
29. Frog-Stretch (Adduktoren)
30. Straddle-Stretch
31. Liegendes Knie-zur-Brust

### Strength/Integration-Übungen (für Trainingspläne)
32. Bear Crawl — Bärenkrabbeln
33. Bulgarian Split Squat
34. Liegestütz mit Shoulder Tap
35. Bird Dog Flow
36. Dead Bug
37. Suitcase Carry
38. Half-Kneeling Press
39. Goblet Squat
40. Single-Leg Deadlift (Kettlebell)
41. Hollow Body Hold
42. Wall Slide (Schulter-Mobility + Stabilität)

## Ausgabeformat (für jede Übung)

```
EXERCISE: [Name]
exercise_id: [snake_case_id, z.B. mfr_suboccipital_release]
category: [mfr|neuro|breath|mobility|push|pull|squat|hinge|core|carry]
description: [3-5 Schritt-Anleitung, präzise und ausführbar]
axon_moment: [1 Satz: Was soll der User spüren/verstehen?]
cues: [3-4 Ausführungs-Tipps als Array, z.B. ["Bauchnabel leicht einziehen", "Schultern weg von den Ohren", "Atem fließen lassen"]]
breathing_instruction: [Wann einatmen, wann ausatmen, 1-2 Sätze]
purpose_explanation: [Warum ist diese Übung wichtig? 1-2 Sätze]
benefits: [Konkrete Vorteile, 1-2 Sätze]
difficulty: [beginner|intermediate|advanced]
stecco_chain: [Betroffene Faszien-Kette, z.B. SBL/SFL/DFL/LL/SPL — oder "multi"]
affected_nodes: [Array der betroffenen MFR-Node-IDs aus Prompt 1, z.B. ["CP-P", "CL-P"] — oder [] wenn nicht direkt anwendbar]
---
```

## Wichtige Regeln

1. **category** muss einer dieser Werte sein: mfr, neuro, breath, mobility, push, pull, squat, hinge, core, carry
2. **exercise_id** im snake_case Format, Präfix nach Kategorie (mfr_, neuro_, breath_, mob_, bw_, kb_)
3. **affected_nodes** nur Node-IDs aus Prompt 1 verwenden (CP-P, CL-P, TH-P, LU-P, PV-P, HU-A, CU-A, CA-A, CX-P, GE-P, TA-P, N12) – leer lassen [] wenn die Übung nicht direkt einem Punkt zugeordnet ist
4. **cues** als Array von Strings, 3-4 Stück
5. Alle Texte auf Deutsch, mit englischen Fachbegriffen in Klammern bei Bedarf
6. Beschreibungen müssen so präzise sein, dass ein User die Übung ohne Video ausführen kann
7. Bei MFR-Übungen: Dauer (meist 60-90 Sek.) und Druck-Regeln erwähnen
8. Bei Neuro-Übungen: Der neurologische Mechanismus (welches System wird trainiert?)
9. Bei Breath-Übungen: Atemrhythmus genau spezifizieren (z.B. 4-4-4-4 für Box Breathing)
10. **Keine Hallucinationen** – wenn dir eine Übung nicht aus deinen Quellen vertraut ist, markiere sie mit "[UNSICHER]" und gib trotzdem einen best-guess Datensatz

## Zusätzliche Felder (optional, falls du die Info hast)

Für jede Übung kann optional ergänzt werden:
- `mcgill_safety`: McGill-Sicherheitsprinzip (für strength/core)
- `progression_basic`: Einfachere Variante {label, description, focus}
- `progression_advanced`: Schwerere Variante {label, description, focus}
- `next_progression_id`: ID der nächsten schwereren Variante

## Output als einzelner Block
Bitte alle 42 Übungen in einem einzigen Output-Block ausgeben, damit ich sie direkt als JSON-Array verarbeiten kann. Verwende als Trenner zwischen Übungen eine Leerzeile und den `---` Marker.