import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];

export default function DataTable({
  columns,
  data,
  loading,
  refreshing = false,
  emptyMessage = 'No records found',
  rowKey = 'id',
  onRowClick,
  rowClassName,
  pageSize: initialPageSize = 15,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultSort = null,
  tableClassName = '',
  stickyHeader = false,
  className = '',
}) {
  const [sort, setSort] = useState(defaultSort || { key: null, dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  useEffect(() => {
    setPage(1);
  }, [data, pageSize]);

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    return [...data].sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
    setPage(1);
  };

  const SortIcon = ({ col }) => {
    if (sort.key !== col.key) return <ChevronsUpDown size={12} className="text-gray-400" />;
    return sort.dir === 'asc' ? <ChevronUp size={12} className="text-[#1D72B8]" /> : <ChevronDown size={12} className="text-[#1D72B8]" />;
  };

  return (
    <div className={`flex flex-col ${stickyHeader ? 'min-h-0 flex-1' : ''} ${className}`.trim()}>
      <div className={`relative ${stickyHeader ? 'min-h-0 flex-1' : ''}`}>
        {refreshing && !loading && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-white/95 border border-gray-200 rounded-lg px-2.5 py-1 shadow-sm">
            <div className="w-3.5 h-3.5 border-2 border-[#1D72B8] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Updating…</span>
          </div>
        )}
        <div className={`${stickyHeader ? 'h-full max-h-full overflow-auto' : 'overflow-x-auto'} rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity ${refreshing && !loading ? 'opacity-60' : ''}`}>
          <table className={`min-w-full w-max text-sm ${tableClassName}`}>
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 ${stickyHeader ? 'shadow-[inset_0_-1px_0_0_#e5e7eb]' : ''} ${col.sortable !== false ? 'cursor-pointer hover:text-gray-900 select-none' : ''} ${col.className || ''}`}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable !== false && <SortIcon col={col} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <div className="w-6 h-6 border-2 border-[#1D72B8] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const rowBg = rowClassName?.(row) || 'hover:bg-gray-50';
                return (
                  <tr
                    key={row[rowKey]}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowBg}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 text-gray-700 ${rowBg} ${col.className || ''}`}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 px-1 flex-shrink-0">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              Showing {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
            </p>
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="whitespace-nowrap">Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>
          {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg transition-colors ${p === page ? 'bg-[#1D72B8] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
