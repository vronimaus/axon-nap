import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, Loader2, Volume2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const NODE_IDS = ['CP-A', 'CP-P', 'CL-A', 'CL-P', 'TH-A', 'TH-P', 'LU-A', 'LU-P', 'PV-A', 'PV-P', 'SC-A', 'SC-P', 'HU-A', 'CU-A', 'CX-A', 'CX-P', 'GE-A', 'GE-P', 'TA-A', 'TA-P', 'PE-A'];

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function AudioRow({ nodeId, nodeName, instructionText }) {
  const [cached, setCached] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);
  const inputRef = useRef(null);

  const handleCopy = () => {
    if (!instructionText?.trim()) return;
    navigator.clipboard.writeText(instructionText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{instructionText || '—'}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
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
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleUpload}
        />
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
          if (!nodeData) {
            return (
              <div key={nodeId} className="py-3 border-b border-slate-800/60 last:border-0 opacity-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{nodeId}</p>
                <p className="text-xs text-slate-600 mt-1">Kein Eintrag in MFRNode</p>
              </div>
            );
          }
          return (
            <AudioRow
              key={nodeId}
              nodeId={nodeId}
              nodeName={nodeData.name}
              instructionText={nodeData.instruction}
            />
          );
        })}
      </div>
    </div>
  );
}