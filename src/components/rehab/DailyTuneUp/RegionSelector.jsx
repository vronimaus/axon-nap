import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import InteractiveBodyMapInput from '@/components/diagnosis/InteractiveBodyMapInput';

// Map body regions to MFR Node IDs
const REGION_TO_NODE_MAP = {
  'Kopf': 'N1', 'Stirn': 'N1', 'Hinterkopf': 'N1',
  'Kiefer': 'N1', 'Ohr': 'N1', 'Kiefergelenk': 'N1',
  'Hals': 'N2', 'Nacken': 'N2', 'Halswirbelsäule': 'N2',
  'Schulter': 'N6', 'Acromion': 'N6', 'Schulterblatt': 'N6',
  'Brust': 'N3', 'Thorax': 'N3', 'Rücken': 'N3', 'Rippen': 'N3',
  'Oberarm': 'N6', 'Ellenbogen': 'N7', 'Unterarm': 'N8', 'Handgelenk': 'N8', 'Hand': 'N8', 'Wrist': 'N8',
  'Bauch': 'N4', 'Bauchnabel': 'N4', 'Unterbauch': 'N4',
  'Lendenwirbelsäule': 'N4', 'unterer Rücken': 'N4', 'Lendenwirbelregion': 'N4',
  'Becken': 'N5', 'Hüfte': 'N9', 'Gesäß': 'N5',
  'Oberschenkel': 'N9', 'Oberschenkel vorne': 'N9', 'Oberschenkel hinten': 'N9',
  'Knie': 'N10', 'Kniekehle': 'N10',
  'Wade': 'N11', 'Unterschenkel': 'N11', 'Schienbein': 'N11',
  'Fuß': 'N12', 'Knöchel': 'N12', 'Ferse': 'N12', 'Achillessehne': 'N11',
};

export default function RegionSelector({ onRegionSelected }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Map detected region string to Node ID
  const getNodeIdFromRegion = (regionString) => {
    for (const [keyword, nodeId] of Object.entries(REGION_TO_NODE_MAP)) {
      if (regionString.toLowerCase().includes(keyword.toLowerCase())) {
        return nodeId;
      }
    }
    return 'N4'; // Default fallback
  };

  const handleBodyMapSubmit = (mapData) => {
    const nodeId = getNodeIdFromRegion(mapData.region);
    setSelectedRegion({
      region: mapData.region,
      nodeId,
      view: mapData.view,
    });
    setShowMap(false);
    // Fire callback with node ID
    onRegionSelected(nodeId, mapData.region);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto px-4 space-y-6"
    >
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-cyan-400">Wo tut's weh?</h3>
        <p className="text-sm text-slate-300">Wähle die betroffene Körperregion auf dem Körpermodell</p>
      </div>

      {/* Show Body Map or Selected Region */}
      <AnimatePresence mode="wait">
        {!showMap ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {!selectedRegion ? (
              <>
                {/* Quick Select Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Kopf & Kiefer', nodeId: 'N1', icon: '🧠' },
                    { label: 'Nacken', nodeId: 'N2', icon: '🔴' },
                    { label: 'Schulter', nodeId: 'N6', icon: '💪' },
                    { label: 'Oberer Rücken', nodeId: 'N3', icon: '🔲' },
                    { label: 'Unterer Rücken', nodeId: 'N4', icon: '⬇️' },
                    { label: 'Becken', nodeId: 'N5', icon: '🦴' },
                    { label: 'Hüfte', nodeId: 'N9', icon: '🦵' },
                    { label: 'Knie', nodeId: 'N10', icon: '🔗' },
                    { label: 'Fuß & Knöchel', nodeId: 'N12', icon: '👣' },
                  ].map(({ label, nodeId, icon }) => (
                    <button
                      key={nodeId}
                      onClick={() => onRegionSelected(nodeId, label)}
                      className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-slate-200 text-xs font-semibold transition-all active:scale-95"
                    >
                      <span className="text-lg mb-1 block">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {/* OR Separator */}
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500 font-semibold">ODER</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* Custom Selection Button */}
                <button
                  onClick={() => setShowMap(true)}
                  className="w-full p-4 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-slate-200 font-semibold transition-all active:scale-95"
                >
                  📍 Eigene Position markieren
                </button>
              </>
            ) : (
              <>
                {/* Selected Confirmation */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center"
                >
                  <p className="text-sm text-slate-300 mb-2">Ausgewählte Region:</p>
                  <p className="text-lg font-black text-emerald-400">{selectedRegion.region}</p>
                </motion.div>

                <button
                  onClick={() => setSelectedRegion(null)}
                  className="w-full p-3 rounded-xl border border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-all"
                >
                  ← Andere Region
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InteractiveBodyMapInput onSubmit={handleBodyMapSubmit} />
            <button
              onClick={() => setShowMap(false)}
              className="w-full mt-3 p-3 rounded-xl border border-slate-600 bg-slate-800/50 text-slate-300 text-sm font-semibold transition-all"
            >
              ← Zurück
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}