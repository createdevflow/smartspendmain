'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from '@/components/ui/StatCard';
import {
  Database, Image as ImageIcon, FileText, HardDrive, Trash2,
  RefreshCw, Search, Filter, Grid, List, ShieldCheck, Download,
  Archive, CheckCircle, AlertCircle, Layers, ArrowUpRight, Zap,
  Copy, Eye, X, Check, Lock
} from "lucide-react";
import { api } from '@/lib/api';

function formatBytes(bytes: number = 0) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(iso?: string) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MediaLibraryPage() {
  const [stats, setStats] = useState<any>({
    totalFiles: 0, totalBytesStored: 0, totalOriginalBytes: 0,
    totalBytesSaved: 0, compressionRatio: '0.0', totalDownloads: 0,
    byModule: {}, byStatus: {},
  });
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selection & Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const assetList = Array.isArray(assets) ? assets : [];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchMediaData = async () => {
    setLoading(true);
    try {
      const [statsRes, assetsRes] = await Promise.all([
        api.get('/admin/media/stats'),
        api.get(`/admin/media/assets?page=${page}&limit=20&module=${moduleFilter}&status=${statusFilter}&search=${encodeURIComponent(search)}`),
      ]);
      
      const sData = statsRes.data?.data || statsRes.data || {};
      setStats({
        totalFiles: sData.totalFiles || 0,
        totalBytesStored: sData.totalBytesStored || 0,
        totalOriginalBytes: sData.totalOriginalBytes || 0,
        totalBytesSaved: sData.totalBytesSaved || 0,
        compressionRatio: sData.compressionRatio || '0.0',
        totalDownloads: sData.totalDownloads || 0,
        totalUsage: sData.totalUsage || 0,
        byModule: sData.byModule || {},
        byStatus: sData.byStatus || {},
      });
      const aPayload = assetsRes.data?.data || assetsRes.data;
      if (aPayload && Array.isArray(aPayload.data)) {
        setAssets(aPayload.data);
        setTotalPages(aPayload.pagination?.totalPages || 1);
        setTotalItems(aPayload.pagination?.total || aPayload.data.length || 0);
      } else if (Array.isArray(aPayload)) {
        setAssets(aPayload);
        setTotalPages(1);
        setTotalItems(aPayload.length);
      } else {
        setAssets([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error('Failed to load media library', err);
      setNotice({ type: 'error', text: 'Failed to load media assets from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaData();
  }, [page, moduleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMediaData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/media/assets/${id}/status`, { status: newStatus });
      setNotice({ type: 'success', text: `Asset status updated to ${newStatus}.` });
      fetchMediaData();
    } catch (err: any) {
      setNotice({ type: 'error', text: 'Failed to update asset status.' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected assets?`)) return;

    setActionLoading(true);
    try {
      const res = await api.post('/admin/media/assets/bulk-delete', { ids: selectedIds });
      setNotice({ type: 'success', text: `Successfully deleted ${res.data?.deletedCount || selectedIds.length} assets.` });
      setSelectedIds([]);
      fetchMediaData();
    } catch (err: any) {
      setNotice({ type: 'error', text: 'Bulk delete failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunCleanup = async () => {
    if (!confirm('Run global media maintenance? This will clean up expired 30-day exports and archive orphaned assets with 0 references.')) return;

    setActionLoading(true);
    try {
      const res = await api.post('/admin/media/cleanup');
      setNotice({ type: 'success', text: res.data?.message || 'Media maintenance completed successfully.' });
      fetchMediaData();
    } catch (err: any) {
      setNotice({ type: 'error', text: 'Failed to execute media cleanup job.' });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === assetList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assetList.map(a => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div className="page-header animate-fade-in">
          <div className="page-header-left">
            <h1 className="page-title">Global Media &amp; Storage</h1>
            <p className="body-text" style={{ marginTop: 'var(--sp-1)' }}>
              Centralized asset monitoring, WebP compression savings, responsive variants, and storage cleanup.
            </p>
          </div>

          <div className="page-header-right">
            <button
              onClick={handleRunCleanup}
              disabled={actionLoading}
              className="btn btn-primary btn-sm"
              aria-label="Run media maintenance"
            >
              <Zap size={14} aria-hidden="true" />
              {actionLoading ? 'Running…' : 'Run Cleanup'}
            </button>
            <button onClick={fetchMediaData} className="btn btn-secondary btn-sm" aria-label="Refresh media library">
              <RefreshCw size={14} aria-hidden="true" /> Refresh
            </button>
          </div>
        </div>

        {/* Notice */}
        {notice && (
          <div
            role="alert"
            style={{
              padding: 'var(--sp-3) var(--sp-4)',
              borderRadius: 'var(--radius-btn)',
              marginBottom: 'var(--sp-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: notice.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
              border: `1px solid ${notice.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              color: notice.type === 'success' ? 'var(--success)' : 'var(--danger)',
              fontWeight: 500,
              fontSize: 'var(--type-body)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              {notice.type === 'success' ? <CheckCircle size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
              {notice.text}
            </div>
            <button onClick={() => setNotice(null)} className="btn btn-ghost btn-sm" style={{ padding: '0 var(--sp-1)' }} aria-label="Dismiss">✕</button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="stats-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <StatCard title="Total Files" value={(stats?.totalFiles || 0).toLocaleString()} icon={ImageIcon} variant="primary" accentBorder loading={loading} />
          <StatCard title="Storage Used" value={formatBytes(stats?.totalBytesStored || 0)} icon={HardDrive} variant="warning" accentBorder loading={loading} />
          <StatCard title="Compression Saved" value={`${stats?.compressionRatio || '0.0'}%`} icon={Zap} variant="success" accentBorder loading={loading} />
          <StatCard title="Total Downloads" value={(stats?.totalDownloads || 0).toLocaleString()} icon={Layers} variant="primary" accentBorder loading={loading} />
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ marginBottom: 'var(--sp-3)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--sp-2)', flex: '1 1 280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search filename, hash, or path…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 'calc(var(--sp-3) + 18px)', marginBottom: 0 }}
                aria-label="Search assets"
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">Search</button>
          </form>

          <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={moduleFilter}
              onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
              className="input-field"
              style={{ marginBottom: 0, width: 'auto', height: '32px' }}
              aria-label="Filter by module"
            >
              <option value="ALL">All Modules</option>
              <option value="users">Users (Avatars)</option>
              <option value="receipts">Receipts</option>
              <option value="invoices">Invoices</option>
              <option value="chat">Chat Attachments</option>
              <option value="blog">Blog Images</option>
              <option value="exports">Exports / Reports</option>
              <option value="system">System / Branding</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field"
              style={{ marginBottom: 0, width: 'auto', height: '32px' }}
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="EXPIRED">Expired</option>
              <option value="DELETED">Deleted</option>
            </select>

            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-btn)', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{ padding: '6px 10px', border: 'none', background: viewMode === 'grid' ? 'var(--brand-blue)' : 'var(--surface)', color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
                title="Grid View" aria-label="Grid view" aria-pressed={viewMode === 'grid'}
              ><Grid style={{ width: 14, height: 14 }} /></button>
              <button
                onClick={() => setViewMode('table')}
                style={{ padding: '6px 10px', border: 'none', background: viewMode === 'table' ? 'var(--brand-blue)' : 'var(--surface)', color: viewMode === 'table' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
                title="Table View" aria-label="Table view" aria-pressed={viewMode === 'table'}
              ><List style={{ width: 14, height: 14 }} /></button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bulk-action-bar" style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border)' }}>
            <span className="bulk-action-bar-count">{selectedIds.length} asset{selectedIds.length > 1 ? 's' : ''} selected</span>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <button onClick={() => setSelectedIds([])} className="btn btn-ghost btn-sm">Deselect All</button>
              <button
                onClick={handleBulkDelete}
                disabled={actionLoading}
                className="btn btn-destructive btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}
              >
                <Trash2 size={13} aria-hidden="true" /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="table-shell">
            <div className="state-empty">
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: 'var(--sp-3)' }} />
              <div className="skeleton" style={{ width: '160px', height: '14px', borderRadius: '3px', marginBottom: 'var(--sp-2)' }} />
              <div className="skeleton" style={{ width: '240px', height: '11px', borderRadius: '3px' }} />
            </div>
          </div>
        ) : assetList.length === 0 ? (
          <div className="table-shell">
            <div className="state-empty">
              <div className="state-empty-icon"><ImageIcon size={32} aria-hidden="true" /></div>
              <p className="state-empty-title">No Media Assets Found</p>
              <p className="state-empty-desc">There are no uploaded assets matching your selected filters.</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {assetList.map(asset => {
              const isImage = (asset.mimeType || asset.type)?.startsWith('image/');
              const isSelected = selectedIds.includes(asset.id);
              return (
                <div
                  key={asset.id}
                  style={{
                    borderRadius: '12px', background: 'var(--bg-card)', border: `2px solid ${isSelected ? '#3B82F6' : 'var(--border)'}`,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(asset.id)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2563EB' }}
                    />
                  </div>

                  {/* Preview Box */}
                  <div style={{ height: 180, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                      {isImage ? (
                        <ImageIcon style={{ width: 48, height: 48, margin: '0 auto 0.5rem' }} />
                      ) : (
                        <FileText style={{ width: 48, height: 48, margin: '0 auto 0.5rem' }} />
                      )}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{(asset.mimeType || asset.type)?.split('/')[1] || 'FILE'}</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatBytes(asset.size)}
                    </div>
                  </div>

                  {/* Asset Details */}
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={asset.filePath || asset.storageKey}>
                          {asset.filePath || asset.storageKey?.split('/').pop() || asset.id}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem', fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                        <span>ID: {asset.id.substring(0, 16)}...</span>
                        <button onClick={() => copyToClipboard(asset.id, asset.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: copiedId === asset.id ? '#10B981' : '#3B82F6', display: 'flex', alignItems: 'center' }} title="Copy full ID">
                          {copiedId === asset.id ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                          {asset.module || 'system'}
                        </span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                          background: asset.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : asset.status === 'ARCHIVED' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: asset.status === 'ACTIVE' ? '#10B981' : asset.status === 'ARCHIVED' ? '#F59E0B' : '#EF4444',
                        }}>
                          {asset.status}
                        </span>
                        {asset.dimensions?.width && (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-main)', color: 'var(--text-tertiary)', fontSize: '0.7rem', border: '1px solid var(--border)' }}>
                            {asset.dimensions.width}×{asset.dimensions.height}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                        <span>👤 {asset.owner?.fullName || asset.owner?.email?.split('@')[0] || 'System'}</span>
                        <span>{formatDate(asset.uploadDate).split(',')[0]}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="btn btn-outline"
                        style={{ flex: 1, textAlign: 'center', padding: '0.375rem', fontSize: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'none', fontWeight: 600 }}
                      >
                        <Eye style={{ width: 14, height: 14 }} /> Details
                      </button>
                      {asset.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(asset.id, 'ARCHIVED')}
                          className="btn btn-outline"
                          title="Archive Asset"
                          style={{ padding: '0.375rem', borderRadius: '6px', color: '#F59E0B', borderColor: 'var(--border)' }}
                        >
                          <Archive style={{ width: 14, height: 14 }} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(asset.id, 'ACTIVE')}
                          className="btn btn-outline"
                          title="Restore Asset"
                          style={{ padding: '0.375rem', borderRadius: '6px', color: '#10B981', borderColor: 'var(--border)' }}
                        >
                          <CheckCircle style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedIds([asset.id]); handleBulkDelete(); }}
                        className="btn btn-outline"
                        title="Delete Permanently"
                        style={{ padding: '0.375rem', borderRadius: '6px', color: '#EF4444', borderColor: 'var(--border)' }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="table-shell">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col" className="col-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === assetList.length && assetList.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', accentColor: 'var(--brand-blue)' }}
                        aria-label="Select all assets"
                      />
                    </th>
                    <th scope="col">Preview</th>
                    <th scope="col">File Details</th>
                    <th scope="col">Module</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Size &amp; Savings</th>
                    <th scope="col">Status</th>
                    <th scope="col">Uploaded</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assetList.map(asset => {
                    const isImage = (asset.mimeType || asset.type)?.startsWith('image/');
                    const isSelected = selectedIds.includes(asset.id);
                    const savedBytes = Math.max(0, (asset.originalSize || asset.size) - asset.size);
                    return (
                      <tr key={asset.id} style={{ background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(asset.id)}
                            style={{ cursor: 'pointer', accentColor: '#2563EB' }}
                          />
                        </td>
                        <td>
                          <div style={{ width: 48, height: 48, borderRadius: '6px', background: '#0F172A', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ color: '#94A3B8' }}>
                              {isImage ? <ImageIcon style={{ width: 20, height: 20 }} /> : <FileText style={{ width: 20, height: 20 }} />}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {asset.filePath || asset.storageKey?.split('/').pop() || asset.id}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '2px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                            <span>ID: {asset.id}</span>
                            <button onClick={() => copyToClipboard(asset.id, asset.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: copiedId === asset.id ? 'var(--success)' : 'var(--accent-primary)', display: 'flex', alignItems: 'center' }} title="Copy full ID">
                              {copiedId === asset.id ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                            </button>
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                            Hash: {asset.hash?.substring(0, 16)}...
                          </div>
                        </td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase' }}>
                            {asset.module || 'system'}
                          </span>
                        </td>
                        <td className="caption-text">
                          {asset.owner?.fullName || asset.owner?.email || 'System / Anonymous'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatBytes(asset.size)}</div>
                          {savedBytes > 0 && (
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600 }}>
                              -{formatBytes(savedBytes)} WebP
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: 'var(--text-xs)', fontWeight: 600,
                            background: asset.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : asset.status === 'ARCHIVED' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: asset.status === 'ACTIVE' ? 'var(--success)' : asset.status === 'ARCHIVED' ? 'var(--warning)' : 'var(--danger)',
                          }}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="caption-text">
                          {formatDate(asset.uploadDate)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedAsset(asset)} className="btn btn-outline" style={{ padding: '0.375rem 0.625rem', borderRadius: '6px', color: 'var(--accent-primary)' }} title="View Details">
                              <Eye style={{ width: 14, height: 14 }} />
                            </button>
                            <a href={asset.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.375rem 0.625rem', borderRadius: '6px' }} title="Download">
                              <Download style={{ width: 14, height: 14 }} />
                            </a>
                            {asset.status === 'ACTIVE' ? (
                              <button onClick={() => handleStatusChange(asset.id, 'ARCHIVED')} className="btn btn-outline" style={{ padding: '0.375rem 0.625rem', borderRadius: '6px', color: 'var(--warning)' }} title="Archive">
                                <Archive style={{ width: 14, height: 14 }} />
                              </button>
                            ) : (
                              <button onClick={() => handleStatusChange(asset.id, 'ACTIVE')} className="btn btn-outline" style={{ padding: '0.375rem 0.625rem', borderRadius: '6px', color: 'var(--success)' }} title="Restore">
                                <CheckCircle style={{ width: 14, height: 14 }} />
                              </button>
                            )}
                            <button onClick={() => { setSelectedIds([asset.id]); handleBulkDelete(); }} className="btn btn-outline" style={{ padding: '0.375rem 0.625rem', borderRadius: '6px', color: 'var(--danger)' }} title="Delete">
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: 'var(--sp-4)', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border)' }}>
            <span className="pagination-info">
              Page {page} of {totalPages} ({totalItems} total)
            </span>
            <div className="pagination-controls">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">‹</button>
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">›</button>
            </div>
          </div>
        )}

        {/* Asset Details Modal */}
        {selectedAsset && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0F172A', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
              {/* Modal Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Asset Details & Management</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>Inspect file metadata, compression stats, and ownership</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAsset(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0.5rem' }}>
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Privacy Preview Box */}
                <div style={{ height: 240, borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Lock style={{ width: 48, height: 48, margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Media Content Hidden</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Due to privacy restrictions, administrators cannot view the actual media content.</div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: '0.5rem' }}>
                    <span style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {formatBytes(selectedAsset.size)}
                    </span>
                    {selectedAsset.dimensions?.width && (
                      <span style={{ background: 'rgba(0,0,0,0.8)', color: '#3B82F6', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {selectedAsset.dimensions.width} × {selectedAsset.dimensions.height}
                      </span>
                    )}
                  </div>
                </div>

                {/* ID & Quick Copy Banner */}
                <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Asset Identifier</div>
                    <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-all' }}>{selectedAsset.id}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedAsset.id, 'modal')}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: copiedId === 'modal' ? '#10B981' : '#3B82F6', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}
                  >
                    {copiedId === 'modal' ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                    {copiedId === 'modal' ? 'Copied ID!' : 'Copy ID'}
                  </button>
                </div>

                {/* Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Storage Path</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '4px', wordBreak: 'break-all' }}>{selectedAsset.filePath || selectedAsset.storageKey || 'N/A'}</div>
                  </div>
                  <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>MIME Type</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '4px' }}>{selectedAsset.mimeType || selectedAsset.type || 'application/octet-stream'}</div>
                  </div>
                  <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Upload Source & Status</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{selectedAsset.module || 'system'}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: selectedAsset.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedAsset.status === 'ACTIVE' ? '#10B981' : '#EF4444', fontSize: '0.75rem', fontWeight: 700 }}>{selectedAsset.status}</span>
                    </div>
                  </div>
                  <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>File Size</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '4px' }}>Stored: {formatBytes(selectedAsset.size)}</div>
                    {selectedAsset.originalSize && selectedAsset.originalSize > selectedAsset.size && (
                      <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '2px', fontWeight: 600 }}>
                        Saved {formatBytes(selectedAsset.originalSize - selectedAsset.size)} (Original: {formatBytes(selectedAsset.originalSize)})
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Uploaded By</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '4px' }}>{selectedAsset.owner?.fullName || 'System / Anonymous'}</div>
                    {selectedAsset.owner?.email && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedAsset.owner.email}</div>
                    )}
                    {selectedAsset.owner?.id && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>ID: {selectedAsset.owner.id}</div>
                    )}
                  </div>
                  <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>File Checksum / Hash</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>{selectedAsset.hash || 'Not Calculated'}</div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Uploaded on {formatDate(selectedAsset.uploadDate)}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {selectedAsset.status === 'ACTIVE' ? (
                    <button onClick={() => { handleStatusChange(selectedAsset.id, 'ARCHIVED'); setSelectedAsset({ ...selectedAsset, status: 'ARCHIVED' }); }} className="btn btn-outline" style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: '#F59E0B' }}>
                      <Archive style={{ width: 14, height: 14 }} /> Archive
                    </button>
                  ) : (
                    <button onClick={() => { handleStatusChange(selectedAsset.id, 'ACTIVE'); setSelectedAsset({ ...selectedAsset, status: 'ACTIVE' }); }} className="btn btn-outline" style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: '#10B981' }}>
                      <CheckCircle style={{ width: 14, height: 14 }} /> Restore
                    </button>
                  )}
                  <button onClick={() => { setSelectedIds([selectedAsset.id]); setSelectedAsset(null); handleBulkDelete(); }} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#EF4444', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Trash2 style={{ width: 14, height: 14 }} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </>
  );
}
