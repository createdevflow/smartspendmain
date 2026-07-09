'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';

export default function BlogTagsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
    if (!token) { router.push('/login'); return; }
    setAuthChecked(true);
  }, [router]);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/blog/tags');
      setTags(res.data?.data || res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authChecked) fetchTags(); }, [authChecked, fetchTags]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/blog/tags', { name: newName });
      setNewName(''); fetchTags();
    } catch (e: any) { alert(e?.response?.data?.message || 'Create tag failed'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"?`)) return;
    try { await api.delete(`/blog/tags/${id}`); fetchTags(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Delete tag failed'); }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    try { await api.patch(`/blog/tags/${id}`, { name: editName }); setEditId(null); fetchTags(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Update tag failed'); }
  };

  if (!authChecked) return null;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Link href="/blog">
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                <ArrowLeft size={16} /> Back to Blog
              </button>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 10, backgroundColor: 'var(--accent-light)', display: 'flex' }}>
                <Tag size={18} color="var(--accent-primary)" />
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Blog Tags</h1>
            </div>
          </div>

          {/* Create Tag */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.875rem' }}>New Tag</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                className="input-field"
                placeholder="Tag name (e.g. Investing, Market Trends)..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button onClick={handleCreate} disabled={!newName.trim()} className="btn btn-primary" style={{ gap: '0.5rem', flexShrink: 0 }}>
                <Plus size={14} /> Add Tag
              </button>
            </div>
          </div>

          {/* Tags List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
            ) : tags.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Tag size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p style={{ color: 'var(--text-secondary)' }}>No tags created yet</p>
              </div>
            ) : (
              <div>
                {tags.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: i < tags.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', padding: '0.2rem 0.5rem', borderRadius: 4, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>#</span>
                      {editId === t.id ? (
                        <input
                          className="input-field"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleEdit(t.id); if (e.key === 'Escape') setEditId(null); }}
                          style={{ marginBottom: 0, fontSize: '0.875rem', padding: '0.375rem 0.625rem' }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>{t.name}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-gray">{t._count?.blogs || 0} posts</span>
                      {editId === t.id ? (
                        <>
                          <button onClick={() => handleEdit(t.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>Save</button>
                          <button onClick={() => setEditId(null)} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(t.id); setEditName(t.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '0.25rem' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(t.id, t.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
