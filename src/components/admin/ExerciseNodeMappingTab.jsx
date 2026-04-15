import React, { useState } from 'react';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { jsPDF } from 'jspdf';

const VALID_NODES = [
  'CP-P', 'CL-P', 'TH-P', 'LU-P', 'PV-P', 'HU-A', 'CU-A', 'CA-A',
  'TH-A', 'LU-A', 'CX-A', 'CX-P', 'GE-A', 'GE-P', 'TA-A', 'TA-P', 'PE-A', 'LA-CX'
];

const NODE_LABELS = {
  'CP-P': 'Caput posterior – Schädelbasis',
  'CL-P': 'Collum posterior – Nacken',
  'TH-A': 'Thorax anterior – Brust/Schulter',
  'TH-P': 'Thorax posterior – Oberer Rücken',
  'LU-A': 'Lumbus anterior – Unterer Rücken vorne',
  'LU-P': 'Lumbus posterior – Unterer Rücken hinten',
  'PV-P': 'Pelvis posterior – Becken/Kreuzbein',
  'HU-A': 'Humerus anterior – Arm/Bizeps',
  'CU-A': 'Cubitus anterior – Ellbogen/Unterarm',
  'CA-A': 'Carpus anterior – Handgelenk',
  'CX-A': 'Coxa anterior – Hüfte vorne',
  'CX-P': 'Coxa posterior – Gesäß',
  'LA-CX': 'Lateralis Coxa – Seitliche Hüfte',
  'GE-A': 'Genu anterior – Knie vorne/Quadrizeps',
  'GE-P': 'Genu posterior – Knie hinten/Hamstrings',
  'TA-A': 'Tarsus anterior – Schienbein/Vorderseite',
  'TA-P': 'Tarsus posterior – Wade/Gastrocnemius',
  'PE-A': 'Pes anterior – Fuß/Zehen',
};

const CATEGORY_COLORS = {
  mfr: 'bg-emerald-500/20 text-emerald-300',
  mobility: 'bg-blue-500/20 text-blue-300',
  neuro: 'bg-purple-500/20 text-purple-300',
  strength: 'bg-orange-500/20 text-orange-300',
  core: 'bg-cyan-500/20 text-cyan-300',
  push: 'bg-red-500/20 text-red-300',
  pull: 'bg-pink-500/20 text-pink-300',
  hinge: 'bg-yellow-500/20 text-yellow-300',
  squat: 'bg-lime-500/20 text-lime-300',
  carry: 'bg-amber-500/20 text-amber-300',
  breath: 'bg-teal-500/20 text-teal-300',
  other: 'bg-zinc-500/20 text-zinc-400',
};

export default function ExerciseNodeMappingTab() {
  const [selectedNode, setSelectedNode] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showNoNodes, setShowNoNodes] = useState(false);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-all'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  // Group exercises by node
  const nodeMap = {};
  const noNodeExercises = [];

  for (const ex of exercises) {
    const nodes = ex.affected_nodes || [];
    if (nodes.length === 0) {
      noNodeExercises.push(ex);
    } else {
      for (const node of nodes) {
        if (!nodeMap[node]) nodeMap[node] = [];
        nodeMap[node].push(ex);
      }
    }
  }

  // Filter exercises to display
  const getDisplayedExercises = () => {
    let list = [];
    if (showNoNodes) {
      list = noNodeExercises;
    } else if (selectedNode === 'ALL') {
      list = exercises;
    } else {
      list = nodeMap[selectedNode] || [];
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(ex =>
        ex.name?.toLowerCase().includes(q) ||
        ex.exercise_id?.toLowerCase().includes(q) ||
        ex.category?.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const displayed = getDisplayedExercises();

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    const margin = 14;
    const colWidths = [50, 95, 28, 100]; // ID, Name, Kategorie, Nodes
    const rowH = 7;
    const headerH = 8;

    // Title
    doc.setFontSize(15);
    doc.setTextColor(30, 30, 30);
    doc.text('AXON – Exercise Node Mapping', margin, 14);

    // Subtitle
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const filterLabel = showNoNodes
      ? 'Ohne Nodes'
      : selectedNode === 'ALL'
      ? 'Alle Exercises'
      : `Node: ${selectedNode} – ${NODE_LABELS[selectedNode] || ''}`;
    doc.text(`Filter: ${filterLabel}  |  ${displayed.length} Exercises  |  ${new Date().toLocaleDateString('de-DE')}`, margin, 20);

    // Draw header row
    let y = 26;
    const headers = ['Exercise ID', 'Name', 'Kategorie', 'Affected Nodes'];
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, y, pageW - margin * 2, headerH, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    let x = margin;
    headers.forEach((h, i) => {
      doc.text(h, x + 2, y + 5.5);
      x += colWidths[i];
    });
    y += headerH;

    // Draw data rows
    doc.setFont('helvetica', 'normal');
    displayed.forEach((ex, idx) => {
      if (y > 195) {
        doc.addPage();
        y = 14;
      }
      // alternating background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
      }

      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      x = margin;

      // ID (monospace-like with courier)
      doc.setFont('courier', 'normal');
      doc.text((ex.exercise_id || '').substring(0, 28), x + 2, y + 5);
      x += colWidths[0];

      // Name
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      const name = (ex.name || '').substring(0, 45);
      doc.text(name, x + 2, y + 5);
      x += colWidths[1];

      // Category
      doc.setTextColor(80, 80, 80);
      doc.text(ex.category || '', x + 2, y + 5);
      x += colWidths[2];

      // Nodes
      doc.setFont('courier', 'normal');
      doc.setTextColor(60, 120, 80);
      const nodes = (ex.affected_nodes || []).join(', ') || '—';
      doc.text(nodes.substring(0, 55), x + 2, y + 5);

      // row border
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + rowH, pageW - margin, y + rowH);

      y += rowH;
    });

    const filename = showNoNodes
      ? 'axon_exercises_ohne_nodes.pdf'
      : selectedNode === 'ALL'
      ? 'axon_exercises_alle.pdf'
      : `axon_exercises_${selectedNode}.pdf`;

    doc.save(filename);
  };

  if (isLoading) {
    return <div className="text-zinc-500 text-sm p-6">Lade Exercises…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900 border border-white/[0.06] p-4 text-center">
          <div className="text-2xl font-bold text-white">{exercises.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Exercises gesamt</div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-white/[0.06] p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{exercises.length - noNodeExercises.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Mit Nodes</div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-white/[0.06] p-4 text-center cursor-pointer hover:border-red-500/40 transition-colors" onClick={() => { setShowNoNodes(true); setSelectedNode('ALL'); }}>
          <div className={`text-2xl font-bold ${noNodeExercises.length > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{noNodeExercises.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Ohne Nodes ⚠️</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={downloadPDF}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
        >
          ⬇ PDF Download ({displayed.length})
        </button>
        <input
          type="text"
          placeholder="Suche nach Name, ID, Kategorie…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 rounded-lg bg-zinc-800 border border-white/[0.06] text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
        />
        <button
          onClick={() => { setShowNoNodes(false); setSelectedNode('ALL'); }}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${!showNoNodes && selectedNode === 'ALL' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
        >
          Alle
        </button>
        {noNodeExercises.length > 0 && (
          <button
            onClick={() => { setShowNoNodes(true); setSelectedNode('ALL'); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showNoNodes ? 'bg-red-500/30 text-red-300' : 'bg-zinc-800 text-red-400 hover:bg-zinc-700'}`}
          >
            Ohne Nodes ({noNodeExercises.length})
          </button>
        )}
      </div>

      {/* Node pills */}
      <div className="flex flex-wrap gap-1.5">
        {VALID_NODES.map(node => {
          const count = nodeMap[node]?.length || 0;
          return (
            <button
              key={node}
              onClick={() => { setSelectedNode(node); setShowNoNodes(false); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedNode === node && !showNoNodes
                  ? 'bg-zinc-200 text-zinc-900 font-bold'
                  : count > 0
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-zinc-900 text-zinc-700 cursor-default'
              }`}
            >
              {node} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Selected node label */}
      {selectedNode !== 'ALL' && !showNoNodes && (
        <div className="text-xs text-zinc-500 font-mono">
          <span className="text-zinc-300 font-bold">{selectedNode}</span> — {NODE_LABELS[selectedNode] || ''}
          <span className="ml-2 text-zinc-600">· {displayed.length} Exercises</span>
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">Keine Exercises gefunden.</div>
        ) : (
          displayed.map(ex => (
            <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-zinc-900 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <span className="font-mono text-[10px] text-zinc-600 w-36 flex-shrink-0 truncate">{ex.exercise_id}</span>
              <span className="flex-1 text-sm text-zinc-200 truncate">{ex.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${CATEGORY_COLORS[ex.category] || CATEGORY_COLORS.other}`}>
                {ex.category}
              </span>
              <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end max-w-[200px]">
                {(ex.affected_nodes || []).map(n => (
                  <span key={n} className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${VALID_NODES.includes(n) ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {n}
                  </span>
                ))}
                {(!ex.affected_nodes || ex.affected_nodes.length === 0) && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400">— leer</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}