'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Globe } from 'lucide-react';

interface SeoData {
  seoTitle?: string;
  seoDescription?: string;
  focusKeywords?: string;
  canonicalUrl?: string;
  metaRobots?: string;
  ogImage?: string;
}

interface Props {
  data: SeoData;
  onChange: (d: SeoData) => void;
}

export function SeoPanel({ data, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const update = (key: keyof SeoData, val: string) => onChange({ ...data, [key]: val });

  const titleLen = (data.seoTitle || '').length;
  const descLen = (data.seoDescription || '').length;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '1.25rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '0.875rem 1.25rem', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9375rem'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={16} color="var(--accent-primary)" /> SEO & Metadata
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)' }}>
          {/* SEO Title */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>SEO Title</label>
              <span style={{ fontSize: '0.75rem', color: titleLen > 60 ? 'var(--danger)' : titleLen > 50 ? 'var(--warning)' : 'var(--success)' }}>
                {titleLen}/60
              </span>
            </div>
            <input
              className="input-field"
              value={data.seoTitle || ''}
              onChange={e => update('seoTitle', e.target.value)}
              placeholder="SEO optimised title (50-60 chars recommended)"
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Meta Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Meta Description</label>
              <span style={{ fontSize: '0.75rem', color: descLen > 160 ? 'var(--danger)' : descLen > 140 ? 'var(--warning)' : 'var(--success)' }}>
                {descLen}/160
              </span>
            </div>
            <textarea
              className="input-field"
              value={data.seoDescription || ''}
              onChange={e => update('seoDescription', e.target.value)}
              placeholder="Compelling description for search results (120-160 chars)"
              style={{ marginBottom: 0, resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Focus Keywords */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              Focus Keywords
            </label>
            <input
              className="input-field"
              value={data.focusKeywords || ''}
              onChange={e => update('focusKeywords', e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* OG Image */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Open Graph Image
              </label>
              <label style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}>
                + Upload Image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = reader.result as string;
                      update('ogImage', result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <input
              className="input-field"
              value={data.ogImage || ''}
              onChange={e => update('ogImage', e.target.value)}
              placeholder="Upload or paste image URL (1200×630px recommended)"
              style={{ marginBottom: data.ogImage ? '0.5rem' : 0 }}
            />
            {data.ogImage && (
              <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={data.ogImage} alt="OG Preview" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', padding: '4px 8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>OG Image Loaded</span>
                  <button type="button" onClick={() => update('ogImage', '')} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.7rem' }}>Remove</button>
                </div>
              </div>
            )}
          </div>

          {/* Canonical URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              Canonical URL
            </label>
            <input
              className="input-field"
              value={data.canonicalUrl || ''}
              onChange={e => update('canonicalUrl', e.target.value)}
              placeholder="Leave blank to use page URL"
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Meta Robots */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              Meta Robots
            </label>
            <select
              className="input-field"
              value={data.metaRobots || 'index,follow'}
              onChange={e => update('metaRobots', e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="index,follow">index, follow (default)</option>
              <option value="noindex,follow">noindex, follow</option>
              <option value="index,nofollow">index, nofollow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
            </select>
          </div>

          {/* Google Preview */}
          {(data.seoTitle || data.seoDescription) && (
            <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>Google Preview</p>
              <p style={{ fontSize: '1.0625rem', color: '#1a0dab', margin: '0 0 0.125rem', fontFamily: 'arial, sans-serif', cursor: 'pointer' }}>{data.seoTitle || 'Post Title'}</p>
              <p style={{ fontSize: '0.8125rem', color: '#006621', margin: '0 0 0.25rem', fontFamily: 'arial, sans-serif' }}>{data.canonicalUrl || 'https://cashtro.app/blog/post-slug'}</p>
              <p style={{ fontSize: '0.8125rem', color: '#545454', margin: 0, fontFamily: 'arial, sans-serif', lineHeight: 1.4 }}>{data.seoDescription || 'Post description will appear here...'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
