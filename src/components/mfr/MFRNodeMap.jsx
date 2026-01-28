import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import MFRNodeModal from './MFRNodeModal';
import { Loader2 } from 'lucide-react';

export default function MFRNodeMap() {
  const [nodes, setNodes] = useState([]);
  const [view, setView] = useState('front');
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const data = await base44.entities.MFRNode.list();
        setNodes(data);
      } catch (error) {
        console.error('Fehler beim Laden der MFR-Nodes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const frontNodes = nodes.filter(n => n.position === 'front');
  const backNodes = nodes.filter(n => n.position === 'back');
  const currentNodes = view === 'front' ? frontNodes : backNodes;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* View Toggle */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setView('front')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'front'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Vorderseite
        </button>
        <button
          onClick={() => setView('back')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'back'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Rückseite
        </button>
      </div>

      {/* Body Map with Interactive Nodes */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-cyan-500/30">
        {/* SVG Body Outline */}
        <svg
          viewBox="0 0 100 200"
          className="w-full h-auto mb-6 opacity-40"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Simple Body Silhouette */}
          <circle cx="50" cy="20" r="8" fill="rgba(6, 182, 212, 0.3)" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="0.5" />
          <path d="M 50 28 L 50 85" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" />
          <path d="M 50 40 L 30 60" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" />
          <path d="M 50 40 L 70 60" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" />
          <path d="M 50 85 L 35 150" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" />
          <path d="M 50 85 L 65 150" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" />
        </svg>

        {/* Interactive Node Points */}
        <div className="relative w-full aspect-[1/2] bg-slate-800/30 rounded-xl overflow-hidden">
          {currentNodes.map(node => (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`
              }}
              title={node.name_de}
            >
              {/* Outer pulsing ring */}
              <div className="absolute w-8 h-8 -left-4 -top-4 rounded-full border-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
              
              {/* Main node circle */}
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full shadow-lg shadow-cyan-500/50 flex items-center justify-center group-hover:scale-125 transition-transform">
                <span className="text-xs font-bold text-white">{node.node_id.replace('N', '')}</span>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 border border-cyan-500 rounded-lg px-3 py-2 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="font-semibold text-cyan-400">{node.node_id}</div>
                <div className="text-slate-300 text-xs">{node.name_de}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 text-xs text-slate-400 text-center">
          Klicke auf einen Node um die Druckpunkt-Anleitung zu öffnen
        </div>
      </div>

      {/* Node List as Alternative */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {currentNodes.map(node => (
          <button
            key={node.id}
            onClick={() => setSelectedNode(node)}
            className="p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-500 hover:bg-slate-700 transition-all text-left group"
          >
            <div className="font-semibold text-cyan-400 text-sm">{node.node_id}</div>
            <div className="text-xs text-slate-400 group-hover:text-slate-300">{node.name_de}</div>
            <div className="text-xs text-slate-500 mt-1">{node.body_area}</div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedNode && (
        <MFRNodeModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}