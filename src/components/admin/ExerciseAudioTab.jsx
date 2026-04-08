import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, Loader2, Volume2, Copy, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function ExerciseAudioRow({ exercise }) {
  const [cached, setCached] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const textToCache = exercise.description || '';

  const handleCopy = () => {
    if (!textToCache) return;
    navigator.clipboard.writeText(textToCache);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const checkCache = async () => {
      if (!textToCache) {
        setCached(false);
        return;
      }
      const hash = await hashText(textToCache);
      const results = await base44.entities.TTSCache.filter({ text_hash: hash });
      setCached(results.length > 0 ? results[0].file_uri : false);
    };
    checkCache();
  }, [textToCache]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const hash = await hashText(textToCache);
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
        text_preview: textToCache.substring(0, 100)
      });
      setCached(file_uri);
      toast.success(`Audio für ${exercise.exercise_id} gespeichert`);
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{exercise.exercise_id}</p>
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{textToCache || '—'}</p>
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
          disabled={uploading || !textToCache}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-40"
          title="Audio hochladen (.wav / .mp3)"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleCopy}
          disabled={!textToCache}
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

export default function ExerciseAudioTab() {
  const [search, setSearch] = useState('');
  const [prefixFilter, setPrefixFilter] = useState('all');

  const PREFIXES = {
    KB: { label: 'KB', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    BW: { label: 'BW', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    RB: { label: 'RB', color: 'bg-green-500/20 text-green-300 border-green-500/40' },
    SL: { label: 'SL', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
    MB: { label: 'MB', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    NR: { label: 'NR', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    BR: { label: 'BR', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
    MFR: { label: 'MFR', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  };

  function getPrefix(id) {
    if (!id) return null;
    for (const key of Object.keys(PREFIXES)) {
      if (id.startsWith(key + '_') || id === key) return key;
    }
    return null;
  }

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-audio'],
    queryFn: () => base44.entities.Exercise.list('-updated_date', 500),
  });

  const prefixCounts = exercises.reduce((acc, ex) => {
    const p = getPrefix(ex.exercise_id) || 'legacy';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  let filtered = exercises.filter(ex => {
    const prefix = getPrefix(ex.exercise_id);
    const prefixMatch = prefixFilter === 'all' || prefix === prefixFilter || (prefixFilter === 'legacy' && !prefix);
    const searchMatch = !search || 
      ex.name?.toLowerCase().includes(search.toLowerCase()) ||
      ex.exercise_id?.toLowerCase().includes(search.toLowerCase());
    return prefixMatch && searchMatch;
  });

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
        <h2 className="text-xl font-bold text-cyan-400 mb-1">🎙️ Exercise Audio Manager</h2>
        <p className="text-sm text-slate-400 mb-1">
          {exercises.length} Übungen · Verwalte Audios für Exercise.description
        </p>
        <p className="text-xs text-slate-500">
          Grüner Punkt = Audio vorhanden. Upload-Button, Wiedergabe, Copy-Button.
        </p>
      </div>

      {/* Prefix Filter */}
      <div className="glass rounded-2xl border border-slate-700/50 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setPrefixFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              prefixFilter === 'all'
                ? 'bg-slate-300/20 text-white border-slate-400'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            Alle ({exercises.length})
          </button>
          {Object.entries(PREFIXES).map(([key, def]) => (
            <button
              key={key}
              onClick={() => setPrefixFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                prefixFilter === key
                  ? def.color + ' border-current'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {key} ({prefixCounts[key] || 0})
            </button>
          ))}
          {prefixCounts['legacy'] > 0 && (
            <button
              onClick={() => setPrefixFilter('legacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                prefixFilter === 'legacy'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              Legacy ({prefixCounts['legacy']})
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Name oder ID suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500"
        />
      </div>

      {/* Audio List */}
      <div className="glass rounded-2xl border border-slate-700/50 p-4">
        {filtered.length === 0 ? (
          <p className="text-slate-400 py-8 text-center">Keine Übungen gefunden</p>
        ) : (
          filtered.map(ex => (
            <ExerciseAudioRow key={ex.id} exercise={ex} />
          ))
        )}
      </div>
    </div>
  );
}