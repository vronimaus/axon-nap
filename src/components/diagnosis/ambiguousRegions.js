/**
 * Ambiguous Region Disambiguation Config
 *
 * Bestimmte Körperregionen sind auf einer 2D-Body-Map (Vorder-/Rückseite)
 * mehrdeutig — ein einzelner Klick kann unterschiedliche anatomische
 * Strukturen bedeuten. Diese Config definiert, welche Regionen eine
 * Nachfrage auslösen und welche Optionen der User dann sieht.
 *
 * Key-Format: "view:Label" (view-spezifisch) oder "Label" (beide Views).
 * Label = Region-String aus bodyMapRegions.js (ohne Laterality-Suffix).
 *
 * Option:
 *   label:     User-lesbare Beschreibung
 *   subtitle:  Anatomischer Hinweis
 *   nodeId:    Aufgelöster MFR-Node (SC-A, HU-A, TH-P, …)
 *   switchView: 'back' | 'front' — wenn gesetzt, Body-Map auf diese
 *               Ansicht umschalten und neu markieren lassen (statt direkt
 *               in die Diagnose zu gehen).
 */

export const AMBIGUOUS_REGIONS = {
  // ── Schulter / Acromion (vorne) ──
  'front:Schulter/Acromion': [
    { label: 'Oben auf dem Schulterdach', subtitle: 'Acromion, vorderes Deltoid', nodeId: 'SC-A' },
    { label: 'Seitlich am Oberarm', subtitle: 'Deltoid-Ursprung, Oberarmkopf', nodeId: 'HU-A' },
    { label: 'Vorne am Schlüsselbein', subtitle: 'Pektoralis, Klavikula', nodeId: 'TH-A' },
    { label: 'Eher hinten / Schulterblatt', subtitle: 'Skapula, Rhomboideus', nodeId: 'SC-P', switchView: 'back' },
  ],

  // ── Schulter / Acromion (hinten) ──
  'back:Schulter/Acromion': [
    { label: 'Oben auf dem Schulterdach', subtitle: 'Acromion, hinteres Deltoid', nodeId: 'SC-P' },
    { label: 'Seitlich am Oberarm', subtitle: 'Hinteres Deltoid', nodeId: 'HU-A' },
    { label: 'Auf dem Schulterblatt', subtitle: 'Skapula, Infraspinatus', nodeId: 'SC-P' },
    { label: 'Zwischen den Schulterblättern', subtitle: 'Trapezius, Wirbelsäule', nodeId: 'TH-P' },
  ],

  // ── Schulterblatt (hinten) ──
  'back:Schulterblatt': [
    { label: 'Direkt auf dem Blatt', subtitle: 'Skapula, Infraspinatus', nodeId: 'SC-P' },
    { label: 'Zwischen den Schulterblättern', subtitle: 'Rhomboideus, Wirbelsäule', nodeId: 'TH-P' },
    { label: 'Oben am Nackenansatz', subtitle: 'Trapezius, Nacken', nodeId: 'CL-P' },
  ],

  // ── Hüfte / Becken (vorne) ──
  'front:Hüfte/Becken': [
    { label: 'Vorne in der Leiste', subtitle: 'Hüftbeuger (Iliopsoas)', nodeId: 'CX-A' },
    { label: 'Seitlich am Hüftknochen', subtitle: 'Trochanter, Gluteus medius', nodeId: 'CX-A' },
    { label: 'Unterbauch / Schambein', subtitle: 'Beckenboden, Unterbauch', nodeId: 'LU-A' },
    { label: 'Eher hinten / Gesäß', subtitle: 'Gluteus, LWS', nodeId: 'PV-P', switchView: 'back' },
  ],

  // ── Hüfte / Becken (hinten) ──
  'back:Hüfte/Becken': [
    { label: 'Im Gesäß', subtitle: 'Gluteus maximus', nodeId: 'PV-P' },
    { label: 'Seitlich am Hüftknochen', subtitle: 'Trochanter, Gluteus medius', nodeId: 'CX-P' },
    { label: 'Unterer Rücken / LWS', subtitle: 'Lendenwirbel', nodeId: 'LU-P' },
  ],
};

/**
 * Prüft, ob eine erkannte Region mehrdeutig ist.
 * @returns {Array|null} — Array von Optionen oder null (eindeutig)
 */
export function getDisambiguation(region, view) {
  if (!region) return null;
  const label = region.replace(/\s+(links|rechts)$/, '').trim();
  return AMBIGUOUS_REGIONS[`${view}:${label}`] || AMBIGUOUS_REGIONS[label] || null;
}