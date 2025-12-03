import React, { useEffect, useRef } from 'react';

/**
 * PUBLIC_INTERFACE
 * Modal: Accessible dialog overlay.
 * Props:
 * - open: boolean
 * - onClose: function
 * - title: string
 * - children: ReactNode
 * - footer: ReactNode (optional)
 */
export default function Modal({ open, onClose, title, children, footer }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      // rudimentary focus management
      setTimeout(() => {
        dialogRef.current?.focus();
      }, 0);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl bg-white shadow-soft border border-gray-200 outline-none"
          tabIndex={-1}
          ref={dialogRef}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="px-4 py-3 border-t border-gray-100">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
