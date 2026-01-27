// Lagerungsabhängige Symptome (spezielle Kategorie für positionsabhängige Schmerzen)
export const POSITIONAL_SYMPTOMS = [
  {
    id: 'POS_NECK_SHOULDER_01',
    cluster: 'hals_nacken',
    label: 'Lagerungsabhängiger Nacken-Schulter-Schmerz',
    description: 'Schmerz in Rhomboideen/Schulter beim Liegen auf der betroffenen Seite, Besserung durch Kopfrotation zur Gegenseite',
    prio_chain: 'SPL',
    secondary_chains: ['LL', 'AL'],
    analysis: {
      mechanical_cause: 'Kompression der Laterallinie (LL) + Zugspannung der Spirallinie (SPL)',
      neural_cause: 'Engpass im Plexus Brachialis oder mechanische Irritation der HWS-Nervenwurzeln',
      trigger_side: 'ipsilateral',
      relief_side: 'contralateral_rotation',
      software_priority: 85
    },
    recommended_drill: 'Sakkaden zur schmerzfreien Seite (aktiviert die Nackenmuskulatur der Gegenseite)',
    hardware_tests: ['Seitneigung des Kopfes zur schmerzhaften Seite', 'Aktive Scapula-Adduktion'],
    recommendation: 'Software-Fokus: HWS-Entlastung und visuelles Training zur schmerzfreien Seite. Hardware-Fokus: Release der vorderen Armlinie (AL)',
    drill: 'Visual Saccades'
  },
  {
    id: 'POS_HIP_LEG_01',
    cluster: 'huefte',
    label: 'Lagerungsabhängiger Hüft-/Beinschmerz',
    description: 'Schmerz in der Hüfte beim Liegen auf der Seite, Besserung durch Beinposition-Änderung',
    prio_chain: 'LL',
    secondary_chains: ['SBL', 'FL'],
    analysis: {
      mechanical_cause: 'Kompression der Laterallinie (LL) im Hüftbereich',
      neural_cause: 'N. ischiadicus Irritation oder TFL-Kompression',
      trigger_side: 'ipsilateral',
      relief_side: 'neutral_position',
      software_priority: 70
    },
    recommended_drill: 'Balance-Drills einbeinig zur Stabilisierung',
    hardware_tests: ['Seitliche Hüftabduktion', 'TFL-Palpation'],
    recommendation: 'Mixed: Hardware-Release der IT-Band/TFL-Region + Balance-Training',
    drill: 'Balance Stand'
  }
];

// Vollständige Symptom-Liste mit 30 Einträgen
export const ALL_SYMPTOMS = [
  {id: "S1", cluster: "kopf_kiefer", label: "Kiefersperre / Zähneknirschen", prio_chain: "DFL", drill: "Trigeminus-Release"},
  {id: "S2", cluster: "kopf_kiefer", label: "Spannungskopfschmerz (Hinterkopf)", prio_chain: "SBL", drill: "Vertical Saccades UP"},
  {id: "S3", cluster: "kopf_kiefer", label: "Benommenheitsschwindel", prio_chain: "LL", drill: "Vestibular Balance Check"},
  {id: "S4", cluster: "hals_nacken", label: "Steifer Nacken (Schulterblick)", prio_chain: "SPL", drill: "Diagonal Vision"},
  {id: "S5", cluster: "hals_nacken", label: "Kloß im Hals (Globus)", prio_chain: "DFL", drill: "Tongue Mobility"},
  {id: "S6", cluster: "hals_nacken", label: "Schmerz Schädelbasis", prio_chain: "SBL", drill: "Cerebellum Activation"},
  {id: "S7", cluster: "schulter_arm", label: "Ausstrahlung in den Arm", prio_chain: "AL", drill: "Nerve Glide"},
  {id: "S8", cluster: "schulter_arm", label: "Impingement (Heben)", prio_chain: "AL", drill: "Scapula HD Circles"},
  {id: "S9", cluster: "schulter_arm", label: "Taubheit in Fingern", prio_chain: "AL", drill: "Cervical Release"},
  {id: "S10", cluster: "schulter_arm", label: "Tennis-/Golferarm", prio_chain: "AL", drill: "Carpal Circles"},
  {id: "S11", cluster: "schulter_arm", label: "Schwere Schultern", prio_chain: "SBL", drill: "Vagus Breathing"},
  {id: "S12", cluster: "ruecken", label: "Zwischen Schulterblättern", prio_chain: "SPL", drill: "T-Spine Rotation"},
  {id: "S13", cluster: "rumpf", label: "Rippenschmerz / Atemsperre", prio_chain: "LL", drill: "Diaphragma Release"},
  {id: "S14", cluster: "rumpf", label: "Rundrücken-Tendenz", prio_chain: "SFL", drill: "Convergence Near"},
  {id: "S15", cluster: "lws", label: "Hexenschuss-Gefühl (akut)", prio_chain: "SBL", drill: "Vestibular Stability"},
  {id: "S16", cluster: "lws", label: "Ziehen im Kreuzbein (ISG)", prio_chain: "SPL", drill: "Pelvic Floor Pulse"},
  {id: "S17", cluster: "lws", label: "Dumpfer Schmerz (Sitzen)", prio_chain: "DFL", drill: "Hip HD Circles"},
  {id: "S18", cluster: "huefte", label: "Leistenschmerz (Stechen)", prio_chain: "DFL", drill: "Pelvic Tilt Control"},
  {id: "S19", cluster: "huefte", label: "Schnappende Hüfte", prio_chain: "LL", drill: "Glute Activation"},
  {id: "S20", cluster: "huefte", label: "Schambein-Reizung", prio_chain: "FL", drill: "Cross-Crawl"},
  {id: "S21", cluster: "beine", label: "Hamstring-Spannung", prio_chain: "SBL", drill: "Ankle HD Circles"},
  {id: "S22", cluster: "beine", label: "Oberschenkel-Druck", prio_chain: "SFL", drill: "Gaze Down"},
  {id: "S23", cluster: "knie", label: "Knieschmerz vorne", prio_chain: "SFL", drill: "Saccades DOWN"},
  {id: "S24", cluster: "knie", label: "Knie-Innenseite", prio_chain: "DFL", drill: "Foot Arch Lift"},
  {id: "S25", cluster: "knie", label: "Knie-Außenseite", prio_chain: "LL", drill: "Hip Abduction"},
  {id: "S26", cluster: "fuss", label: "Achillessehnen-Reizung", prio_chain: "SBL", drill: "Ankle HD"},
  {id: "S27", cluster: "fuss", label: "Fersensporn / Sohle", prio_chain: "SBL", drill: "Balance Stand"},
  {id: "S28", cluster: "fuss", label: "Schienbeinkanten", prio_chain: "DFL", drill: "Toe Articulation"},
  {id: "S29", cluster: "fuss", label: "Umknick-Gefühl", prio_chain: "LL", drill: "Vestibular Canals"},
  {id: "S30", cluster: "systemisch", label: "Morgensteifigkeit", prio_chain: "DFL", drill: "Lymphatic Flow"}
];

// Symptom-Mapping zu Faszialen Ketten
export const SYMPTOM_CLUSTERS = {
  kopf_kiefer: {
    label: "Kopf & Kiefer",
    icon: "brain",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "kopf_kiefer"),
    triggered_chains: ["SBL", "DFL", "LL", "SPL"]
  },
  hals_nacken: {
    label: "Hals & Nacken",
    icon: "move",
    symptoms: [...ALL_SYMPTOMS.filter(s => s.cluster === "hals_nacken"), ...POSITIONAL_SYMPTOMS.filter(s => s.cluster === "hals_nacken")],
    triggered_chains: ["SBL", "DFL", "SPL", "LL", "AL"]
  },
  schulter_arm: {
    label: "Schulter & Arm",
    icon: "hand",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "schulter_arm"),
    triggered_chains: ["AL", "SBL", "SPL"]
  },
  ruecken: {
    label: "Rücken (BWS)",
    icon: "minimize",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "ruecken"),
    triggered_chains: ["SPL", "SBL", "LL"]
  },
  rumpf: {
    label: "Rumpf & Rippen",
    icon: "circle",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "rumpf"),
    triggered_chains: ["LL", "SFL", "DFL"]
  },
  lws: {
    label: "LWS & Kreuzbein",
    icon: "activity",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "lws"),
    triggered_chains: ["SBL", "DFL", "SPL", "LL"]
  },
  huefte: {
    label: "Hüfte & Becken",
    icon: "target",
    symptoms: [...ALL_SYMPTOMS.filter(s => s.cluster === "huefte"), ...POSITIONAL_SYMPTOMS.filter(s => s.cluster === "huefte")],
    triggered_chains: ["DFL", "LL", "FL", "SFL"]
  },
  beine: {
    label: "Oberschenkel",
    icon: "trending-down",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "beine"),
    triggered_chains: ["SBL", "SFL"]
  },
  knie: {
    label: "Knie",
    icon: "circle-dot",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "knie"),
    triggered_chains: ["SFL", "DFL", "LL"]
  },
  fuss: {
    label: "Fuß & Sprunggelenk",
    icon: "footprints",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "fuss"),
    triggered_chains: ["SBL", "DFL", "LL"]
  },
  systemisch: {
    label: "Systemisch",
    icon: "zap",
    symptoms: ALL_SYMPTOMS.filter(s => s.cluster === "systemisch"),
    triggered_chains: ["DFL", "SBL", "SFL"]
  }
};

export const BODY_REGIONS = [
  { id: "kopf_kiefer", label: "Kopf & Kiefer", position: { top: "5%", left: "50%" } },
  { id: "hals_nacken", label: "Hals & Nacken", position: { top: "12%", left: "50%" } },
  { id: "schulter_arm", label: "Schulter & Arm", position: { top: "22%", left: "25%" } },
  { id: "ruecken", label: "Rücken (BWS)", position: { top: "30%", left: "50%" } },
  { id: "rumpf", label: "Rumpf & Rippen", position: { top: "35%", left: "35%" } },
  { id: "lws", label: "LWS & Kreuzbein", position: { top: "45%", left: "50%" } },
  { id: "huefte", label: "Hüfte & Becken", position: { top: "52%", left: "50%" } },
  { id: "beine", label: "Oberschenkel", position: { top: "62%", left: "50%" } },
  { id: "knie", label: "Knie", position: { top: "72%", left: "50%" } },
  { id: "fuss", label: "Fuß & Sprunggelenk", position: { top: "85%", left: "50%" } },
  { id: "systemisch", label: "Systemisch", position: { top: "95%", left: "50%" } }
];

// Top 15 Symptome für Quick Access
export const TOP_SYMPTOMS = ALL_SYMPTOMS.slice(0, 15).map(s => ({
  id: s.id,
  symptom: s.label,
  cluster: s.cluster,
  prio_chain: s.prio_chain
}));