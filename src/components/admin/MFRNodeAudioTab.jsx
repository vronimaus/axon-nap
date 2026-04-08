import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, Loader2, Volume2, Copy, Check, Edit, X } from 'lucide-react';
import { toast } from 'sonner';

const NODE_IDS = ['CP-A', 'CP-P', 'CL-A', 'CL-P', 'TH-A', 'TH-P', 'LU-A', 'LU-P', 'PV-A', 'PV-P', 'SC-A', 'SC-P', 'HU-A', 'CU-A', 'CX-A', 'CX-P', 'GE-A', 'GE-P', 'TA-A', 'TA-P', 'PE-A'];

// Mapping: welche alten N1–N12 entsprechen welchen neuen Stecco-Nodes
const STECCO_MAPPING = {
  'CP-A': 'N1',  // Kopf (Anterior)
  'CP-P': 'N2',  // Kopf (Posterior)
  'CL-A': 'N3',  // Hals (Anterior)
  'CL-P': 'N4',  // Hals (Posterior)
  'TH-A': 'N5',  // Thorax (Anterior)
  'TH-P': 'N6',  // Thorax (Posterior)
  'LU-A': 'N7',  // Lende (Anterior)
  'LU-P': 'N8',  // Lende (Posterior)
  'PV-A': 'N9',  // Becken (Anterior)
  'PV-P': 'N10', // Becken (Posterior)
  'SC-A': 'N11', // Schulter (Anterior)
  'SC-P': 'N11', // Schulter (Posterior) — teilt sich N11
  'HU-A': 'N12', // Oberarm (Anterior) — passt zu N12
  'CU-A': null,  // Ellenbogen (Anterior) — NEU
  'CX-A': null,  // Hüfte (Anterior) — NEU
  'CX-P': null,  // Hüfte (Posterior) — NEU
  'GE-A': null,  // Knie (Anterior) — NEU
  'GE-P': null,  // Knie (Posterior) — NEU
  'TA-A': null,  // Sprunggelenk (Anterior) — NEU
  'TA-P': null,  // Sprunggelenk (Posterior) — NEU
  'PE-A': null,  // Fuß (Anterior) — NEU
};

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function AudioRow({ nodeId, nodeName, instructionText, onTextUpdate }) {
  const [cached, setCached] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(instructionText);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef(null);
  const inputRef = useRef(null);

  const handleCopy = () => {
    if (!instructionText?.trim()) return;
    navigator.clipboard.writeText(instructionText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await onTextUpdate(editText.trim());
      setEditing(false);
      toast.success(`Text für ${nodeId} gespeichert`);
    } catch (err) {
      toast.error('Speichern fehlgeschlagen: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const checkCache = async () => {
      if (!instructionText?.trim()) {
        setCached(false);
        return;
      }
      const hash = await hashText(instructionText.trim());
      const results = await base44.entities.TTSCache.filter({ text_hash: hash });
      setCached(results.length > 0 ? results[0].file_uri : false);
    };
    checkCache();
  }, [instructionText]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const hash = await hashText(instructionText.trim());
      // Delete old entry if exists
      const existing = await base44.entities.TTSCache.filter({ text_hash: hash });
      if (existing.length > 0) {
        await base44.entities.TTSCache.delete(existing[0].id);
      }
      // Upload file
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      // Save to TTSCache
      await base44.entities.TTSCache.create({
        text_hash: hash,
        file_uri,
        text_preview: instructionText.trim().substring(0, 100)
      });
      setCached(file_uri);
      toast.success(`Audio für ${nodeId} gespeichert`);
    } catch (err) {
      toast.error('Upload fehlgeschlagen: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePlay = async () => {
    if (!cached) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: cached, expires_in: 300 });
      const audio = new Audio(signed_url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play();
      setPlaying(true);
    } catch (err) {
      toast.error('Wiedergabe fehlgeschlagen');
    }
  };

  return (
    <div className="flex items-start gap-3 py-4 border-b border-slate-800/60 last:border-0">
      {/* Status dot */}
      <div className="mt-1 flex-shrink-0">
        {cached === null ? (
          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
        ) : cached ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
        )}
      </div>

      {/* Text Column */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{nodeId} – {nodeName}</p>
        {editing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full text-xs bg-slate-800 text-slate-200 border border-cyan-500/30 rounded-lg p-2 resize-none focus:outline-none focus:border-cyan-400"
            rows="3"
          />
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{instructionText || '—'}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving || !editText.trim()}
              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-40"
              title="Speichern"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditText(instructionText);
              }}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 transition-all"
              title="Abbrechen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            {cached && (
              <button
                onClick={handlePlay}
                className={`p-2 rounded-lg transition-all ${
                  playing ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 hover:text-cyan-400'
                }`}
                title="Abspielen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading || !instructionText?.trim()}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-40"
              title="Audio hochladen (.wav / .mp3)"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleCopy}
              disabled={!instructionText?.trim()}
              className={`p-2 rounded-lg transition-all disabled:opacity-40 ${
                copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
              }`}
              title="Text kopieren"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
              title="Text bearbeiten"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function MFRNodeAudioTab() {
  const [nodes, setNodes] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await base44.entities.MFRNode.list();
        const map = {};
        for (const r of results) {
          const nodeId = r.node_id || r.data?.node_id;
          if (nodeId) {
            map[nodeId] = {
              name: r.data?.name_de || r.name_de || nodeId,
              instruction: r.data?.user_instruction || r.user_instruction || ''
            };
          }
        }
        
        // Stecco-Nodes erben Texte von ihren Base-Nodes (N1–N12)
        for (const [steccoId, baseId] of Object.entries(STECCO_MAPPING)) {
          if (baseId && !map[steccoId] && map[baseId]) {
            map[steccoId] = { ...map[baseId] };
          }
        }
        
        setNodes(map);
      } catch (err) {
        toast.error('Fehler beim Laden: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl border border-cyan-500/30 p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl border border-cyan-500/30 p-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-1">🎙️ MFR Node Audio Manager (Stecco)</h2>
        <p className="text-sm text-slate-400 mb-1">
          Alle `user_instruction` Texte für CP, CL, TH, LU, PV, SC, HU, CU, CX, GE, TA, PE (nach Stecco 14-Segment-System). Grüner Punkt = Audio vorhanden.
        </p>
        <p className="text-xs text-slate-500">
          A = Anterior, P = Posterior. Neben dem Text: Upload-Button für Audio, Wiedergabe-Button (wenn vorhanden), Copy-Button.
        </p>
      </div>

      <div className="glass rounded-2xl border border-slate-700/50 p-4">
        {NODE_IDS.map(nodeId => {
          const nodeData = nodes[nodeId];
          const baseNodeId = STECCO_MAPPING[nodeId];
          
          return (
            <div key={nodeId} className="border-b border-slate-800/60 last:border-0">
              {/* Header mit Base-Node Info */}
              {baseNodeId && (
                <div className="py-1.5 px-2 bg-slate-800/30 text-[9px] text-slate-500 uppercase tracking-widest">
                  ← Geerbt von {baseNodeId}
                </div>
              )}
              <AudioRow
                key={`${nodeId}-row`}
                nodeId={nodeId}
                nodeName={nodeData?.name || nodeId}
                instructionText={nodeData?.instruction || ''}
                onTextUpdate={async (newText) => {
                  // Create or update node
                  let node = nodes[nodeId];
                  if (node) {
                    await base44.entities.MFRNode.update(nodeId, { user_instruction: newText });
                  } else {
                    // Create new node if doesn't exist
                    await base44.entities.MFRNode.create({
                      node_id: nodeId,
                      name_de: nodeId,
                      user_instruction: newText,
                      position: 'front'
                    });
                  }
                  setNodes(prev => ({
                    ...prev,
                    [nodeId]: { name: prev[nodeId]?.name || nodeId, instruction: newText }
                  }));
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}