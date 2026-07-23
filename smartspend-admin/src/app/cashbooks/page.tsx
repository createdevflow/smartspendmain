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
        <div className="page-header animate-fade-in">
          <div className="page-header-left">
            <h1 className="page-title">Shared Cashbooks</h1>
            <p className="body-text" style={{ marginTop: 'var(--sp-1)' }}>
              All cashbooks shared with other users. Total: {meta?.total ?? '—'}
            </p>
          </div>
          <div className="page-header-right">
            <button className="btn btn-secondary btn-sm" onClick={() => fetchBooks(page)} aria-label="Refresh cashbooks">
              <RefreshCw size={14} aria-hidden="true" /> Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="filter-bar" style={{ marginBottom: 'var(--sp-3)' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={14} style={{ position: 'absolute', left: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
            <input
              className="input-field"
              placeholder="Search by owner email or cashbook name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 'calc(var(--sp-3) + 20px)', marginBottom: 0 }}
              aria-label="Search cashbooks"
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-shell">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Cashbook</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Members</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {[160, 120, 70, 80, 80].map((w, j) => (
                        <td key={j}>
                          <div className="skeleton" style={{ height: '13px', width: `${w}px`, borderRadius: '3px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div className="state-empty">
                        <div className="state-empty-icon"><BookOpen size={32} aria-hidden="true" /></div>
                        <p className="state-empty-title">No shared cashbooks found</p>
                        <p className="state-empty-desc">No cashbooks match your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(book => (
                  <React.Fragment key={book.id}>
                    <tr
                      onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: book.color || 'var(--brand-blue)', flexShrink: 0 }} aria-hidden="true" />
                          <strong style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)' }}>{book.name || '(Encrypted)'}</strong>
                        </div>
                        <div className="mono-text caption-text" style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                          ID: {book.id.slice(0, 8)}…
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 'var(--type-body)' }}>{book.user?.fullName || '—'}</div>
                        <div className="caption-text">{book.user?.email}</div>
                      </td>
                      <td>
                        <span className="pill pill-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={11} aria-hidden="true" />
                          {book._count?.members || 0} member{(book._count?.members || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="mono-text" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(book.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={e => { e.stopPropagation(); setExpandedBook(expandedBook === book.id ? null : book.id); }}
                        >
                          {expandedBook === book.id ? 'Collapse' : 'View Members'}
                        </button>
                      </td>
                    </tr>

                    {expandedBook === book.id && book.members?.length > 0 && (
                      <tr key={`${book.id}-expanded`}>
                        <td colSpan={5} style={{ background: 'var(--surface-raised)', padding: 0 }}>
                          <table style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                {['Member Email', 'Name', 'Role', 'Status', 'Action'].map(h => (
                                  <th key={h} scope="col" style={{ background: 'var(--surface-raised)' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {book.members.map((m: any) => (
                                <tr key={m.id}>
                                  <td>{m.email}</td>
                                  <td>{m.user?.fullName || '(Not registered)'}</td>
                                  <td>
                                    <span className={`pill ${m.role === 'EDITOR' ? 'pill-warning' : 'pill-info'}`}>{m.role}</span>
                                  </td>
                                  <td>
                                    <span className={`pill ${m.status === 'accepted' ? 'pill-success' : 'pill-gray'}`}>{m.status}</span>
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-destructive btn-sm"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleRemoveMember(m.id, book.id)}
                                    >
                                      <UserMinus size={12} aria-hidden="true" /> Remove
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
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="pagination">
              <span className="pagination-info">Page {page} of {meta.totalPages}</span>
              <div className="pagination-controls">
                <button className="page-btn" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} aria-label="Previous page">‹</button>
                <button className="page-btn" onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))} disabled={page === meta.totalPages} aria-label="Next page">›</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
