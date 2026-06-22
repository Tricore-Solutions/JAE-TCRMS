import { createContext, useContext, useState, useCallback } from 'react';
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
      <div className="fixed bottom-6 right-6 z-[100] space-y-2 max-w-sm w-full">
        {toasts.map(t => <Toast key={t.id} {...t} onClose={() => remove(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function Toast({ message, type, onClose }) {
  const icons = {
    success: <CheckCircle size={16} className="text-green-400 flex-shrink-0" />,
    error:   <XCircle size={16} className="text-red-400 flex-shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />,
    info:    <Info size={16} className="text-blue-400 flex-shrink-0" />,
  };
  const borders = {
    success: 'border-green-700/40',
    error:   'border-red-700/40',
    warning: 'border-amber-700/40',
    info:    'border-blue-700/40',
  };
  return (
    <div className={`flex items-start gap-3 bg-slate-800 border ${borders[type] || borders.info} rounded-xl px-4 py-3 shadow-lg text-sm text-slate-200 animate-in slide-in-from-right`}>
      {icons[type] || icons.info}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-slate-500 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}
