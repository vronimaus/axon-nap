/**
 * Body Map Region Detection — Polygon-basiert
 *
 * Ersetzt das alte X/Y-Schwellwert-Raster durch anatomisch korrekte Polygon-Zonen.
 * Polygone sind im Canvas-Koordinatensystem (400×600) definiert.
 * Das Körperbild bleibt unverändert — die Polygone sind unsichtbare Overlay-Zonen.
 */

// ── Point-in-Polygon Test (Ray Casting) ──
export function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Front View Regionen (Canvas 400×600) ──
// Koordinaten basierend auf dem anatomischen Körperbild (frontal, stehend)
const FRONT_REGIONS = [
  // Kopf
  { id: 'head', label: 'Kopf/Stirn', laterality: null,
    polygon: [[168, 2], [232, 2], [238, 42], [162, 42]] },

  // Ohren / Kiefergelenke (seitlich vom Kopf)
  { id: 'ear_left', label: 'Ohr/Kiefergelenk', laterality: 'links',
    polygon: [[148, 35], [172, 38], [178, 62], [145, 58]] },
  { id: 'ear_right', label: 'Ohr/Kiefergelenk', laterality: 'rechts',
    polygon: [[228, 38], [252, 35], [255, 58], [222, 62]] },

  // Hals vorne (zwischen Kopf und Schultern, zentral)
  { id: 'neck_front', label: 'Hals vorne', laterality: null,
    polygon: [[178, 42], [222, 42], [225, 68], [175, 68]] },

  // Schultern — breite Trapezoide, erweitert nach unten für 600×600 Canvas
  { id: 'shoulder_left', label: 'Schulter/Acromion', laterality: 'links',
    polygon: [[85, 65], [195, 65], [190, 115], [130, 140], [85, 120]] },
  { id: 'shoulder_right', label: 'Schulter/Acromion', laterality: 'rechts',
    polygon: [[205, 65], [315, 65], [315, 120], [270, 140], [210, 115]] },

  // Obere Brust / Schlüsselbein — NUR zwischen den Schultern, schmal
  { id: 'upper_chest', label: 'Obere Brust/Schlüsselbein', laterality: null,
    polygon: [[192, 68], [208, 68], [215, 112], [185, 112]] },

  // Mittlere Brust — breiter, zwischen den Oberarmen
  { id: 'mid_chest', label: 'Brust', laterality: null,
    polygon: [[155, 112], [245, 112], [250, 180], [150, 180]] },

  // Oberarme — ausserhalb der Brust, unter den Schultern
  { id: 'upper_arm_left', label: 'Oberarm', laterality: 'links',
    polygon: [[65, 92], [130, 108], [122, 210], [58, 198]] },
  { id: 'upper_arm_right', label: 'Oberarm', laterality: 'rechts',
    polygon: [[270, 108], [335, 92], [342, 198], [278, 210]] },

  // Ellenbogen-Beuge
  { id: 'elbow_left', label: 'Ellenbogen', laterality: 'links',
    polygon: [[58, 198], [122, 210], [116, 245], [52, 238]] },
  { id: 'elbow_right', label: 'Ellenbogen', laterality: 'rechts',
    polygon: [[278, 210], [342, 198], [348, 238], [284, 245]] },

  // Bauch oben (unter der Brust)
  { id: 'upper_abdomen', label: 'Bauch oben', laterality: null,
    polygon: [[158, 180], [242, 180], [248, 235], [152, 235]] },

  // Bauch Mitte / Bauchnabel
  { id: 'mid_abdomen', label: 'Bauch/Nabel', laterality: null,
    polygon: [[152, 235], [248, 235], [252, 275], [148, 275]] },

  // Unterbauch / Becken (zentral)
  { id: 'lower_abdomen', label: 'Unterbauch/Becken', laterality: null,
    polygon: [[148, 275], [252, 275], [258, 315], [142, 315]] },

  // Unterarme / Handgelenke
  { id: 'forearm_left', label: 'Unterarm/Handgelenk', laterality: 'links',
    polygon: [[52, 238], [116, 245], [110, 305], [48, 298]] },
  { id: 'forearm_right', label: 'Unterarm/Handgelenk', laterality: 'rechts',
    polygon: [[284, 245], [348, 238], [352, 298], [290, 305]] },

  // Hüfte / Becken seitlich
  { id: 'hip_left', label: 'Hüfte/Becken', laterality: 'links',
    polygon: [[110, 275], [152, 275], [155, 325], [105, 318]] },
  { id: 'hip_right', label: 'Hüfte/Becken', laterality: 'rechts',
    polygon: [[248, 275], [290, 275], [295, 318], [245, 325]] },

  // Oberschenkel vorne
  { id: 'thigh_left', label: 'Oberschenkel', laterality: 'links',
    polygon: [[138, 315], [200, 315], [202, 435], [132, 428]] },
  { id: 'thigh_right', label: 'Oberschenkel', laterality: 'rechts',
    polygon: [[200, 315], [262, 315], [268, 428], [198, 435]] },

  // Knie vorne
  { id: 'knee_left', label: 'Knie', laterality: 'links',
    polygon: [[132, 428], [202, 435], [198, 470], [128, 462]] },
  { id: 'knee_right', label: 'Knie', laterality: 'rechts',
    polygon: [[198, 435], [268, 428], [272, 462], [202, 470]] },

  // Unterschenkel / Schienbein
  { id: 'calf_left', label: 'Unterschenkel', laterality: 'links',
    polygon: [[128, 462], [198, 470], [195, 565], [122, 558]] },
  { id: 'calf_right', label: 'Unterschenkel', laterality: 'rechts',
    polygon: [[202, 470], [272, 462], [278, 558], [205, 565]] },

  // Füsse / Knöchel
  { id: 'foot_left', label: 'Fuß/Knöchel', laterality: 'links',
    polygon: [[122, 558], [195, 565], [190, 600], [118, 595]] },
  { id: 'foot_right', label: 'Fuß/Knöchel', laterality: 'rechts',
    polygon: [[205, 565], [278, 558], [282, 595], [210, 600]] },
];

// ── Back View Regionen (Canvas 400×600) ──
const BACK_REGIONS = [
  // Hinterkopf
  { id: 'head_back', label: 'Hinterkopf', laterality: null,
    polygon: [[168, 2], [232, 2], [238, 42], [162, 42]] },

  // Nacken seitlich
  { id: 'neck_side_left', label: 'Nacken seitlich', laterality: 'links',
    polygon: [[145, 40], [178, 45], [182, 72], [142, 65]] },
  { id: 'neck_side_right', label: 'Nacken seitlich', laterality: 'rechts',
    polygon: [[222, 45], [255, 40], [258, 65], [218, 72]] },

  // Nacken / obere HWS (zentral)
  { id: 'neck_back', label: 'Nacken/HWS', laterality: null,
    polygon: [[178, 42], [222, 42], [218, 72], [182, 72]] },

  // Schulter hinten / Acromion — gleiche Breite wie vorne
  { id: 'shoulder_back_left', label: 'Schulter/Acromion', laterality: 'links',
    polygon: [[85, 65], [195, 65], [190, 115], [130, 140], [85, 120]] },
  { id: 'shoulder_back_right', label: 'Schulter/Acromion', laterality: 'rechts',
    polygon: [[205, 65], [315, 65], [315, 120], [270, 140], [210, 115]] },

  // Oberer Rücken / Nacken (zwischen Schultern, unter dem Nacken)
  { id: 'upper_back', label: 'Oberer Rücken', laterality: null,
    polygon: [[155, 95], [245, 95], [250, 165], [150, 165]] },

  // Schulterblätter
  { id: 'shoulder_blade_left', label: 'Schulterblatt', laterality: 'links',
    polygon: [[105, 95], [155, 95], [150, 175], [98, 165]] },
  { id: 'shoulder_blade_right', label: 'Schulterblatt', laterality: 'rechts',
    polygon: [[245, 95], [295, 95], [302, 165], [250, 175]] },

  // Oberarme hinten
  { id: 'upper_arm_back_left', label: 'Oberarm', laterality: 'links',
    polygon: [[65, 92], [100, 95], [95, 165], [58, 158]] },
  { id: 'upper_arm_back_right', label: 'Oberarm', laterality: 'rechts',
    polygon: [[300, 95], [335, 92], [342, 158], [305, 165]] },

  // Mittlerer Rücken
  { id: 'mid_back', label: 'Mittlerer Rücken', laterality: null,
    polygon: [[150, 165], [250, 165], [252, 225], [148, 225]] },

  // Ellenbogen hinten
  { id: 'elbow_back_left', label: 'Ellenbogen', laterality: 'links',
    polygon: [[58, 158], [95, 165], [90, 200], [52, 195]] },
  { id: 'elbow_back_right', label: 'Ellenbogen', laterality: 'rechts',
    polygon: [[305, 165], [342, 158], [348, 195], [310, 200]] },

  // Unterer Rücken / LWS
  { id: 'lower_back', label: 'Unterer Rücken/LWS', laterality: null,
    polygon: [[148, 225], [252, 225], [258, 275], [142, 275]] },

  // Unterarme hinten
  { id: 'forearm_back_left', label: 'Unterarm/Handgelenk', laterality: 'links',
    polygon: [[52, 195], [90, 200], [85, 270], [48, 262]] },
  { id: 'forearm_back_right', label: 'Unterarm/Handgelenk', laterality: 'rechts',
    polygon: [[310, 200], [348, 195], [352, 262], [315, 270]] },

  // Gesäß
  { id: 'glutes', label: 'Gesäß', laterality: null,
    polygon: [[142, 275], [258, 275], [265, 325], [135, 325]] },

  // Hüfte / Becken seitlich
  { id: 'hip_back_left', label: 'Hüfte/Becken', laterality: 'links',
    polygon: [[105, 275], [142, 275], [138, 325], [98, 318]] },
  { id: 'hip_back_right', label: 'Hüfte/Becken', laterality: 'rechts',
    polygon: [[258, 275], [295, 275], [302, 318], [262, 325]] },

  // Oberschenkel hinten
  { id: 'thigh_back_left', label: 'Oberschenkel', laterality: 'links',
    polygon: [[135, 325], [200, 325], [202, 435], [132, 428]] },
  { id: 'thigh_back_right', label: 'Oberschenkel', laterality: 'rechts',
    polygon: [[200, 325], [265, 325], [268, 428], [198, 435]] },

  // Kniekehlen
  { id: 'knee_back_left', label: 'Kniekehle', laterality: 'links',
    polygon: [[132, 428], [202, 435], [198, 470], [128, 462]] },
  { id: 'knee_back_right', label: 'Kniekehle', laterality: 'rechts',
    polygon: [[198, 435], [268, 428], [272, 462], [202, 470]] },

  // Waden
  { id: 'calf_back_left', label: 'Wade', laterality: 'links',
    polygon: [[128, 462], [198, 470], [195, 565], [122, 558]] },
  { id: 'calf_back_right', label: 'Wade', laterality: 'rechts',
    polygon: [[202, 470], [272, 462], [278, 558], [205, 565]] },

  // Fersen / Achillessehne
  { id: 'foot_back_left', label: 'Ferse/Achillessehne', laterality: 'links',
    polygon: [[122, 558], [195, 565], [190, 600], [118, 595]] },
  { id: 'foot_back_right', label: 'Ferse/Achillessehne', laterality: 'rechts',
    polygon: [[205, 565], [278, 558], [282, 595], [210, 600]] },
];

const REGIONS_BY_VIEW = {
  front: FRONT_REGIONS,
  back: BACK_REGIONS,
};

/**
 * Erkennt die Körperregion anhand von Markierungen.
 * @param {Array} markers - Array von {type:'point', x, y} oder {type:'line', points:[{x,y}]}
 * @param {string} view - 'front' oder 'back'
 * @param {number} canvasWidth - Canvas-Breite (default 400)
 * @param {number} canvasHeight - Canvas-Höhe (default 600)
 * @returns {string} Region-Label mit Laterality (z.B. "Schulter/Acromion links")
 */
export function detectRegionFromMarkers(markers, view, canvasWidth = 400, canvasHeight = 600) {
  if (!markers || markers.length === 0) return 'systemisch';

  const regions = REGIONS_BY_VIEW[view] || FRONT_REGIONS;

  // Polygone sind im 400×600 Raum definiert. Skaliere Punkt-Koordinaten
  // dorthin, damit die Erkennung bei jedem Canvas-Seitenverhältnis stimmt.
  const scaleX = 400 / canvasWidth;
  const scaleY = 600 / canvasHeight;

  // Sammle alle Punkte
  const points = [];
  markers.forEach(marker => {
    if (marker.type === 'point' && marker.x != null && marker.y != null) {
      points.push([marker.x, marker.y]);
    } else if (marker.points) {
      marker.points.forEach(p => points.push([p.x, p.y]));
    }
  });

  if (points.length === 0) return 'systemisch';

  // Für jeden Punkt die Region finden, dann Mehrheitsentscheid
  const regionCounts = {};
  points.forEach(point => {
    const scaled = [point[0] * scaleX, point[1] * scaleY];
    for (const region of regions) {
      if (pointInPolygon(scaled, region.polygon)) {
        const key = region.id;
        regionCounts[key] = (regionCounts[key] || 0) + 1;
        break;
      }
    }
  });

  // Keine Region gefunden → Fallback auf Y-basierte Grob-Erkennung
  if (Object.keys(regionCounts).length === 0) {
    const avgY = points.reduce((s, p) => s + p[1] * scaleY, 0) / points.length;
    const normalizedY = avgY / 600;
    if (normalizedY < 0.10) return 'Kopf';
    if (normalizedY < 0.18) return 'Nacken/Schulter';
    if (normalizedY < 0.30) return 'Brust/Rücken oben';
    if (normalizedY < 0.45) return 'Bauch/Rücken';
    if (normalizedY < 0.55) return 'Becken/Hüfte';
    if (normalizedY < 0.70) return 'Oberschenkel';
    if (normalizedY < 0.80) return 'Knie';
    if (normalizedY < 0.95) return 'Unterschenkel';
    return 'Fuß';
  }

  // Häufigste Region
  const bestId = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0][0];
  const bestRegion = regions.find(r => r.id === bestId);

  if (bestRegion.laterality) {
    return `${bestRegion.label} ${bestRegion.laterality}`;
  }
  return bestRegion.label;
}

/**
 * Gibt alle Regionen für eine Ansicht zurück (für Debug-Visualisierung).
 */
export function getRegionsForView(view) {
  return REGIONS_BY_VIEW[view] || FRONT_REGIONS;
}