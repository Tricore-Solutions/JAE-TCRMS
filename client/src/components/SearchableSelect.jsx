import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';

/**
 * SearchableSelect — a combobox that lets the user:
 *   • type to filter the option list
 *   • pick an existing option
 *   • add a brand-new value via an "Add …" button at the bottom
 *
 * Props
 *   value        – controlled value (string)
 *   onChange     – (newValue: string) => void
 *   options      – string[]  existing choices
 *   placeholder  – string   shown when empty
 *   disabled     – bool
 *   className    – extra classes for the trigger button
 *   addLabel     – prefix for the "add new" row  (default "Add")
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select or type…',
  disabled = false,
  className = '',
  addLabel = 'Add',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus the search input as soon as the dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const trimmed = query.trim();
  const filtered = trimmed
    ? options.filter(o => o.toLowerCase().includes(trimmed.toLowerCase()))
    : options;

  const exactMatch = options.some(o => o.toLowerCase() === trimmed.toLowerCase());
  const showAdd = trimmed && !exactMatch;

  const select = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const addNew = () => {
    if (!trimmed) return;
    onChange(trimmed);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 app-input px-3 py-2.5 text-left text-sm focus:outline-none focus:ring-2 focus:ring-[#1D72B8] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
          {/* Search box */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered.length === 1) select(filtered[0]);
                    else if (showAdd) addNew();
                  }
                  if (e.key === 'Escape') { setOpen(false); setQuery(''); }
                }}
                placeholder="Search or type a new title…"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              />
            </div>
          </div>

          {/* Option list */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && !showAdd && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No matches found</li>
            )}
            {filtered.map(opt => (
              <li key={opt}>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => select(opt)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-[#1D72B8] transition-colors ${
                    opt === value ? 'bg-blue-50 text-[#1D72B8] font-medium' : 'text-gray-700'
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>

          {/* Add new */}
          {showAdd && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={addNew}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1D72B8] hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                <Plus size={14} />
                {addLabel} "<span className="italic">{trimmed}</span>"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
