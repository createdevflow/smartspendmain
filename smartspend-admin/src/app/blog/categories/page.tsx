'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Trash2, Edit2, RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';

export default function BlogCategoriesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#2563EB');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
    if (!token) { router.push('/login'); return; }
    setAuthChecked(true);
  }, [router]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/blog/categories');
      setCategories(res.data?.data || res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authChecked) fetchCategories(); }, [authChecked, fetchCategories]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/blog/categories', { name: newName, color: newColor });
      setNewName(''); setNewColor('#2563EB'); fetchCategories();
    } catch (e: any) { alert(e?.response?.data?.message || 'Create failed'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try { await api.delete(`/blog/categories/${id}`); fetchCategories(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Delete failed'); }
  };

  const handleEdit = async (id: string) => {
    try { await api.patch(`/blog/categories/${id}`, { name: editName }); setEditId(null); fetchCategories(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Update failed'); }
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
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Blog Categories</h1>
            </div>
          </div>

          {/* Create Category */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.875rem' }}>New Category</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                className="input-field"
                placeholder="Category name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color</label>
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
              </div>
              <button onClick={handleCreate} disabled={!newName.trim()} className="btn btn-primary" style={{ gap: '0.5rem', flexShrink: 0 }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
            ) : categories.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Tag size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p style={{ color: 'var(--text-secondary)' }}>No categories yet</p>
              </div>
            ) : (
              <div>
                {categories.map((cat, i) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: i < categories.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cat.color || '#2563EB' }} />
                      {editId === cat.id ? (
                        <input
                          className="input-field"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditId(null); }}
                          style={{ marginBottom: 0, fontSize: '0.875rem', padding: '0.375rem 0.625rem' }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-gray">{cat._count?.blogs || 0} posts</span>
                      {editId === cat.id ? (
                        <>
                          <button onClick={() => handleEdit(cat.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>Save</button>
                          <button onClick={() => setEditId(null)} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '0.25rem' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(cat.id, cat.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}>
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
