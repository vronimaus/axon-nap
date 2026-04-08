import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, Loader2, Volume2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const NODE_IDS = ['N1','N2','N3','N4','N5','N6','N7','N8','N9','N10','N11','N12', 'CP-A', 'CP-P', 'CL-A', 'CL-P', 'TH-A', 'TH-P', 'LU-A', 'LU-P', 'PV-A', 'PV-P', 'SC-A', 'SC-P', 'HU-A', 'CU-A', 'CX-A', 'CX-P', 'GE-A', 'GE-P', 'TA-A', 'TA-P', 'PE-A'];

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

// For each node we pre-generate 2 audio tracks:
// 1. neuro_drill  → software_update.ausführung
// 2. integration  → integration.wiederholungen + tweak_1 + tweak_2
function buildAudioTexts(chain) {
  const sw = chain.software_update ?? {};
  const intg = chain.integration ?? {};

  const neuroDrillText = [
    sw['übung'] || sw.übung || '',
    sw['ausführung'] || sw.ausführung || '',
    sw['warum'] || sw.warum || ''
  ].filter(Boolean).join('. ');

  const integrationText = [
    intg['primär_bewegung'] || intg.primär_bewegung || '',
    intg['wiederholungen'] || intg.wiederholungen || '',
    intg['tweak_1'] || intg.tweak_1 || '',
    intg['tweak_2'] || intg.tweak_2 || ''
  ].filter(Boolean).join('. ');

  return { neuroDrillText, integrationText };
}

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function AudioRow({ label, text, nodeId, trackKey }) {
  const [cached, setCached] = useState(null); // null=loading, false=missing, string=uri
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);
  const inputRef = useRef(null);

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const checkCache = async () => {
      if (!text.trim()) { setCached(false); return; }
      const hash = await hashText(text.trim());
      const results = await base44.entities.TTSCache.filter({ text_hash: hash });
      setCached(results.length > 0 ? results[0].file_uri : false);
    };
    checkCache();
  }, [text]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const hash = await hashText(text.trim());
      // Check if already cached — delete old entry first
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
        text_preview: text.trim().substring(0, 100)
      });
      setCached(file_uri);
      toast.success(`Audio für ${nodeId} ${label} gespeichert`);
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
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0">
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

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
        <p className="text-xs text-slate-300 leading-relaxed">{text || '—'}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {cached && (
          <button
            onClick={handlePlay}
            className={`p-2 rounded-lg transition-all ${playing ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 hover:text-cyan-400'}`}
            title="Abspielen"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !text.trim()}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-40"
          title="Audio hochladen (.wav / .mp3)"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleCopy}
          disabled={!text.trim()}
          className={`p-2 rounded-lg transition-all disabled:opacity-40 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
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

export default function TuneUpAudioTab() {
  const [chains, setChains] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await base44.entities.TuneUpCausalChain.list();
        const map = {};
        for (const r of results) {
          const nodeId = r.node_id || r.data?.node_id;
          const data = r.data ?? r;
          if (nodeId) map[nodeId] = data;
        }
        setChains(map);
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
      <div className="glass rounded-2xl border border-purple-500/30 p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl border border-purple-500/30 p-6">
        <h2 className="text-xl font-bold text-purple-400 mb-1">🎙️ TuneUp Audio Manager (Stecco)</h2>
        <p className="text-sm text-slate-400 mb-1">
          Alle Texte für CP, CL, TH, LU, PV, SC, HU, CU, CX, GE, TA, PE (Neuro-Drill + Integration). Grüner Punkt = Audio vorhanden.
        </p>
        <p className="text-xs text-slate-500">
          A = Anterior, P = Posterior. Aufnahme extern erstellen, dann per Upload-Button direkt dem Text zuordnen. Unterstützte Formate: WAV, MP3.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NODE_IDS.map(nodeId => {
          const chain = chains[nodeId];
          if (!chain) {
            const baseNodeId = STECCO_MAPPING[nodeId];
            const status = baseNodeId ? `basiert auf ${baseNodeId}` : 'NEU — keine Basis';
            return (
               <div key={nodeId} className="glass rounded-2xl border border-slate-700/40 p-4 opacity-50">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{nodeId}</p>
                 <p className="text-xs text-slate-600 mt-1">Kein Eintrag in TuneUpCausalChain</p>
                 <p className={`text-xs mt-1 font-semibold ${baseNodeId ? 'text-cyan-400' : 'text-yellow-400'}`}>
                   {status}
                 </p>
               </div>
             );
            }
          const { neuroDrillText, integrationText } = buildAudioTexts(chain);
          const nodeName = chain.node_name_de || chain['node_name_de'] || nodeId;

          return (
            <div key={nodeId} className="glass rounded-2xl border border-slate-700/50 p-4">
              <div className="mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{nodeId}</span>
                <h3 className="text-sm font-bold text-white">{nodeName}</h3>
              </div>
              <AudioRow
                label="Neuro-Drill Anleitung"
                text={neuroDrillText}
                nodeId={nodeId}
                trackKey="neuro"
              />
              <AudioRow
                label="Integration Ausführung"
                text={integrationText}
                nodeId={nodeId}
                trackKey="integration"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}