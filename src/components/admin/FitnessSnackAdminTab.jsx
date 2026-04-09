import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_OPTIONS = ['hiit', 'zone2', 'sprint', 'cold_exposure', 'heat', 'breathwork', 'strength_snack', 'mobility_snack'];
const HORMESIS_OPTIONS = ['thermal', 'hypoxic', 'mechanical', 'metabolic', 'oxidative'];
const INTENSITY_OPTIONS = ['low', 'medium', 'high'];
const READINESS_GATE_OPTIONS = ['any', 'green', 'yellow', 'red'];
const STEP_TYPES = ['exercise', 'rest', 'mfr_cooldown', 'breath_cooldown'];
const EQUIPMENT_OPTIONS = [
  { value: 'none',            label: '🚫 Kein Equipment (Bodyweight)' },
  { value: 'mat',             label: '🧘 Matte' },
  { value: 'kettlebell',      label: '🔔 Kettlebell' },
  { value: 'resistance_band', label: '🟡 Widerstandsband' },
  { value: 'pull_up_bar',     label: '🔝 Klimmzugstange' },
  { value: 'dumbbells',       label: '💪 Kurzhanteln' },
  { value: 'barbell',         label: '🏋️ Langhantel' },
  { value: 'foam_roller',     label: '🔵 Foam Roller' },
  { value: 'lacrosse_ball',   label: '⚫ Lacrosse Ball' },
  { value: 'box',             label: '📦 Box / Plyo Box' },
];
const COLOR_OPTIONS = ['orange', 'cyan', 'red', 'emerald', 'purple', 'blue', 'yellow', 'teal'];

const EMPTY_SNACK = {
  name: '',
  subtitle: '',
  description: '',
  duration_minutes: 5,
  type: 'hiit',
  hormesis_type: 'metabolic',
  intensity: 'high',
  readiness_gate: 'green',
  required_equipment: 'none',
  longevity_benefit: '',
  rhonda_patrick_principle: '',
  icon: '🔥',
  color_class: 'orange',
  suitable_for_age_min: 16,
  suitable_for_age_max: 99,
  suitable_for_gender: 'all',
  is_active: true,
  sequence: [],
};

const EMPTY_STEP = {
  title: '',
  instruction: '',
  duration_seconds: 60,
  type: 'exercise',
  sets: '',
  reps: '',
  cue: '',
};

function SequenceEditor({ sequence = [], onChange }) {
  const addStep = () => onChange([...sequence, { ...EMPTY_STEP }]);
  const removeStep = (i) => onChange(sequence.filter((_, idx) => idx !== i));
  const updateStep = (i, field, val) => {
    const updated = [...sequence];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };

  const STEP_TYPE_COLORS = {
    exercise: 'border-orange-500/40 bg-orange-500/5',
    rest: 'border-slate-600 bg-slate-800/30',
    mfr_cooldown: 'border-cyan-500/40 bg-cyan-500/5',
    breath_cooldown: 'border-purple-500/40 bg-purple-500/5',
  };

  return (
    <div className="space-y-3">
      {sequence.map((step, i) => (
        <div key={i} className={`rounded-xl border p-4 space-y-3 ${STEP_TYPE_COLORS[step.type] || 'border-slate-700'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Schritt {i + 1}</span>
            <select value={step.type} onChange={e => updateStep(i, 'type', e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none">
              {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => removeStep(i)} className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)}
              placeholder="Titel (z.B. Kettlebell Swings)"
              className="col-span-2 text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50" />
            <textarea value={step.instruction} onChange={e => updateStep(i, 'instruction', e.target.value)}
              placeholder="Anleitung..."
              rows={2}
              className="col-span-2 text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 resize-none" />
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest">Dauer (Sek)</label>
              <input type="number" value={step.duration_seconds} onChange={e => updateStep(i, 'duration_seconds', parseInt(e.target.value))}
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest">Cue</label>
              <input value={step.cue || ''} onChange={e => updateStep(i, 'cue', e.target.value)}
                placeholder="Coach-Cue..."
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest">Sätze</label>
              <input value={step.sets || ''} onChange={e => updateStep(i, 'sets', e.target.value)}
                placeholder="z.B. 4"
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest">Reps</label>
              <input value={step.reps || ''} onChange={e => updateStep(i, 'reps', e.target.value)}
                placeholder="z.B. 10 oder max"
                className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50" />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addStep}
        className="w-full h-10 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:border-orange-500/50 hover:text-orange-400 transition-all text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Schritt hinzufügen
      </button>
    </div>
  );
}

function SnackForm({ initial, onSave, onCancel, saving }) {
  const [data, setData] = useState(initial);
  const set = (field, val) => setData(d => ({ ...d, [field]: val }));

  return (
    <div className="space-y-5">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Name *</label>
          <input value={data.name} onChange={e => set('name', e.target.value)}
            placeholder="z.B. 4×4 HIIT – Longevity Spike"
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500/50" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Subtitle</label>
          <input value={data.subtitle || ''} onChange={e => set('subtitle', e.target.value)}
            placeholder="Kurzer motivierender Untertitel"
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500/50" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Typ *</label>
          <select value={data.type} onChange={e => set('type', e.target.value)}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none">
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Hormesis *</label>
          <select value={data.hormesis_type} onChange={e => set('hormesis_type', e.target.value)}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none">
            {HORMESIS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Intensität</label>
          <select value={data.intensity} onChange={e => set('intensity', e.target.value)}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none">
            {INTENSITY_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Readiness Gate *</label>
          <select value={data.readiness_gate} onChange={e => set('readiness_gate', e.target.value)}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none">
            {READINESS_GATE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Dauer (Min) *</label>
          <input type="number" min="1" max="10" value={data.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value))}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Icon</label>
          <input value={data.icon || ''} onChange={e => set('icon', e.target.value)}
            placeholder="🔥"
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Farbe</label>
          <select value={data.color_class || 'orange'} onChange={e => set('color_class', e.target.value)}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none">
            {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Longevity Benefit</label>
          <input value={data.longevity_benefit || ''} onChange={e => set('longevity_benefit', e.target.value)}
            placeholder="z.B. VO2max ↑ · BDNF ↑ · Mitochondrien-Dichte ↑"
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500/50" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Dr. Rhonda Patrick – Wissenschaft</label>
          <textarea value={data.rhonda_patrick_principle || ''} onChange={e => set('rhonda_patrick_principle', e.target.value)}
            placeholder="Wissenschaftliche Begründung..."
            rows={2}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none resize-none" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">Equipment</label>
          <select value={data.required_equipment || 'none'} onChange={e => set('required_equipment', e.target.value)}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none">
            {EQUIPMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <input type="checkbox" id="is_active"
            checked={data.is_active !== false} onChange={e => set('is_active', e.target.checked)}
            className="w-4 h-4 rounded" />
          <label htmlFor="is_active" className="text-sm text-slate-300">Aktiv (in Snack-Auswahl sichtbar)</label>
        </div>
      </div>

      {/* Sequence Editor */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
          Ablauf-Sequenz
          <span className="ml-2 text-slate-600 normal-case font-normal">· exercise = powert | mfr_cooldown / breath_cooldown = nur am Ende</span>
        </p>
        <SequenceEditor sequence={data.sequence || []} onChange={seq => set('sequence', seq)} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={() => onSave(data)} disabled={saving || !data.name}
          className={`flex-1 h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
            data.name ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
        <button onClick={onCancel} className="px-5 h-11 rounded-xl font-medium text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export default function FitnessSnackAdminTab() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data: snacks = [], isLoading } = useQuery({
    queryKey: ['adminSnacks'],
    queryFn: () => base44.entities.FitnessSnack.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FitnessSnack.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSnacks'] }); setCreating(false); toast.success('Snack erstellt!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FitnessSnack.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSnacks'] }); setEditingId(null); toast.success('Snack gespeichert!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FitnessSnack.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSnacks'] }); toast.success('Snack gelöscht'); },
  });

  const GATE_COLORS = { green: 'text-emerald-400 bg-emerald-500/10', yellow: 'text-yellow-400 bg-yellow-500/10', red: 'text-red-400 bg-red-500/10', any: 'text-slate-400 bg-slate-700/50' };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl border border-orange-500/30 p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-orange-400">⚡ Fitness Snacks</h2>
          <p className="text-sm text-slate-400 mt-0.5">{snacks.length} Snacks · Readiness-Gate steuert Freischaltung</p>
        </div>
        <button onClick={() => { setCreating(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all">
          <Plus className="w-4 h-4" /> Neuer Snack
        </button>
      </div>

      {/* Create Form */}
      {creating && (
        <div className="glass rounded-2xl border border-orange-500/30 p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-4">Neuer Snack</p>
          <SnackForm
            initial={{ ...EMPTY_SNACK }}
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setCreating(false)}
            saving={createMutation.isPending}
          />
        </div>
      )}

      {/* Snack List */}
      {isLoading ? (
        <div className="glass rounded-2xl border border-slate-700/50 p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : snacks.length === 0 ? (
        <div className="glass rounded-2xl border border-slate-700/50 p-8 text-center text-slate-400">
          Noch keine Snacks. Lege den ersten an!
        </div>
      ) : (
        <div className="space-y-2">
          {snacks.map(snack => (
            <div key={snack.id} className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <span className="text-2xl">{snack.icon || '⚡'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-white text-sm">{snack.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${GATE_COLORS[snack.readiness_gate] || GATE_COLORS.any}`}>
                      {snack.readiness_gate || 'any'}
                    </span>
                    {!snack.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-500">inaktiv</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{snack.type} · {snack.duration_minutes} Min · {snack.sequence?.length || 0} Schritte</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setExpandedId(expandedId === snack.id ? null : snack.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-300 transition-all">
                    {expandedId === snack.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { deleteMutation.mutate(snack.id); }}
                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === snack.id && (
                <div className="border-t border-slate-700/50 p-5">
                  {editingId === snack.id ? (
                    <SnackForm
                      initial={snack}
                      onSave={(data) => updateMutation.mutate({ id: snack.id, data })}
                      onCancel={() => setEditingId(null)}
                      saving={updateMutation.isPending}
                    />
                  ) : (
                    <div className="space-y-3">
                      {snack.subtitle && <p className="text-sm text-slate-300 italic">{snack.subtitle}</p>}
                      {snack.longevity_benefit && <p className="text-xs text-emerald-400">📈 {snack.longevity_benefit}</p>}
                      {snack.sequence?.length > 0 && (
                        <div className="space-y-1.5">
                          {snack.sequence.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                s.type === 'exercise' ? 'bg-orange-500/20 text-orange-300' :
                                s.type === 'mfr_cooldown' ? 'bg-cyan-500/15 text-cyan-400' :
                                s.type === 'breath_cooldown' ? 'bg-purple-500/15 text-purple-400' :
                                'bg-slate-700 text-slate-400'
                              }`}>{s.type}</span>
                              <span className="text-slate-300 font-medium">{s.title}</span>
                              <span className="text-slate-500">{s.duration_seconds}s</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => setEditingId(snack.id)}
                        className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all">
                        ✏️ Bearbeiten
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}