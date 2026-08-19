import { useState, useEffect } from 'react';
import { Download, CheckCircle, Loader, AlertCircle, RefreshCw, ArrowUpCircle } from 'lucide-react';

export default function UpdateButton({ compact = false }) {
  const [status, setStatus] = useState('idle');
  const [percent, setPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [version, setVersion] = useState('');

  useEffect(() => {
    const cleanup = window.electron?.updater?.onStatus((data) => {
      switch (data.event) {
        case 'update-available':
          setStatus('available');
          if (data.version) setVersion(data.version);
          break;
        case 'update-not-available':
          setStatus('up-to-date');
          setTimeout(() => setStatus('idle'), 3000);
          break;
        case 'download-progress':
          setStatus('downloading');
          setPercent(Math.round(data.percent || 0));
          break;
        case 'update-downloaded':
          setStatus('ready');
          break;
        case 'error':
          setStatus('error');
          setErrorMsg(data.message || 'Update failed');
          setTimeout(() => setStatus('idle'), 5000);
          break;
      }
    });
    return () => { if (cleanup) cleanup(); };
  }, []);

  const handleClick = () => {
    if (status === 'idle' || status === 'error') {
      setStatus('checking');
      window.electron?.updater?.check();
    } else if (status === 'available') {
      setStatus('downloading');
      window.electron?.updater?.download();
    } else if (status === 'ready') {
      window.electron?.updater?.install();
    }
  };

  const configs = {
    idle: {
      icon: ArrowUpCircle,
      text: 'Check for Updates',
      sub: null,
      bg: 'bg-white hover:bg-gray-50 border border-gray-200',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-400',
    },
    checking: {
      icon: Loader,
      text: 'Checking for updates...',
      sub: null,
      bg: 'bg-blue-50 border border-blue-200',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
    available: {
      icon: Download,
      text: 'Update Available',
      sub: version ? `Version ${version} — tap to download` : 'Tap to download',
      bg: 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200',
      textColor: 'text-emerald-800',
      iconColor: 'text-emerald-500',
    },
    downloading: {
      icon: Loader,
      text: `Downloading... ${percent}%`,
      sub: null,
      bg: 'bg-blue-50 border border-blue-200',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
    ready: {
      icon: CheckCircle,
      text: 'Update Ready',
      sub: 'Tap to restart and apply',
      bg: 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300',
      textColor: 'text-emerald-800',
      iconColor: 'text-emerald-600',
    },
    error: {
      icon: AlertCircle,
      text: 'Update Failed',
      sub: errorMsg || 'Try again later',
      bg: 'bg-red-50 border border-red-200',
      textColor: 'text-red-700',
      iconColor: 'text-red-400',
    },
    'up-to-date': {
      icon: RefreshCw,
      text: 'You\'re up to date!',
      sub: null,
      bg: 'bg-green-50 border border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-500',
    },
  };

  const cfg = configs[status];
  const spinning = status === 'checking' || status === 'downloading';
  const disabled = status === 'checking' || status === 'downloading' || status === 'up-to-date';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={status === 'error' ? errorMsg : ''}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 disabled:cursor-not-allowed ${cfg.bg} shadow-sm`}
    >
      <div className={`flex-shrink-0 ${cfg.iconColor}`}>
        <cfg.icon size={18} className={spinning ? 'animate-spin' : ''} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${cfg.textColor}`}>{cfg.text}</p>
        {cfg.sub && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{cfg.sub}</p>
        )}
      </div>
      {status === 'downloading' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-blue-400 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </button>
  );
}
