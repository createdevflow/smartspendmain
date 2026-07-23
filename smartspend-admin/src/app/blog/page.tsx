'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PenSquare, Search, Plus, Trash2, Edit2, Eye, Star, StarOff,
  Filter, RefreshCw, Calendar, Clock, Tag, ChevronRight, Globe, Archive
} from 'lucide-react';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';

const STATUS_TABS = [
  { id: '', label: 'All Posts' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'ARCHIVED', label: 'Archived' },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: 'Published', cls: 'badge-success' },
  DRAFT: { label: 'Draft', cls: 'badge-gray' },
  SCHEDULED: { label: 'Scheduled', cls: 'badge-info' },
  ARCHIVED: { label: 'Archived', cls: 'badge-warning' },
};

export default function BlogPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  useEffect(() => {
    const token = (localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
    if (!token) { router.push('/login'); return; }
    setAuthChecked(true);
  }, [router]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/blog', { params: { search, status, page, limit: 15 } });
      const payload = res.data?.data || res.data;
      setPosts(Array.isArray(payload?.posts) ? payload.posts : []);
      if (payload?.meta) setMeta(payload.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { if (authChecked) fetchPosts(); }, [authChecked, fetchPosts]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/blog/${id}`);
      fetchPosts();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      await api.patch(`/blog/${id}`, { featured: !featured });
      fetchPosts();
    } catch (e) { console.error(e); }
  };

  if (!authChecked) return null;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 10, backgroundColor: 'var(--accent-light)', display: 'flex' }}>
                  <PenSquare size={18} color="var(--accent-primary)" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Blog Management</h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{meta.total} total posts</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link href="/blog/categories">
                <button className="btn" style={{ gap: '0.5rem' }}>
                  <Tag size={14} /> Categories
                </button>
              </Link>
              <Link href="/blog/tags">
                <button className="btn" style={{ gap: '0.5rem' }}>
                  <Tag size={14} /> Tags
                </button>
              </Link>
              <Link href="/blog/create">
                <button className="btn btn-primary" style={{ gap: '0.5rem' }}>
                  <Plus size={14} /> New Post
                </button>
              </Link>
            </div>
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatus(tab.id); setPage(1); }}
                style={{
                  padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: status === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: status === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: status === tab.id ? 600 : 400, fontSize: '0.875rem', whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="card" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search posts by title or content..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
            />
            <button onClick={fetchPosts} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
              <PenSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>No posts found</p>
              <Link href="/blog/create">
                <button className="btn btn-primary" style={{ gap: '0.5rem' }}>
                  <Plus size={14} /> Create your first post
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {posts.map(post => {
                const badge = STATUS_BADGE[post.status] || { label: post.status, cls: 'badge-gray' };
                return (
                  <div key={post.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Cover Image */}
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        style={{ width: 90, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 90, height: 64, borderRadius: 8, backgroundColor: 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PenSquare size={20} color="var(--text-tertiary)" />
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                        {post.featured && <span className="badge badge-warning" style={{ gap: '0.25rem', display: 'flex', alignItems: 'center' }}><Star size={10} /> Featured</span>}
                        {post.category && <span className="badge badge-info">{post.category.name}</span>}
                      </div>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</h3>
                      {post.excerpt && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.excerpt}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={11} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.readingTime && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={11} /> {post.readingTime} min read</span>}
                        {post.author && <span>{post.author.fullName}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggleFeatured(post.id, post.featured)}
                        title={post.featured ? 'Unfeature' : 'Feature this post'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: post.featured ? '#f59e0b' : 'var(--text-tertiary)', padding: '0.375rem' }}
                      >
                        {post.featured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                      </button>
                      <Link href={`/blog/${post.id}/edit`}>
                        <button title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '0.375rem' }}>
                          <Edit2 size={15} />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        title="Delete"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.375rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Page {meta.page} of {meta.totalPages} · {meta.total} posts
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn" style={{ padding: '0.5rem', opacity: page <= 1 ? 0.4 : 1 }}>←</button>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="btn" style={{ padding: '0.5rem', opacity: page >= meta.totalPages ? 0.4 : 1 }}>→</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
