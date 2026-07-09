'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Code, Minus, Link2, Image as ImageIcon, Undo, Redo,
  Heading1, Heading2, Heading3, Type, CheckSquare, Table, Maximize2,
  Minimize2, Eye, EyeOff, Clock, FileText, File
} from 'lucide-react';

// Block types supported
type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'heading4' |
  'bullet_list' | 'numbered_list' | 'checklist' | 'quote' | 'code' | 'divider' |
  'image' | 'document' | 'callout_info' | 'callout_warning' | 'callout_success' | 'table';

export interface EditorBlock {
  id: string;
  type: BlockType;
  text?: string;
  items?: string[];
  checked?: boolean[];
  src?: string;
  alt?: string;
  caption?: string;
  calloutText?: string;
  language?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  docStyle?: 'link' | 'card' | 'button';
  fileName?: string;
  fileSize?: string;
  level?: number;
  rows?: string[][];
}

interface Props {
  value: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  placeholder?: string;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function countWords(blocks: EditorBlock[]) {
  return blocks.map(b => b.text || (b.items || []).join(' ') || b.calloutText || '').join(' ')
    .split(/\s+/).filter(Boolean).length;
}

function countChars(blocks: EditorBlock[]) {
  return blocks.map(b => b.text || (b.items || []).join('') || b.calloutText || '').join('').length;
}

function estimateRead(blocks: EditorBlock[]) {
  return Math.max(1, Math.ceil(countWords(blocks) / 200));
}

const BLOCK_LABELS: Record<string, string> = {
  paragraph: 'Paragraph', heading1: 'Heading 1', heading2: 'Heading 2',
  heading3: 'Heading 3', heading4: 'Heading 4', bullet_list: 'Bullet List',
  numbered_list: 'Numbered List', checklist: 'Checklist', quote: 'Quote',
  code: 'Code Block', divider: 'Divider', image: 'Image', document: 'Document',
  callout_info: 'Info Callout', callout_warning: 'Warning Callout',
  callout_success: 'Success Callout', table: 'Table',
};

// ── Top-level components to prevent unmounting and caret loss on keystrokes ──

const BlockControls = ({
  block,
  updateBlock,
  moveBlock,
  addBlock,
  removeBlock,
}: {
  block: EditorBlock;
  updateBlock: (id: string, updates: Partial<EditorBlock>) => void;
  moveBlock: (id: string, dir: 'up' | 'down') => void;
  addBlock: (afterId: string, type?: BlockType) => void;
  removeBlock: (id: string) => void;
}) => (
  <div style={{
    position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
    display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 8, padding: '0.25rem', zIndex: 10,
    boxShadow: 'var(--shadow-sm)'
  }}>
    <select
      value={block.type}
      onChange={e => updateBlock(block.id, { type: e.target.value as BlockType })}
      style={{ fontSize: '0.75rem', border: 'none', background: 'none', outline: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
    >
      {Object.entries(BLOCK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
    <button type="button" onClick={() => moveBlock(block.id, 'up')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.125rem 0.25rem', fontSize: '0.75rem' }}>↑</button>
    <button type="button" onClick={() => moveBlock(block.id, 'down')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.125rem 0.25rem', fontSize: '0.75rem' }}>↓</button>
    <button type="button" onClick={() => addBlock(block.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '0.125rem 0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>+</button>
    <button type="button" onClick={() => removeBlock(block.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.125rem 0.25rem', fontSize: '0.75rem' }}>×</button>
  </div>
);

const ContentEditableParagraph = ({
  block,
  updateBlock,
  addBlock,
  removeBlock,
  placeholder,
}: {
  block: EditorBlock;
  updateBlock: (id: string, updates: Partial<EditorBlock>) => void;
  addBlock: (afterId: string, type?: BlockType) => void;
  removeBlock: (id: string) => void;
  placeholder?: string;
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current && divRef.current.innerHTML !== (block.text || '')) {
      divRef.current.innerHTML = block.text || '';
    }
  }, [block.id]);

  return (
    <div
      ref={divRef}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder || 'Start writing... Press / for commands'}
      onInput={e => {
        const html = (e.target as HTMLElement).innerHTML;
        updateBlock(block.id, { text: html });
      }}
      onBlur={e => {
        const html = (e.target as HTMLElement).innerHTML;
        updateBlock(block.id, { text: html });
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          addBlock(block.id);
        }
        if (e.key === 'Backspace' && (e.target as HTMLElement).innerText.trim() === '') {
          e.preventDefault();
          removeBlock(block.id);
        }
      }}
      style={{
        minHeight: '1.5rem', outline: 'none', fontSize: '0.9375rem', lineHeight: 1.7,
        color: 'var(--text-primary)', fontFamily: 'inherit',
      }}
    />
  );
};

interface BlockRendererProps {
  block: EditorBlock;
  isActive: boolean;
  setActiveBlockId: (id: string | null) => void;
  updateBlock: (id: string, updates: Partial<EditorBlock>) => void;
  addBlock: (afterId: string, type?: BlockType) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, dir: 'up' | 'down') => void;
  placeholder?: string;
}

const BlockRenderer = ({
  block,
  isActive,
  setActiveBlockId,
  updateBlock,
  addBlock,
  removeBlock,
  moveBlock,
  placeholder,
}: BlockRendererProps) => {

  const renderControls = () => {
    if (!isActive) return null;
    return (
      <BlockControls
        block={block}
        updateBlock={updateBlock}
        moveBlock={moveBlock}
        addBlock={addBlock}
        removeBlock={removeBlock}
      />
    );
  };

  if (block.type === 'divider') {
    return (
      <div style={{ padding: '0.5rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '0.5rem 0' }} />
        {renderControls()}
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div style={{ padding: '0.5rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        {block.src ? (
          <div style={{ width: block.width || '100%', margin: block.align === 'left' ? '0 auto 0 0' : block.align === 'right' ? '0 0 0 auto' : '0 auto' }}>
            <img src={block.src} alt={block.alt || ''} style={{ width: '100%', borderRadius: 8 }} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="input-field"
                placeholder="Image caption..."
                value={block.caption || ''}
                onChange={e => updateBlock(block.id, { caption: e.target.value })}
                onClick={e => e.stopPropagation()}
                style={{ flex: 1, marginBottom: 0, fontSize: '0.8125rem' }}
              />
              <select
                value={block.width || '100%'}
                onChange={e => updateBlock(block.id, { width: e.target.value })}
                onClick={e => e.stopPropagation()}
                style={{ fontSize: '0.75rem', padding: '0.375rem', borderRadius: 4, border: '1px solid var(--border)' }}
              >
                <option value="100%">100% Width</option>
                <option value="75%">75% Width</option>
                <option value="50%">50% Width</option>
              </select>
              <select
                value={block.align || 'center'}
                onChange={e => updateBlock(block.id, { align: e.target.value as any })}
                onClick={e => e.stopPropagation()}
                style={{ fontSize: '0.75rem', padding: '0.375rem', borderRadius: 4, border: '1px solid var(--border)' }}
              >
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 8, color: 'var(--text-tertiary)' }}>
            <ImageIcon size={32} style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}>Upload Image or Enter URL</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', backgroundColor: 'var(--accent-primary)', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                + Upload File
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => updateBlock(block.id, { src: reader.result as string });
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <input
                className="input-field"
                placeholder="https://..."
                style={{ width: 220, marginBottom: 0 }}
                onClick={e => e.stopPropagation()}
                onChange={e => updateBlock(block.id, { src: e.target.value })}
              />
            </div>
          </div>
        )}
        {renderControls()}
      </div>
    );
  }

  if (block.type === 'document') {
    return (
      <div style={{ padding: '0.5rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 8, backgroundColor: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <File size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Document Attachment Block</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              className="input-field"
              placeholder="Document URL or upload link..."
              value={block.src || ''}
              onChange={e => updateBlock(block.id, { src: e.target.value })}
              onClick={e => e.stopPropagation()}
              style={{ marginBottom: 0, fontSize: '0.8125rem' }}
            />
            <label style={{ fontSize: '0.8125rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 6, textAlign: 'center', cursor: 'pointer', fontWeight: 600, color: 'var(--accent-primary)' }}>
              + Upload Doc File
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                  const reader = new FileReader();
                  reader.onload = () => updateBlock(block.id, { src: reader.result as string, fileName: file.name, fileSize: sizeMB });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input-field"
              placeholder="Display File Name (e.g. Q2 Brochure.pdf)"
              value={block.fileName || ''}
              onChange={e => updateBlock(block.id, { fileName: e.target.value })}
              onClick={e => e.stopPropagation()}
              style={{ flex: 1, marginBottom: 0, fontSize: '0.8125rem' }}
            />
            <input
              className="input-field"
              placeholder="File Size (e.g. 2.4 MB)"
              value={block.fileSize || ''}
              onChange={e => updateBlock(block.id, { fileSize: e.target.value })}
              onClick={e => e.stopPropagation()}
              style={{ width: 130, marginBottom: 0, fontSize: '0.8125rem' }}
            />
            <select
              value={block.docStyle || 'button'}
              onChange={e => updateBlock(block.id, { docStyle: e.target.value as any })}
              onClick={e => e.stopPropagation()}
              style={{ fontSize: '0.8125rem', padding: '0.375rem', borderRadius: 6, border: '1px solid var(--border)' }}
            >
              <option value="button">Button Style</option>
              <option value="card">Card Style</option>
              <option value="link">Link Style</option>
            </select>
          </div>
        </div>
        {renderControls()}
      </div>
    );
  }

  if (block.type.startsWith('callout_')) {
    const calloutStyles: Record<string, { bg: string; border: string; color: string; label: string }> = {
      callout_info: { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8', label: '💡 Info' },
      callout_warning: { bg: '#fffbeb', border: '#f59e0b', color: '#92400e', label: '⚠️ Warning' },
      callout_success: { bg: '#f0fdf4', border: '#22c55e', color: '#15803d', label: '✅ Success' },
    };
    const style = calloutStyles[block.type] || calloutStyles.callout_info;
    return (
      <div style={{ padding: '0.5rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        <div style={{ backgroundColor: style.bg, borderLeft: `4px solid ${style.border}`, borderRadius: 8, padding: '0.875rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: style.color, marginBottom: '0.375rem' }}>{style.label}</div>
          <textarea
            value={block.calloutText || ''}
            onChange={e => updateBlock(block.id, { calloutText: e.target.value })}
            onClick={e => e.stopPropagation()}
            placeholder="Callout text..."
            style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', color: style.color, fontSize: '0.875rem', fontFamily: 'inherit' }}
            rows={2}
          />
        </div>
        {renderControls()}
      </div>
    );
  }

  if (block.type === 'code') {
    return (
      <div style={{ padding: '0.5rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        <div style={{ backgroundColor: '#1e1e2e', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '0.375rem 0.75rem', backgroundColor: '#2d2d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <select
              value={block.language || 'javascript'}
              onChange={e => updateBlock(block.id, { language: e.target.value })}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.75rem', cursor: 'pointer' }}
              onClick={e => e.stopPropagation()}
            >
              {['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'bash', 'sql', 'html', 'css', 'json'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <textarea
            value={block.text || ''}
            onChange={e => updateBlock(block.id, { text: e.target.value })}
            onClick={e => e.stopPropagation()}
            placeholder="// code here..."
            style={{ width: '100%', background: 'none', border: 'none', outline: 'none', padding: '1rem', color: '#e2e8f0', fontSize: '0.875rem', fontFamily: 'monospace', resize: 'vertical', minHeight: 100 }}
          />
        </div>
        {renderControls()}
      </div>
    );
  }

  if (block.type === 'quote') {
    return (
      <div style={{ padding: '0.5rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        <div style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '1rem' }}>
          <textarea
            value={block.text || ''}
            onChange={e => updateBlock(block.id, { text: e.target.value })}
            onClick={e => e.stopPropagation()}
            placeholder="Quote text..."
            style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', color: 'var(--text-secondary)', fontSize: '1.0625rem', fontStyle: 'italic', fontFamily: 'inherit' }}
            rows={2}
          />
        </div>
        {renderControls()}
      </div>
    );
  }

  // Heading blocks
  if (block.type.startsWith('heading')) {
    const level = parseInt(block.type.replace('heading', ''));
    const fontSize = level === 1 ? '1.75rem' : level === 2 ? '1.375rem' : level === 3 ? '1.125rem' : '1rem';
    return (
      <div style={{ padding: '0.25rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        <input
          type="text"
          value={block.text || ''}
          onChange={e => updateBlock(block.id, { text: e.target.value })}
          onClick={e => e.stopPropagation()}
          placeholder={`Heading ${level}`}
          style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}
        />
        {renderControls()}
      </div>
    );
  }

  // Bullet/Numbered list
  if (block.type === 'bullet_list' || block.type === 'numbered_list') {
    const items = block.items || [''];
    return (
      <div style={{ padding: '0.25rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', paddingTop: '0.1rem', flexShrink: 0 }}>
              {block.type === 'numbered_list' ? `${i + 1}.` : '•'}
            </span>
            <input
              type="text"
              value={item}
              onChange={e => {
                const next = [...items];
                next[i] = e.target.value;
                updateBlock(block.id, { items: next });
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); const next = [...items]; next.splice(i + 1, 0, ''); updateBlock(block.id, { items: next }); }
                if (e.key === 'Backspace' && item === '' && items.length > 1) { const next = items.filter((_, j) => j !== i); updateBlock(block.id, { items: next }); }
              }}
              onClick={e => e.stopPropagation()}
              placeholder="List item..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.9375rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
            />
          </div>
        ))}
        {renderControls()}
      </div>
    );
  }

  // Checklist
  if (block.type === 'checklist') {
    const items = block.items || [''];
    const checked = block.checked || items.map(() => false);
    return (
      <div style={{ padding: '0.25rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <input type="checkbox" checked={!!checked[i]} onChange={e => {
              const next = [...checked]; next[i] = e.target.checked; updateBlock(block.id, { checked: next });
            }} onClick={e => e.stopPropagation()} />
            <input
              type="text"
              value={item}
              onChange={e => { const next = [...items]; next[i] = e.target.value; updateBlock(block.id, { items: next }); }}
              onClick={e => e.stopPropagation()}
              placeholder="Task..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.9375rem', color: checked[i] ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: checked[i] ? 'line-through' : 'none', fontFamily: 'inherit' }}
            />
          </div>
        ))}
        {renderControls()}
      </div>
    );
  }

  // Default: Paragraph
  return (
    <div style={{ padding: '0.25rem 1rem', position: 'relative' }} onClick={() => setActiveBlockId(block.id)}>
      <ContentEditableParagraph
        block={block}
        updateBlock={updateBlock}
        addBlock={addBlock}
        removeBlock={removeBlock}
        placeholder={placeholder}
      />
      {renderControls()}
    </div>
  );
};

// ── Main RichEditor Component ────────────────────────────────

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const blocks = value.length > 0 ? value : [{ id: uid(), type: 'paragraph' as BlockType, text: '' }];

  const updateBlock = useCallback((id: string, updates: Partial<EditorBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [blocks, onChange]);

  const addBlock = useCallback((afterId: string, type: BlockType = 'paragraph') => {
    const idx = blocks.findIndex(b => b.id === afterId);
    const newBlock: EditorBlock = { id: uid(), type, text: '' };
    if (type === 'bullet_list' || type === 'numbered_list') newBlock.items = [''];
    if (type === 'checklist') { newBlock.items = ['']; newBlock.checked = [false]; }
    if (type === 'table') newBlock.rows = [['', ''], ['', '']];
    const next = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    onChange(next);
    setActiveBlockId(newBlock.id);
  }, [blocks, onChange]);

  const removeBlock = useCallback((id: string) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter(b => b.id !== id));
  }, [blocks, onChange]);

  const moveBlock = useCallback((id: string, dir: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === blocks.length - 1) return;
    const next = [...blocks];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }, [blocks, onChange]);

  const words = countWords(blocks);
  const chars = countChars(blocks);
  const readTime = estimateRead(blocks);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) execCmd('createLink', url);
  };

  return (
    <div style={{
      position: fullscreen ? 'fixed' : 'relative',
      inset: fullscreen ? 0 : 'auto',
      zIndex: fullscreen ? 9999 : 'auto',
      display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--bg-surface)', overflow: 'hidden',
      minHeight: fullscreen ? '100vh' : 500,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.25rem',
        padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 5
      }}>
        <div style={{ display: 'flex', gap: '0.125rem', marginRight: '0.5rem' }}>
          {[
            { icon: <Bold size={14} />, cmd: 'bold', title: 'Bold (Ctrl+B)' },
            { icon: <Italic size={14} />, cmd: 'italic', title: 'Italic (Ctrl+I)' },
            { icon: <Underline size={14} />, cmd: 'underline', title: 'Underline (Ctrl+U)' },
            { icon: <Strikethrough size={14} />, cmd: 'strikeThrough', title: 'Strikethrough' },
            { icon: <Code size={14} />, cmd: 'formatBlock', val: 'code', title: 'Inline Code' },
          ].map(({ icon, cmd, val, title }) => (
            <button key={cmd} type="button" title={title} onMouseDown={e => { e.preventDefault(); execCmd(cmd, val); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}>
              {icon}
            </button>
          ))}
        </div>

        <div style={{ width: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

        <div style={{ display: 'flex', gap: '0.125rem', marginRight: '0.5rem' }}>
          {[
            { icon: <AlignLeft size={14} />, cmd: 'justifyLeft', title: 'Align Left' },
            { icon: <AlignCenter size={14} />, cmd: 'justifyCenter', title: 'Align Center' },
            { icon: <AlignRight size={14} />, cmd: 'justifyRight', title: 'Align Right' },
          ].map(({ icon, cmd, title }) => (
            <button key={cmd} type="button" title={title} onMouseDown={e => { e.preventDefault(); execCmd(cmd); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}>
              {icon}
            </button>
          ))}
        </div>

        <div style={{ width: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

        <div style={{ display: 'flex', gap: '0.125rem', marginRight: '0.5rem' }}>
          <button type="button" title="Bullet List" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}><List size={14} /></button>
          <button type="button" title="Numbered List" onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}><ListOrdered size={14} /></button>
        </div>

        <div style={{ width: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

        <div style={{ display: 'flex', gap: '0.125rem', marginRight: '0.5rem' }}>
          <button type="button" title="Add Link" onMouseDown={e => { e.preventDefault(); insertLink(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}><Link2 size={14} /></button>
          <button type="button" title="Quote" onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'blockquote'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}><Quote size={14} /></button>
          <button type="button" title="Divider" onMouseDown={e => { e.preventDefault(); execCmd('insertHorizontalRule'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}><Minus size={14} /></button>
        </div>

        <div style={{ width: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

        {/* Quick Insert Blocks */}
        <div style={{ display: 'flex', gap: '0.375rem', marginRight: '0.5rem', alignItems: 'center' }}>
          <button type="button" title="Insert Image Block" onMouseDown={e => { e.preventDefault(); addBlock(activeBlockId || blocks[blocks.length - 1]?.id || '', 'image'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
            <ImageIcon size={13} /> + Image
          </button>
          <button type="button" title="Insert Document Attachment Block" onMouseDown={e => { e.preventDefault(); addBlock(activeBlockId || blocks[blocks.length - 1]?.id || '', 'document'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
            <File size={13} /> + Document
          </button>
        </div>

        <div style={{ width: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

        <div style={{ display: 'flex', gap: '0.125rem' }}>
          <button type="button" title="Undo (Ctrl+Z)" onMouseDown={e => { e.preventDefault(); execCmd('undo'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}><Undo size={14} /></button>
          <button type="button" title="Redo (Ctrl+Y)" onMouseDown={e => { e.preventDefault(); execCmd('redo'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}><Redo size={14} /></button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <FileText size={12} /> {words}w
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> {readTime}min
          </span>
          <button type="button" title="Preview" onClick={() => setPreview(!preview)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: preview ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
            {preview ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button type="button" title="Fullscreen" onClick={() => setFullscreen(!fullscreen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 4, color: 'var(--text-secondary)' }}>
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {preview ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', maxWidth: 720, margin: '0 auto' }}>
          {blocks.map(block => {
            if (block.type === 'divider') return <hr key={block.id} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />;
            if (block.type === 'heading1') return <h1 key={block.id}>{block.text}</h1>;
            if (block.type === 'heading2') return <h2 key={block.id}>{block.text}</h2>;
            if (block.type === 'heading3') return <h3 key={block.id}>{block.text}</h3>;
            if (block.type === 'heading4') return <h4 key={block.id}>{block.text}</h4>;
            if (block.type === 'quote') return <blockquote key={block.id} style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{block.text}</blockquote>;
            if (block.type === 'code') return <pre key={block.id} style={{ background: '#1e1e2e', color: '#e2e8f0', padding: '1rem', borderRadius: 8, overflow: 'auto' }}><code>{block.text}</code></pre>;
            if (block.type === 'bullet_list') return <ul key={block.id}>{(block.items || []).map((it, i) => <li key={i}>{it}</li>)}</ul>;
            if (block.type === 'numbered_list') return <ol key={block.id}>{(block.items || []).map((it, i) => <li key={i}>{it}</li>)}</ol>;
            if (block.type === 'image') return block.src ? <img key={block.id} src={block.src} alt={block.alt} style={{ maxWidth: '100%', borderRadius: 8 }} /> : null;
            if (block.type === 'document') return block.src ? (
              <div key={block.id} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span>📄 {block.fileName || 'Document'}</span>
                <a href={block.src} target="_blank" rel="noopener noreferrer" download className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>Download</a>
              </div>
            ) : null;
            if (block.type.startsWith('callout_')) return (
              <div key={block.id} style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0 }}>{block.calloutText}</p>
              </div>
            );
            return <p key={block.id} dangerouslySetInnerHTML={{ __html: block.text || '' }} style={{ marginBottom: '1rem', lineHeight: 1.7 }} />;
          })}
        </div>
      ) : (
        <div
          ref={editorRef}
          style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}
          onClick={() => setActiveBlockId(null)}
        >
          {blocks.map(block => (
            <div
              key={block.id}
              style={{
                position: 'relative',
                borderRadius: 4,
                backgroundColor: activeBlockId === block.id ? 'var(--bg-elevated)' : 'transparent',
                transition: 'background-color 0.1s',
              }}
            >
              <BlockRenderer
                block={block}
                isActive={activeBlockId === block.id}
                setActiveBlockId={setActiveBlockId}
                updateBlock={updateBlock}
                addBlock={addBlock}
                removeBlock={removeBlock}
                moveBlock={moveBlock}
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* Add block quick bar at end */}
          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', borderTop: '1px dashed var(--border)', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Insert Block:</span>
            <button type="button" onClick={() => addBlock(blocks[blocks.length - 1]?.id || '', 'paragraph')} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>+ Paragraph</button>
            <button type="button" onClick={() => addBlock(blocks[blocks.length - 1]?.id || '', 'image')} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', fontWeight: 600 }}>+ Image Upload</button>
            <button type="button" onClick={() => addBlock(blocks[blocks.length - 1]?.id || '', 'document')} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a', fontWeight: 600 }}>+ Document Attachment</button>
            <button type="button" onClick={() => addBlock(blocks[blocks.length - 1]?.id || '', 'heading2')} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>+ Heading</button>
            <button type="button" onClick={() => addBlock(blocks[blocks.length - 1]?.id || '', 'bullet_list')} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>+ List</button>
            <button type="button" onClick={() => addBlock(blocks[blocks.length - 1]?.id || '', 'callout_info')} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>+ Callout</button>
            <button type="button" onClick={() => addBlock(blocks[blocks.length - 1]?.id || '', 'quote')} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>+ Quote</button>
            <button type="button" onClick={() => addBlock(blocks[blocks.length - 1]?.id || '', 'code')} className="btn" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>+ Code</button>
          </div>
        </div>
      )}

      {/* Footer stats */}
      <div style={{
        borderTop: '1px solid var(--border)', padding: '0.375rem 1rem',
        display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)',
        backgroundColor: 'var(--bg-elevated)'
      }}>
        <span>{words} words</span>
        <span>{chars} characters</span>
        <span>{blocks.length} blocks</span>
        <span>~{readTime} min read</span>
      </div>
    </div>
  );
}
