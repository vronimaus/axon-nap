// Symptom-Mapping zu Faszialen Ketten
export const SYMPTOM_CLUSTERS = {
  kopf_nacken: {
    label: "Kopf & Nacken",
    icon: "brain",
    symptoms: [
      "Kopfschmerzen (Spannung)",
      "Migräne",
      "Nackensteifheit",
      "Nackenschmerzen",
      "Schwindel",
      "Tinnitus",
      "Kieferverspannung (CMD)",
      "Augenmüdigkeit"
    ],
    triggered_chains: ["SBL", "DFL", "SPL"]
  },
  schulter_arm: {
    label: "Schulter & Arm",
    icon: "hand",
    symptoms: [
      "Schulterschmerzen",
      "Schultersteifheit",
      "Impingement-Syndrom",
      "Tennisellbogen",
      "Golferellbogen",
      "Karpaltunnel-Syndrom",
      "Taubheit in den Händen",
      "Schmerzen beim Heben"
    ],
    triggered_chains: ["AL", "SPL", "SBL"]
  },
  ruecken_lws: {
    label: "Rücken & LWS",
    icon: "spine",
    symptoms: [
      "Unterer Rückenschmerz",
      "Oberer Rückenschmerz",
      "Bandscheibenprobleme",
      "ISG-Blockade",
      "Ischias",
      "Morgensteifigkeit",
      "Schmerzen beim Bücken",
      "Schmerzen beim Stehen"
    ],
    triggered_chains: ["SBL", "DFL", "LL"]
  },
  huefte_becken: {
    label: "Hüfte & Becken",
    icon: "hip",
    symptoms: [
      "Hüftschmerzen",
      "Leistenschmerzen",
      "Beckenschiefstand",
      "Piriformis-Syndrom",
      "Hüftbeuger-Verkürzung",
      "Schmerzen beim Sitzen",
      "Eingeschränkte Hüftrotation"
    ],
    triggered_chains: ["DFL", "SFL", "SPL", "LL"]
  },
  knie_fuss: {
    label: "Knie & Fuß",
    icon: "footprints",
    symptoms: [
      "Knieschmerzen (vorne)",
      "Knieschmerzen (seitlich)",
      "Patellaspitzen-Syndrom",
      "IT-Band-Syndrom",
      "Plantarfasziitis",
      "Achillessehnenschmerzen",
      "Sprunggelenk-Instabilität",
      "Fußschmerzen"
    ],
    triggered_chains: ["SFL", "DFL", "LL", "SBL"]
  }
};

export const BODY_REGIONS = [
  { id: "kopf_nacken", label: "Kopf & Nacken", position: { top: "5%", left: "50%" } },
  { id: "schulter_arm", label: "Schulter & Arm", position: { top: "20%", left: "25%" } },
  { id: "ruecken_lws", label: "Rücken & LWS", position: { top: "40%", left: "50%" } },
  { id: "huefte_becken", label: "Hüfte & Becken", position: { top: "50%", left: "50%" } },
  { id: "knie_fuss", label: "Knie & Fuß", position: { top: "75%", left: "50%" } }
];

export const TOP_SYMPTOMS = [
  { symptom: "Unterer Rückenschmerz", cluster: "ruecken_lws" },
  { symptom: "Nackenschmerzen", cluster: "kopf_nacken" },
  { symptom: "Kopfschmerzen (Spannung)", cluster: "kopf_nacken" },
  { symptom: "Schulterschmerzen", cluster: "schulter_arm" },
  { symptom: "Knieschmerzen (vorne)", cluster: "knie_fuss" },
  { symptom: "Hüftschmerzen", cluster: "huefte_becken" },
  { symptom: "Ischias", cluster: "ruecken_lws" },
  { symptom: "Plantarfasziitis", cluster: "knie_fuss" },
  { symptom: "Tennisellbogen", cluster: "schulter_arm" },
  { symptom: "Kieferverspannung (CMD)", cluster: "kopf_nacken" },
  { symptom: "ISG-Blockade", cluster: "ruecken_lws" },
  { symptom: "IT-Band-Syndrom", cluster: "knie_fuss" },
  { symptom: "Impingement-Syndrom", cluster: "schulter_arm" },
  { symptom: "Morgensteifigkeit", cluster: "ruecken_lws" },
  { symptom: "Hüftbeuger-Verkürzung", cluster: "huefte_becken" }
];