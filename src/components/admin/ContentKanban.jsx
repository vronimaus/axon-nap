import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ExternalLink, Edit3, X, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = {
  neuro_happen:  { label: '🔵 Neuro-Happen',       day: 'Mo', color: 'border-blue-500/40 bg-blue-500/5',   badge: 'bg-blue-500/20 text-blue-300' },
  deep_dive:     { label: '🟣 Science Deep Dive',   day: 'Di', color: 'border-purple-500/40 bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-300' },
  mythos:        { label: '🟡 Mythos vs. Realität', day: 'Mi', color: 'border-yellow-500/40 bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-300' },
  praxis:        { label: '🟠 AXON Praxis',         day: 'Do', color: 'border-orange-500/40 bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-300' },
  weekend:       { label: '🟢 Weekend-Toolkit',     day: 'Fr', color: 'border-emerald-500/40 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300' },
};

const STATUSES = [
  { id: 'idee',           label: '💡 Idee',          color: 'border-slate-600' },
  { id: 'entwurf',        label: '✏️ Entwurf',        color: 'border-blue-500/50' },
  { id: 'review',         label: '👁 Review',         color: 'border-yellow-500/50' },
  { id: 'bereit',         label: '✅ Bereit',         color: 'border-green-500/50' },
  { id: 'veroeffentlicht',label: '🚀 Veröffentlicht', color: 'border-cyan-500/50' },
];

function PostCard({ post, onEdit, onDelete, onStatusChange }) {
  const cat = CATEGORIES[post.category] || CATEGORIES.neuro_happen;
  const hasCarousel = post.carousel_slides?.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl border p-3 space-y-2 cursor-pointer hover:brightness-110 transition-all ${cat.color}`}
      onClick={() => onEdit(post)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white leading-snug flex-1">{post.title}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
          className="p-1 text-slate-600 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.day}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label.split(' ').slice(1).join(' ')}</span>
        {hasCarousel && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">🎠 {post.carousel_slides.length} Folien</span>}
      </div>

      {post.planned_date && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Calendar className="w-3 h-3" />
          {new Date(post.planned_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
        </div>
      )}

      {post.post_text && (
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{post.post_text}</p>
      )}

      {post.published_url && (
        <a
          href={post.published_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
        >
          <ExternalLink className="w-3 h-3" /> LinkedIn
        </a>
      )}
    </motion.div>
  );
}

function PostModal({ post, onClose, onSave }) {
  const [form, setForm] = useState(post || {
    title: '', category: 'neuro_happen', status: 'idee',
    post_text: '', planned_date: '', hashtags: '', notes: '', published_url: ''
  });

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">{post?.id ? 'Post bearbeiten' : 'Neuer Post'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block uppercase tracking-widest">Titel (intern)</label>
            <input value={form.title} onChange={e => update('title', e.target.value)}
              placeholder="z.B. Sakkaden für mehr Fokus – KW12"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block uppercase tracking-widest">Kategorie</label>
              <select value={form.category} onChange={e => update('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm">
                {Object.entries(CATEGORIES).map(([id, cat]) => (
                  <option key={id} value={id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block uppercase tracking-widest">Status</label>
              <select value={form.status} onChange={e => update('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm">
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block uppercase tracking-widest">Geplantes Datum</label>
            <input type="date" value={form.planned_date || ''} onChange={e => update('planned_date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block uppercase tracking-widest">Post-Text</label>
            <textarea value={form.post_text || ''} onChange={e => update('post_text', e.target.value)}
              rows={6} placeholder="LinkedIn-Text hier einfügen oder generieren..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm resize-none leading-relaxed focus:outline-none focus:border-cyan-500/50" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block uppercase tracking-widest">Hashtags</label>
            <input value={form.hashtags || ''} onChange={e => update('hashtags', e.target.value)}
              placeholder="#NeuroAthletics, #Faszien, #Bewegung"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block uppercase tracking-widest">LinkedIn URL (nach Veröffentlichung)</label>
            <input value={form.published_url || ''} onChange={e => update('published_url', e.target.value)}
              placeholder="https://linkedin.com/posts/..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block uppercase tracking-widest">Interne Notizen</label>
            <textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)}
              rows={2} placeholder="Ideen, Feedback, Quellen..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm resize-none focus:outline-none focus:border-cyan-500/50" />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Abbrechen</Button>
          <Button onClick={() => onSave(form)} className="bg-cyan-600 hover:bg-cyan-700 gap-2">
            <Check className="w-4 h-4" /> Speichern
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ContentKanban() {
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['contentPosts'],
    queryFn: () => base44.entities.ContentPost.list('-created_date', 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.ContentPost.update(data.id, data)
      : base44.entities.ContentPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentPosts'] });
      setShowModal(false);
      setEditingPost(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentPosts'] }),
  });

  const handleEdit = (post) => { setEditingPost(post); setShowModal(true); };
  const handleNew = () => { setEditingPost(null); setShowModal(true); };
  const handleDelete = (id) => { if (window.confirm('Post löschen?')) deleteMutation.mutate(id); };
  const handleSave = (data) => saveMutation.mutate(data);

  const totalByStatus = STATUSES.reduce((acc, s) => {
    acc[s.id] = posts.filter(p => p.status === s.id).length;
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">📋 Content Kanban</h2>
          <p className="text-xs text-slate-500 mt-0.5">{posts.length} Posts · 5-Tage LinkedIn-Strategie</p>
        </div>
        <Button onClick={handleNew} size="sm" className="bg-cyan-600 hover:bg-cyan-700 gap-2">
          <Plus className="w-4 h-4" /> Neuer Post
        </Button>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORIES).map(([id, cat]) => (
          <span key={id} className={`text-[10px] font-bold px-2 py-1 rounded-full ${cat.badge}`}>
            {cat.day}: {cat.label.split(' ').slice(1).join(' ')}
          </span>
        ))}
      </div>

      {/* Kanban Columns */}
      {isLoading ? (
        <div className="text-slate-400 text-sm">Laden...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {STATUSES.map(status => {
            const columnPosts = posts.filter(p => p.status === status.id);
            return (
              <div key={status.id} className={`rounded-xl border bg-slate-900/50 ${status.color} min-h-[200px]`}>
                {/* Column Header */}
                <div className="px-3 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{status.label}</span>
                  <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                    {totalByStatus[status.id] || 0}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2">
                  <AnimatePresence>
                    {columnPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={(newStatus) => saveMutation.mutate({ ...post, status: newStatus })}
                      />
                    ))}
                  </AnimatePresence>

                  {columnPosts.length === 0 && (
                    <p className="text-[11px] text-slate-600 text-center py-4 italic">Leer</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PostModal
          post={editingPost}
          onClose={() => { setShowModal(false); setEditingPost(null); }}
          onSave={handleSave}
        />
      )}
    </motion.div>
  );
}