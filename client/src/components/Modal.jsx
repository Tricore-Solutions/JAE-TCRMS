import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useScrollLock from '../hooks/useScrollLock';

export default function Modal({ open, onClose, title, description, children, size = 'md', bodyClassName = '' }) {
  useScrollLock(open);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 overscroll-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full ${sizes[size] || sizes.md} bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[min(90vh,calc(100vh-2rem))]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className={`flex-1 min-h-0 overscroll-contain ${bodyClassName || 'overflow-y-auto px-6 py-5'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
