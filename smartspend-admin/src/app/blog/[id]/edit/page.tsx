'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Globe, Clock, Loader2, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import RichEditor, { EditorBlock } from '@/components/blog/RichEditor';
import { SeoPanel } from '@/components/blog/SeoPanel';

function toSlug(t: string) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [coverImageMeta, setCoverImageMeta] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#2563EB');
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', status: 'DRAFT', featured: false,
    coverImage: '', categoryId: '', tagIds: [] as string[],
    scheduledAt: '', seoTitle: '', seoDescription: '', focusKeywords: '',
    canonicalUrl: '', metaRobots: 'index,follow', ogImage: '',
  });
  const [content, setContent] = useState<EditorBlock[]>([]);

  const createInlineCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await api.post('/blog/categories', { name: newCatName, color: newCatColor });
      const created = res.data?.data || res.data;
      const catRes = await api.get('/blog/categories');
      const allCats = catRes.data?.data || catRes.data || [];
      setCategories(allCats);
      if (created?.id) updateForm('categoryId', created.id);
      setNewCatName('');
      setShowNewCat(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create category');
    }
  };

  const createInlineTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const names = newTagName.split(',').map(n => n.trim()).filter(Boolean);
      const newTagIds: string[] = [];
      for (const name of names) {
        const existing = tags.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          if (!form.tagIds.includes(existing.id) && !newTagIds.includes(existing.id)) {
            newTagIds.push(existing.id);
          }
        } else {
          const res = await api.post('/blog/tags', { name });
          const created = res.data?.data || res.data;
          if (created?.id && !form.tagIds.includes(created.id) && !newTagIds.includes(created.id)) {
            newTagIds.push(created.id);
          }
        }
      }
      const tagRes = await api.get('/blog/tags');
      const allTags = tagRes.data?.data || tagRes.data || [];
      setTags(allTags);
      if (newTagIds.length > 0) {
        updateForm('tagIds', [...form.tagIds, ...newTagIds]);
      }
      setNewTagName('');
      setShowNewTag(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create tag(s)');
    }
  };

  useEffect(() => {
    const token = (localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
    if (!token) { router.push('/login'); return; }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const load = async () => {
      try {
        const [postRes, catRes, tagRes] = await Promise.all([
          api.get(`/blog/${id}`),
          api.get('/blog/categories'),
          api.get('/blog/tags'),
        ]);
        const post = postRes.data?.data || postRes.data;
        setForm({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          status: post.status || 'DRAFT',
          featured: post.featured || false,
          coverImage: post.coverImage || '',
          categoryId: post.categoryId || '',
          tagIds: (post.tags || []).map((t: any) => t.id),
          scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
          seoTitle: post.seoTitle || '',
          seoDescription: post.seoDescription || '',
          focusKeywords: post.focusKeywords || '',
          canonicalUrl: post.canonicalUrl || '',
          metaRobots: post.metaRobots || 'index,follow',
          ogImage: post.ogImage || '',
        });
        setContent(Array.isArray(post.content) ? post.content : [{ id: 'init', type: 'paragraph', text: '' }]);
        setCategories(catRes.data?.data || catRes.data || []);
        setTags(tagRes.data?.data || tagRes.data || []);
      } catch (err) {
        console.error(err);
        alert('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authChecked, id]);

  const updateForm = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async (status = form.status) => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    setSaving(true);
    try {
      await api.patch(`/blog/${id}`, { ...form, status, content });
      router.push('/blog');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) return null;
  if (loading) return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
        </div>
      </main>
    </>
  );

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/blog">
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                  <ArrowLeft size={16} /> Back
                </button>
              </Link>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Edit Post</h1>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleSave('DRAFT')} disabled={saving} className="btn" style={{ gap: '0.5rem' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {form.status === 'DRAFT' ? 'Update Draft' : 'Save Draft'}
              </button>
              {form.status === 'SCHEDULED' ? (
                <button onClick={() => handleSave('SCHEDULED')} disabled={saving} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                  <Clock size={14} /> Update Schedule
                </button>
              ) : (
                <button onClick={() => handleSave('PUBLISHED')} disabled={saving} className="btn btn-primary" style={{ gap: '0.5rem' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} Update
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div>
              <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Post Title..."
                  value={form.title}
                  onChange={e => updateForm('title', e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'none', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit', marginBottom: '0.75rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Slug:</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => updateForm('slug', e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: '0.8125rem', color: 'var(--accent-primary)', fontFamily: 'monospace' }}
                  />
                </div>
                <textarea
                  placeholder="Short excerpt..."
                  value={form.excerpt}
                  onChange={e => updateForm('excerpt', e.target.value)}
                  style={{ width: '100%', marginTop: '0.75rem', border: 'none', outline: 'none', background: 'none', resize: 'none', fontSize: '1rem', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
                  rows={2}
                />
              </div>

              <RichEditor value={content} onChange={setContent} />
              <SeoPanel
                data={{ seoTitle: form.seoTitle, seoDescription: form.seoDescription, focusKeywords: form.focusKeywords, canonicalUrl: form.canonicalUrl, metaRobots: form.metaRobots, ogImage: form.ogImage }}
                onChange={d => setForm(prev => ({ ...prev, ...d }))}
              />
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Status</label>
                <select className="input-field" value={form.status} onChange={e => updateForm('status', e.target.value)} style={{ marginBottom: 0 }}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                {form.status === 'SCHEDULED' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Publish Date & Time</label>
                    <input type="datetime-local" className="input-field" value={form.scheduledAt} onChange={e => updateForm('scheduledAt', e.target.value)} style={{ marginBottom: 0 }} />
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => updateForm('featured', e.target.checked)} />
                  <Star size={14} color="#f59e0b" /> Featured Post
                </label>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cover Image</label>
                  <label style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}>
                    + Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const sizeKB = (file.size / 1024).toFixed(0);
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = reader.result as string;
                          updateForm('coverImage', result);
                          const img = new Image();
                          img.onload = () => {
                            setCoverImageMeta(`${img.width}×${img.height} px | ${sizeKB} KB`);
                          };
                          img.src = result;
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Upload file or paste URL..."
                  value={form.coverImage}
                  onChange={e => updateForm('coverImage', e.target.value)}
                  style={{ marginBottom: form.coverImage ? '0.5rem' : 0 }}
                />
                {form.coverImage && (
                  <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={form.coverImage} alt="Cover" style={{ width: '100%', borderRadius: 6, objectFit: 'cover', height: 120 }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', padding: '4px 8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{coverImageMeta || 'Image Loaded'}</span>
                      <button type="button" onClick={() => { updateForm('coverImage', ''); setCoverImageMeta(''); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.7rem' }}>Remove</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
                  <button type="button" onClick={() => setShowNewCat(!showNewCat)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                    {showNewCat ? 'Cancel' : '+ Create Category'}
                  </button>
                </div>
                {showNewCat ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input type="text" className="input-field" placeholder="Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ marginBottom: 0, flex: 1 }} />
                    <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                    <button type="button" onClick={createInlineCategory} className="btn btn-primary" style={{ padding: '0 0.75rem', fontSize: '0.75rem' }}>Add</button>
                  </div>
                ) : null}
                <select className="input-field" value={form.categoryId} onChange={e => updateForm('categoryId', e.target.value)} style={{ marginBottom: 0 }}>
                  <option value="">None</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tags</label>
                  <button type="button" onClick={() => setShowNewTag(!showNewTag)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                    {showNewTag ? 'Cancel' : '+ Create Tag'}
                  </button>
                </div>
                {showNewTag && (
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-elevated)', borderRadius: 6, marginBottom: '0.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <input className="input-field" placeholder="Tags (comma separated, e.g. Budget, Savings)..." value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createInlineTag(); } }} style={{ flex: 1, marginBottom: 0, fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} />
                      <button type="button" onClick={createInlineTag} disabled={!newTagName.trim()} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Add</button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {tags.map((t: any) => (
                    <button type="button" key={t.id}
                      onClick={() => { const next = form.tagIds.includes(t.id) ? form.tagIds.filter((x: string) => x !== t.id) : [...form.tagIds, t.id]; updateForm('tagIds', next); }}
                      style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid', cursor: 'pointer', backgroundColor: form.tagIds.includes(t.id) ? 'var(--accent-light)' : 'transparent', borderColor: form.tagIds.includes(t.id) ? 'var(--accent-primary)' : 'var(--border)', color: form.tagIds.includes(t.id) ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                      {t.name}
                    </button>
                  ))}
                  {tags.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: 0 }}>No tags yet. Click + Create Tag above.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
