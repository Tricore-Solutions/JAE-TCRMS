import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[300] space-y-2 max-w-sm w-full pointer-events-none">
          {toasts.map(t => <Toast key={t.id} {...t} onClose={() => remove(t.id)} />)}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle size={16} className="text-green-600 flex-shrink-0" />,
    error:   <XCircle size={16} className="text-red-600 flex-shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />,
    info:    <Info size={16} className="text-[#1D72B8] flex-shrink-0" />,
  };
  const borders = {
    success: 'border-green-200',
    error:   'border-red-200',
    warning: 'border-amber-200',
    info:    'border-blue-200',
  };
  return (
    <div className={`pointer-events-auto flex items-start gap-3 bg-white border ${borders[type] || borders.info} rounded-xl px-4 py-3 shadow-2xl text-sm text-gray-700 animate-in slide-in-from-right`}>
      {icons[type] || icons.info}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
        <X size={14} />
      </button>
    </div>
  );
}
