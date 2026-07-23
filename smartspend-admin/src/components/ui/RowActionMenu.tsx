'use client';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export function RowActionMenu({ children, ariaLabel = 'Actions' }: { children: React.ReactNode, ariaLabel?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: -9999, left: -9999, maxHeight: 300, opacity: 0 });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current || !menuRef.current || isMobile) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + 4;
    let left = triggerRect.right - menuRect.width;
    let maxHeight = viewportHeight - top - 10;
    
    // Flip to top if not enough space below and more space above
    if (triggerRect.bottom + menuRect.height + 10 > viewportHeight) {
      if (triggerRect.top > viewportHeight - triggerRect.bottom) {
        top = triggerRect.top - menuRect.height - 4;
        maxHeight = triggerRect.top - 10;
      }
    }
    
    // Clamp maxHeight to 70vh max
    const maxAllowedHeight = viewportHeight * 0.7;
    if (maxHeight > maxAllowedHeight) maxHeight = maxAllowedHeight;
    
    // Keep within horizontal bounds
    if (left < 10) left = 10;
    if (left + menuRect.width > viewportWidth - 10) left = viewportWidth - menuRect.width - 10;

    setCoords({ top, left, maxHeight, opacity: 1 });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    } else {
      setCoords(c => ({ ...c, opacity: 0 }));
    }
  }, [isOpen, isMobile, children]); // Re-run if children change size

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleScrollResize = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      if (e.type === 'scroll' && !isMobile) updatePosition();
      if (e.type === 'resize') updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);
    
    // Focus management for accessibility
    if (menuRef.current) {
      const focusable = menuRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) (focusable[0] as HTMLElement).focus();
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [isOpen, isMobile]);

  return (
    <>
      <style>{`
        @keyframes menuFadeScale {
          0% { opacity: 0; transform: scale(0.95) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sheetSlideUp {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes sheetFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
      <button
        ref={triggerRef}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="btn btn-ghost btn-sm"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{ padding: '0 var(--sp-2)' }}
      >
        <MoreVertical size={14} aria-hidden="true" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        isMobile ? (
          // Mobile Bottom Sheet
          <div 
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end', animation: 'sheetFadeIn 200ms ease-out'
            }}
            onClick={() => setIsOpen(false)}
          >
            <div 
              ref={menuRef}
              role="menu"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              style={{
                background: 'var(--surface)',
                padding: 'var(--sp-4)',
                paddingBottom: 'max(var(--sp-4), env(safe-area-inset-bottom))',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                animation: 'sheetSlideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                {children}
              </div>
            </div>
          </div>
        ) : (
          // Desktop Floating Menu
          <div
            ref={menuRef}
            role="menu"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: '220px',
              maxHeight: `${coords.maxHeight}px`,
              overflowY: 'auto',
              padding: 'var(--sp-1)',
              zIndex: 9999,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-btn)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              opacity: coords.opacity,
              animation: 'menuFadeScale 150ms cubic-bezier(0.16, 1, 0.3, 1)',
              visibility: coords.opacity === 0 ? 'hidden' : 'visible'
            }}
          >
            {children}
          </div>
        ),
        document.body
      )}
    </>
  );
}
