export const glossaryTerms = {
  mfr: {
    term: 'MFR (Myofascial Release)',
    shortDesc: 'Gezielte Drucktechniken zur Spannungslösung',
    fullDesc: 'Das gezielte Lösen von Spannungen in den Muskeln und dem umgebenden Fasziengewebe (Bindegewebe) durch Druck. Um mechanische Blockaden zu lösen und die Informationsqualität der Nerven in diesem Bereich zu verbessern.',
    category: 'basics'
  },
  neuroDrills: {
    term: 'Neuro-Drills',
    shortDesc: 'Übungen für Augen und Gleichgewicht',
    fullDesc: 'Spezifische Übungen für die Augen (visuelles System) oder das Gleichgewichtsorgan (vestibuläres System). Um dem Gehirn ein Signal von "Sicherheit" zu senden, damit es Schutzspannungen und Schmerzsignale abschaltet.',
    category: 'basics'
  },
  nodes: {
    term: 'Nodes (Knotenpunkte)',
    shortDesc: '12 strategische Punkte am Körper',
    fullDesc: '12 strategisch gewählte Punkte am Körper mit einer besonders hohen Dichte an sensorischen Nervenenden. Diese Punkte dienen als "Eingabetasten", um direkt mit dem Nervensystem zu kommunizieren.',
    category: 'basics'
  },
  integration: {
    term: 'Integration',
    shortDesc: 'Festigung der neuen Beweglichkeit',
    fullDesc: 'Die abschließende Phase einer Session, in der die gewonnene Beweglichkeit durch Kraft oder Koordination gefestigt wird. Damit dein Gehirn lernt, den neuen Bewegungsradius dauerhaft zu akzeptieren und abzuspeichern.',
    category: 'basics'
  },
  propriozeption: {
    term: 'Propriozeption',
    shortDesc: 'Dein innerer "6. Sinn"',
    fullDesc: 'Dein "innerer sechster Sinn". Sie beschreibt die Fähigkeit deines Körpers, seine eigene Position, Spannung und Bewegung im Raum wahrzunehmen. Je klarer dieses Bild im Gehirn ist, desto weniger Schmerz sendet es.',
    category: 'deepdive'
  },
  faszien: {
    term: 'Faszien',
    shortDesc: 'Kollagenes Netzwerk im ganzen Körper',
    fullDesc: 'Ein kollagenes Netzwerk, das deinen gesamten Körper wie ein Spinnennetz durchzieht. Es verbindet Muskeln, Knochen und Organe. AXON sorgt dafür, dass dieses Netz gleitfähig bleibt.',
    category: 'deepdive'
  },
  sakkaden: {
    term: 'Sakkaden',
    shortDesc: 'Schnelle Augensprünge',
    fullDesc: 'Schnelle, präzise Augensprünge von einem Ziel zum anderen. In der AXON-Methodik nutzen wir sie, um die Areale im Gehirn zu aktivieren, die für die Planung von Bewegungen zuständig sind.',
    category: 'deepdive'
  },
  voms: {
    term: 'VOMS (Vestibular/Ocular Motor Screening)',
    shortDesc: 'Klinisches Testverfahren',
    fullDesc: 'Ein klinisch anerkanntes Testverfahren, das prüft, wie gut deine Augen und dein inneres Gleichgewicht zusammenarbeiten. Wir nutzen Drills daraus, um dein "Navigationssystem" im Kopf zu kalibrieren.',
    category: 'deepdive'
  },
  parasympathikus: {
    term: 'Parasympathikus',
    shortDesc: 'Entspannungsmodus des Nervensystems',
    fullDesc: 'Der Teil deines Nervensystems, der für Entspannung, Verdauung und Regeneration zuständig ist. Unsere "Nightly Reset" Routine zielt direkt darauf ab, diesen Modus zu aktivieren.',
    category: 'deepdive'
  },
  readinessScore: {
    term: 'Readiness Score',
    shortDesc: 'Deine tägliche Belastbarkeit',
    fullDesc: 'Eine Einschätzung deiner täglichen Belastbarkeit basierend auf Energie, Stress und (optional) deiner Herzratenvariabilität (HRV). Er verhindert, dass du dich überforderst oder unterforderst.',
    category: 'deepdive'
  }
};

export const getGlossaryTerm = (key) => glossaryTerms[key] || null;