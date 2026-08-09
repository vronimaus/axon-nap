# NotebookLM-Prompt 1: MFRNode-Wissenschaftsfelder

## Kontext für NotebookLM
Du hast Zugriff auf 300+ Quellen zur Faszientherapie, Neurologie und Bewegungswissenschaft (Stecco, Starrett, McGill, Gray, Pavel, Dan John). Ich brauche für 12 MFR-Punkte (sogenannte "Center of Coordination" nach Stecco) jeweils drei wissenschaftliche Felder korrekt ausgefüllt.

## Die 12 MFR-Nodes

| node_id | name_de | body_area | stecco_cc_name | exact_placement |
|---------|---------|-----------|----------------|-----------------|
| CP-P | Kopf & Kiefer (Caput posterior) | Schädelbasis / Nackenansatz | Caput (CP) | Subokzipitalregion |
| CL-P | Hals & Nacken (Collum posterior) | Nackenmuskulatur seitlich der WS | Collum (CL) | Obere HWS paravertebral |
| TH-P | Brustkorb & BWS (Thorax posterior) | Zwischen den Schulterblättern | Thorax (TH) | Mittlere BWS paravertebral |
| LU-P | Lenden & LWS (Lumbus posterior) | Lendenmuskulatur seitlich der WS | Lumbus (LU) | LWS paravertebral |
| PV-P | Becken & Kreuzbein (Pelvis posterior) | Kreuzbein / Beckenrückseite | Pelvis (PV) | Sacrum / Gluteal |
| HU-A | Schulter & Oberarm (Humerus anterior) | Schulterblatt / Oberarm | Humerus (HU) | Vordere Schulter / Bizeps |
| CU-A | Ellbogen & Unterarm (Cubitus anterior) | Außenseite des Unterarms | Cubitus (CU) | Unterarm-Streckmuskulatur |
| CA-A | Handgelenk & Griffkraft (Carpus anterior) | Handballen / Unterarm-Innenseite | Carpus (CA) | Thenar / Hypothenar |
| CX-P | Hüfte RücksRückseite | Hüfte posterior / Gluteal | Coxa (CX) | Piriformis / tiefe Gluteen |
| GE-P | Knie Rückseite | Hinterer Oberschenkel | Genu (GE) | Hamstrings / Kniekehle |
| TA-P | Knöchel & Wade (Tarsus posterior) | Mitte der Wade / Unterschenkel | Crus (CR) | Wadenmuskulatur / Achilles |
| N12 | Zehen & Fußform | Fußballen / Zehenansatz | Plantaris (PL) | Fußsohle / Plantarfaszie |

## Aufgabe
Erstelle für JEDEN der 12 Nodes eine Tabelle mit diesen 3 Feldern:

### 1. `physio_neurological_impact` (BECAUSE-Feld, 2-3 Sätze)
Beschreibe den breiten physiologisch-neurologischen Mechanismus ÜBER Stecco hinaus. Beantworte: Was passiert im Körper auf zellulärer/Rezeptor-Ebene wenn dieser Punkt für 90 Sekunden komprimiert wird? Nutze diese Konzepte, wo zutreffend:
- **Thixotropie** (Viskositätsänderung der Hyaluronsäure)
- **Ruffini-Rezeptoren** (antworten auf anhaltenden Druck, hemmen Sympathikus)
- **Pacini-Körperchen** (schnelle Druckänderungen)
- **Parasympathikus-Shift** (Vagus-Aktivierung)
- **Nozizeptor-Desensibilisierung** (Schmerzschwelle)
- **Interozeption** (Körperwahrnehmung)
- **Golgi-Sehnen-Organ** (autogene Hemmung)
- **Fasziale Kontinuität** (Verbindung zu benachbarten Ketten)

### 2. `expert_insight_stecco` (wissenschaftlicher Hintergrund nach Stecco, 3-4 Sätze)
Beschreibe präzise nach Luigi Stecco's Modell:
- Die spezifische **Center of Coordination (CC)** Funktion dieses Punktes
- Welche **Fascial Chain** (SBL, SFL, DFL, LL, SPL, etc.) hier koordiniert wird
- Warum die **Sequenzierung** (Myofascial Units) an diesem Punkt zentriert ist
- Der biomechanische Zweck der hier koordinierten Bewegung (z.B. "koordiniert die Vorwärtsbewegung des Arms")

### 3. `starrett_mobility_principle` (Kelly Starrett-Prinzip, 1-2 Sätze)
Welches spezifische Mobilitätsprinzip nach Kelly Starrett ("Becoming a Supple Leopard") gilt für diesen Punkt? Wähle EINES passendes aus:
- **Voodoo Flossing** (Kompressions-Band)
- **Upstream/Downstream** (Problem oberhalb/unterhalb behandeln)
- **Tissue Quality** (Gewebequalität verbessern)
- **Joint Capsule Mobs** (Gelenkkapsel mobilisieren)
- **Banded Distraction** (Band-Distraktion)
- **Contract-Relax** (Postisometrische Entspannung)
- **Pressure Wave / Slow Motion** (langsame tiefe Druckwellen)
- **Smash & Floss** (Ball + Bewegung)
Begründe kurz, warum dieses Prinzip hier besonders wirksam ist.

## Ausgabeformat (für jeden Node)

```
NODE: [node_id] — [name_de]
physio_neurological_impact: [Text]
expert_insight_stecco: [Text]
starrett_mobility_principle: [Text]
---
```

## Wichtige Regeln
- Bleibe **strikt evidenzbasiert** – wenn du dir bei einem Mechanismus unsicher bist, schreibe "Mechanismus nicht eindeutig belegt" statt zu erfinden
- Vermeide Werbe-Sprache ("revolutionär", "magisch")
- Zitiere nicht, aber nutze die Terminologie aus deinen Quellen korrekt
- Deutschsprachig, aber mit englischen Fachbegriffen in Klammern bei Bedarf