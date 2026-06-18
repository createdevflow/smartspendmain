'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Users, UserMinus, Search, BookOpen, RefreshCw } from 'lucide-react';

export default function SharedCashbooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  const fetchBooks = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/shared-cashbooks?page=${p}&limit=15`);
      const raw = res.data?.data?.data;
      setBooks(Array.isArray(raw) ? raw : []);
      setMeta(res.data?.data?.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(page); }, [page]);

  const handleRemoveMember = async (memberId: string, bookId: string) => {
    if (!confirm('Remove this member from the cashbook?')) return;
    try {
      await api.delete(`/admin/shared-cashbooks/members/${memberId}`);
      fetchBooks(page);
    } catch (e) {
      alert('Failed to remove member');
    }
  };

  const filtered = books.filter(b =>
    !search ||
    b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    (b.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="animate-fade-in">Shared Cashbooks</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              All cashbooks that have been shared with other users. Total: {meta?.total ?? '—'}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => fetchBooks(page)} style={{ gap: '0.5rem' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {/* Search */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              className="input-field"
              placeholder="Search by owner email or cashbook name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem', marginBottom: 0 }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading shared cashbooks...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <BookOpen size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-secondary)' }}>No shared cashbooks found.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Cashbook</th>
                  <th>Owner</th>
                  <th>Members</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(book => (
                  <React.Fragment key={book.id}>
                    <tr
                      onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: book.color || '#2563EB' }} />
                          <strong>{book.name || '(Encrypted)'}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>ID: {book.id.slice(0, 8)}...</div>
                      </td>
                      <td>
                        <div>{book.user?.fullName || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{book.user?.email}</div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={12} /> {book._count?.members || 0} member{(book._count?.members || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>{new Date(book.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                          onClick={e => { e.stopPropagation(); setExpandedBook(expandedBook === book.id ? null : book.id); }}
                        >
                          {expandedBook === book.id ? 'Collapse' : 'View Members'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded member list */}
                    {expandedBook === book.id && book.members?.length > 0 && (
                      <tr key={`${book.id}-expanded`}>
                        <td colSpan={5} style={{ background: 'var(--bg-elevated)', padding: '0' }}>
                          <table style={{ width: '100%' }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-elevated)' }}>
                                <th style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Member Email</th>
                                <th style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Name</th>
                                <th style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Role</th>
                                <th style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Status</th>
                                <th style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {book.members.map((m: any) => (
                                <tr key={m.id}>
                                  <td style={{ padding: '0.5rem 1.5rem', fontSize: '0.875rem' }}>{m.email}</td>
                                  <td style={{ padding: '0.5rem 1.5rem', fontSize: '0.875rem' }}>{m.user?.fullName || '(Not registered)'}</td>
                                  <td style={{ padding: '0.5rem 1.5rem' }}>
                                    <span className={`badge ${m.role === 'EDITOR' ? 'badge-warning' : 'badge-info'}`}>{m.role}</span>
                                  </td>
                                  <td style={{ padding: '0.5rem 1.5rem' }}>
                                    <span className={`badge ${m.status === 'accepted' ? 'badge-success' : 'badge-default'}`}>{m.status}</span>
                                  </td>
                                  <td style={{ padding: '0.5rem 1.5rem' }}>
                                    <button
                                      className="btn btn-danger"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                      onClick={() => handleRemoveMember(m.id, book.id)}
                                    >
                                      <UserMinus size={12} /> Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Page {page} of {meta.totalPages}
            </span>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))} disabled={page === meta.totalPages}>Next</button>
          </div>
        )}
      </main>
    </>
  );
}
