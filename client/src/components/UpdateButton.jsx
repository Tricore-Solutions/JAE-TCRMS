import { useState, useEffect } from 'react';
import { Download, CheckCircle, Loader, AlertCircle, RefreshCw, ArrowUpCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

function UpdateModal({ open, onClose, version, releaseNotes, releaseDate, status, percent, errorMsg, onDownload, onInstall }) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[80vh]">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">
              {status === 'error' ? 'Update Failed' : status === 'ready' ? 'Update Ready' : status === 'downloading' ? 'Downloading Update' : 'Update Available'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {status === 'error' ? 'Something went wrong while checking or downloading' : 'A new version is ready'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <ArrowUpCircle size={20} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Version {version}</p>
              {releaseDate && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  Released {new Date(releaseDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {releaseNotes && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Release Notes</p>
              <div
                className="text-sm text-gray-700 prose prose-sm max-w-none bg-gray-50 rounded-lg p-4 border border-gray-100"
                dangerouslySetInnerHTML={{ __html: typeof releaseNotes === 'string' ? releaseNotes : releaseNotes.map(n => n.note || n).join('') }}
              />
            </div>
          )}

          {status === 'downloading' && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Downloading...</span>
                <span>{percent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700">Download complete. Restart to apply the update.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Later
          </button>
          {status === 'available' && (
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Download size={16} />
              Download Update
            </button>
          )}
          {status === 'downloading' && (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-400 rounded-lg cursor-not-allowed"
            >
              <Loader size={16} className="animate-spin" />
              Downloading...
            </button>
          )}
          {status === 'ready' && (
            <button
              onClick={onInstall}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <CheckCircle size={16} />
              Restart & Update
            </button>
          )}
          {status === 'error' && (
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1D72B8] hover:bg-[#1864a3] rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function UpdateButton() {
  const [status, setStatus] = useState('idle');
  const [percent, setPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const cleanup = window.electron?.updater?.onStatus((data) => {
      switch (data.event) {
        case 'update-available':
          setStatus('available');
          if (data.version) setVersion(data.version);
          if (data.releaseNotes) setReleaseNotes(data.releaseNotes);
          if (data.releaseDate) setReleaseDate(data.releaseDate);
          setModalOpen(true);
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
          setModalOpen(true);
          break;
      }
    });
    return () => { if (cleanup) cleanup(); };
  }, []);

  const handleCheck = () => {
    setStatus('checking');
    window.electron?.updater?.check();
  };

  const handleDownload = () => {
    setStatus('downloading');
    window.electron?.updater?.download();
  };

  const handleInstall = () => {
    window.electron?.updater?.install();
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
      sub: version ? `Version ${version}` : 'Tap to view',
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

  const handleButtonClick = () => {
    if (status === 'idle' || status === 'error') {
      handleCheck();
    } else if (status === 'available' || status === 'downloading' || status === 'ready') {
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
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
      </button>

      <UpdateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        version={version}
        releaseNotes={releaseNotes}
        releaseDate={releaseDate}
        status={status}
        percent={percent}
        errorMsg={errorMsg}
        onDownload={handleDownload}
        onInstall={handleInstall}
      />
    </>
  );
}
