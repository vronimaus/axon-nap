import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronUp, Save, Image, X, Check, Edit2, AlertTriangle, Sparkles, RefreshCw, Trash2 } from 'lucide-react';

const PREFIXES = {
  KB:  { label: 'KB',  color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  BW:  { label: 'BW',  color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  RB:  { label: 'RB',  color: 'bg-green-500/20 text-green-300 border-green-500/40' },
  SL:  { label: 'SL',  color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  MB:  { label: 'MB',  color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  NR:  { label: 'NR',  color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  BR:  { label: 'BR',  color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  MFR: { label: 'MFR', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

function getPrefix(id) {
  if (!id) return null;
  for (const key of Object.keys(PREFIXES)) {
    if (id.startsWith(key + '_') || id === key) return key;
  }
  return null;
}

const EDITABLE_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'exercise_id', label: 'Exercise ID', type: 'text' },
  { key: 'description', label: 'Beschreibung', type: 'textarea' },
  { key: 'axon_moment', label: 'AXON Moment', type: 'textarea' },
  { key: 'purpose_explanation', label: 'Zweck / Purpose', type: 'textarea' },
  { key: 'benefits', label: 'Benefits', type: 'textarea' },
  { key: 'goal_explanation', label: 'Ziel-Erklärung', type: 'textarea' },
  { key: 'breathing_instruction', label: 'Atemführung', type: 'textarea' },
  { key: 'image_url', label: 'Bild URL (image_url)', type: 'text' },
  { key: 'gif_url', label: 'GIF URL (gif_url)', type: 'text' },
  { key: 'difficulty', label: 'Schwierigkeit', type: 'select', options: ['beginner', 'intermediate', 'advanced'] },
  { key: 'category', label: 'Kategorie', type: 'select', options: ['pull','push','squat','hinge','carry','core','mobility','plank','row','dip','neuro','breath','mfr','other'] },
];

function ExerciseRow({ ex }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [gifError, setGifError] = useState(false);

  const isDirty = Object.keys(edits).length > 0;
  const prefix = getPrefix(ex.exercise_id);
  const prefixDef = prefix ? PREFIXES[prefix] : null;

  const val = (key) => edits[key] !== undefined ? edits[key] : (ex[key] || '');

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      await base44.entities.Exercise.update(ex.id, edits);
      queryClient.invalidateQueries({ queryKey: ['exercises-editor'] });
      setEdits({});
      toast.success(`✓ "${ex.name}" gespeichert`);
    } catch (e) {
      toast.error('Fehler: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => setEdits({});

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      await base44.entities.Exercise.delete(ex.id);
      queryClient.invalidateQueries({ queryKey: ['exercises-editor'] });
      toast.success(`🗑 "${ex.name}" gelöscht`);
    } catch (e) {
      toast.error('Löschen fehlgeschlagen: ' + e.message);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const res = await base44.functions.invoke('enrichExerciseFields', { exercise_id: ex.id });
      const { updated, fields, message } = res.data;
      if (message) {
        toast.info(message);
      } else if (fields?.length > 0) {
        // Merge enriched values into edits so user can review before saving
        setEdits(prev => ({ ...prev, ...updated }));
        toast.success(`✨ ${fields.length} Felder von KI befüllt – bitte prüfen & speichern`);
      } else {
        toast.info('Keine neuen Felder befüllt');
      }
    } catch (e) {
      toast.error('Fehler: ' + e.message);
    } finally {
      setEnriching(false);
    }
  };

  // Check how many key fields are empty
  const emptyCount = ['benefits', 'goal_explanation', 'axon_moment', 'purpose_explanation', 'breathing_instruction', 'cues']
    .filter(f => {
      const v = ex[f];
      return !v || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
    }).length;

  const imageUrl = val('image_url');
  const gifUrl = val('gif_url');

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${expanded ? 'border-cyan-500/50 bg-slate-800/60' : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'}`}>
      {/* Row Header - always visible */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0 relative">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={ex.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className={`w-5 h-5 ${imageError ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
          )}
          {imageError && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 text-sm truncate">{ex.name || '—'}</span>
            {prefixDef && (
              <span className={`text-xs px-2 py-0.5 rounded border font-bold ${prefixDef.color}`}>{prefixDef.label}</span>
            )}
            {isDirty && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">● ungespeichert</span>
            )}
          </div>
          <code className="text-xs text-slate-500 font-mono">{ex.exercise_id || 'keine ID'}</code>
        </div>

        {/* Image indicators */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${imageUrl && !imageError ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`} title="image_url">IMG</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${gifUrl && !gifError ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-500'}`} title="gif_url">GIF</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${ex.axon_moment ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-500'}`} title="axon_moment">A</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${ex.description ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`} title="description">D</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${ex.benefits ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`} title="benefits">B</span>
          {emptyCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30" title="Fehlende Felder">
              {emptyCount} leer
            </span>
          )}
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </div>

      {/* Expanded Editor */}
      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-4">
          {/* Image Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Image Preview */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Bild Vorschau (image_url)</p>
              <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt="Exercise"
                    className="w-full h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Image className="w-8 h-8" />
                    <span className="text-xs">{imageError ? '⚠ URL fehlerhaft' : 'Kein Bild'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* GIF Preview */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">GIF Vorschau (gif_url)</p>
              <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {gifUrl && !gifError ? (
                  <img
                    src={gifUrl}
                    alt="Exercise GIF"
                    className="w-full h-full object-contain"
                    onError={() => setGifError(true)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Image className="w-8 h-8" />
                    <span className="text-xs">{gifError ? '⚠ URL fehlerhaft' : 'Kein GIF'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EDITABLE_FIELDS.map(field => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  {field.label}
                  {edits[field.key] !== undefined && (
                    <span className="ml-2 text-amber-400">●</span>
                  )}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={val(field.key)}
                    onChange={(e) => setEdits(prev => ({ ...prev, [field.key]: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-y"
                    placeholder={`${field.label} eingeben...`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={val(field.key)}
                    onChange={(e) => setEdits(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">— wählen —</option>
                    {field.options.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={val(field.key)}
                    onChange={(e) => {
                      setEdits(prev => ({ ...prev, [field.key]: e.target.value }));
                      if (field.key === 'image_url') setImageError(false);
                      if (field.key === 'gif_url') setGifError(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder={`${field.label}...`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* AI Enrich + Save / Discard + Delete */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50 items-center">
            {/* AI Enrich Button - always visible */}
            <Button
              onClick={handleEnrich}
              disabled={enriching}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white gap-2"
            >
              {enriching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {enriching ? 'KI befüllt...' : 'KI Felder befüllen'}
            </Button>

            {isDirty && (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Speichern...' : 'Speichern'}
                </Button>
                <Button
                  onClick={handleDiscard}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-400 gap-2"
                >
                  <X className="w-4 h-4" />
                  Verwerfen
                </Button>
              </>
            )}

            {/* Delete Button - right side */}
            <div className="ml-auto">
              <Button
                onClick={handleDelete}
                disabled={deleting}
                size="sm"
                variant="outline"
                className={`gap-2 transition-all ${confirmDelete ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse' : 'border-slate-600 text-slate-500 hover:border-red-500/50 hover:text-red-400'}`}
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Löschen...' : confirmDelete ? '⚠ Wirklich löschen?' : 'Löschen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExerciseEditorTab() {
  const [search, setSearch] = useState('');
  const [prefixFilter, setPrefixFilter] = useState('all');
  const [imageFilter, setImageFilter] = useState('all'); // all | missing | broken

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-editor'],
    queryFn: () => base44.entities.Exercise.list('-updated_date', 500),
  });

  const sorted = useMemo(() => [...exercises].sort((a, b) => (a.exercise_id || '').localeCompare(b.exercise_id || '')), [exercises]);

  const filtered = useMemo(() => {
    return sorted.filter(ex => {
      const prefix = getPrefix(ex.exercise_id);
      const prefixMatch = prefixFilter === 'all' || prefix === prefixFilter || (prefixFilter === 'none' && !prefix);
      const searchMatch = !search ||
        ex.name?.toLowerCase().includes(search.toLowerCase()) ||
        ex.exercise_id?.toLowerCase().includes(search.toLowerCase());
      const imgMatch =
        imageFilter === 'all' ? true :
        imageFilter === 'missing' ? !ex.image_url :
        true; // broken handled visually
      return prefixMatch && searchMatch && imgMatch;
    });
  }, [sorted, search, prefixFilter, imageFilter]);

  const prefixCounts = useMemo(() => exercises.reduce((acc, ex) => {
    const p = getPrefix(ex.exercise_id) || 'none';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {}), [exercises]);

  const missingImgCount = exercises.filter(ex => !ex.image_url).length;

  if (isLoading) {
    return <div className="glass rounded-2xl border border-cyan-500/30 p-8 text-slate-400">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl border border-cyan-500/30 p-5">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-cyan-400">🖼 Exercise Editor</h2>
          <p className="text-sm text-slate-400 mt-1">
            {exercises.length} Übungen · {missingImgCount} ohne Bild
          </p>
        </div>

        {/* Prefix Filter */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setPrefixFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${prefixFilter === 'all' ? 'bg-slate-300/20 text-white border-slate-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
          >
            Alle ({exercises.length})
          </button>
          {Object.entries(PREFIXES).map(([key, def]) => (
            <button
              key={key}
              onClick={() => setPrefixFilter(key)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${prefixFilter === key ? def.color : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              {key} ({prefixCounts[key] || 0})
            </button>
          ))}
          {prefixCounts['none'] > 0 && (
            <button
              onClick={() => setPrefixFilter('none')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${prefixFilter === 'none' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              Legacy ({prefixCounts['none']})
            </button>
          )}
        </div>

        {/* Search + Image Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Name oder ID suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <select
            value={imageFilter}
            onChange={e => setImageFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
          >
            <option value="all">Alle Bilder</option>
            <option value="missing">Ohne Bild ({missingImgCount})</option>
          </select>
        </div>

        <p className="text-xs text-slate-500 mb-3">{filtered.length} Übungen angezeigt — Klicke auf eine Übung zum Bearbeiten</p>

        {/* Exercise List */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          {filtered.map(ex => (
            <ExerciseRow key={ex.id} ex={ex} />
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-400 text-sm py-8 text-center">Keine Übungen gefunden</p>
          )}
        </div>
      </div>
    </div>
  );
}