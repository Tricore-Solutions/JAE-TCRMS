import { useState, useEffect, useRef } from 'react';
import { BarChart3, Factory, Tag, AlertTriangle, RefreshCw, FileDown, Sheet } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { reportsApi } from '../api';
import { useToast } from '../components/Toast';

const TAKE_AXIS = [1, 2, 3];
const TAKE_LABELS = { 1: '1st Take', 2: '2nd Take', 3: '3rd Take' };
const TAKE_BAR_COLORS = ['#1D72B8', '#5A9FD4', '#A8CCE8'];

function getTakeCount(data, month, take) {
  const monthData = data?.[month];
  if (!monthData) return 0;
  const key = String(take);
  return monthData[key] ?? monthData[take] ?? 0;
}

function buildTakesPerMonthRows({ months = [], data = {} } = {}) {
  return months.map(month => ({
    month,
    counts: TAKE_AXIS.map(take => getTakeCount(data, month, take)),
  }));
}

function mergeExpiringRecords(expiredItems, expiringItems) {
  const seen = new Set();
  return [...expiredItems, ...expiringItems]
    .filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => a.expiration_date.localeCompare(b.expiration_date));
}

async function fetchReportData() {
  const [catRes, facRes, exp10Res, expiredRes, tpmRes] = await Promise.all([
    reportsApi.byCategory(),
    reportsApi.byFactory(),
    reportsApi.expiring({ days: 10 }),
    reportsApi.expiring({ expired: true }),
    reportsApi.takesPerMonth(),
  ]);

  return {
    byCategory: catRes.data,
    byFactory: facRes.data,
    takesPerMonth: tpmRes.data,
    expiring: mergeExpiringRecords(expiredRes.data, exp10Res.data),
  };
}

function sheetFromRows(rows, columns) {
  const headers = columns.map(col => col.header);
  const aoa = [
    headers,
    ...rows.map(row => columns.map(col => row[col.key] ?? '')),
  ];
  return XLSX.utils.aoa_to_sheet(aoa);
}

function buildReportsWorkbook({ byCategory, byFactory, takesPerMonth, expiring }) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      byCategory.map(r => ({ category: r.category, count: r.count })),
      [{ key: 'category', header: 'Category' }, { key: 'count', header: 'Count' }],
    ),
    'By Category',
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      byFactory.map(r => ({
        factory: r.factory,
        employees: r.employee_count,
        trainingRecords: r.training_count,
      })),
      [
        { key: 'factory', header: 'Factory' },
        { key: 'employees', header: 'Employees' },
        { key: 'trainingRecords', header: 'Training Records' },
      ],
    ),
    'By Factory',
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      buildTakesPerMonthRows(takesPerMonth).map(({ month, counts }) => ({
        month,
        firstTake: counts[0],
        secondTake: counts[1],
        thirdTake: counts[2],
      })),
      [
        { key: 'month', header: 'Month' },
        { key: 'firstTake', header: '1st Take' },
        { key: 'secondTake', header: '2nd Take' },
        { key: 'thirdTake', header: '3rd Take' },
      ],
    ),
    'Takes per Month',
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      expiring.map(r => ({
        employee: r.full_name,
        training: r.title,
        factory: r.factory,
        team: r.team,
        expiryDate: r.expiration_date,
        status: r.cert_status,
      })),
      [
        { key: 'employee', header: 'Employee' },
        { key: 'training', header: 'Training' },
        { key: 'factory', header: 'Factory' },
        { key: 'team', header: 'Team' },
        { key: 'expiryDate', header: 'Expiry Date' },
        { key: 'status', header: 'Status' },
      ],
    ),
    'Certifications',
  );

  return wb;
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function drawTakesPerMonthTableInPdf(tpmData, layout) {
  let y = layout.y;
  const tpmRows = buildTakesPerMonthRows(tpmData);
  if (tpmRows.length === 0) return y;

  const tpmCols = [
    { label: 'Month', w: 52 },
    ...TAKE_AXIS.map(take => ({ label: TAKE_LABELS[take], w: 36 })),
  ];
  y = layout.tableHeader(tpmCols, y);
  layout.y = y;
  tpmRows.forEach(({ month, counts }, i) => {
    y = layout.tableRow(tpmCols, [month, ...counts], i % 2 === 1, y);
    layout.y = y;
  });

  return y + 4;
}
const BAR_ANIM_MS = 500;
const SIMPLE_BAR_ANIM_MS = 850;
const PAGE_ENTER_MS = 320;
const CHART_HEIGHT = 140;

function buildYTicks(max) {
  if (max <= 1) return [0, 1];
  const step = Math.max(1, Math.ceil(max / 4));
  const ticks = [0];
  for (let v = step; v < max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

function TakesPerMonthChart({ months, data }) {
  const [barsVisible, setBarsVisible] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);

  const maxCount = Math.max(
    1,
    ...months.flatMap(month => TAKE_AXIS.map(t => getTakeCount(data, month, t))),
  );
  const yTicks = buildYTicks(maxCount);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setBarsVisible(true);
      return;
    }

    setBarsVisible(false);
    const timer = setTimeout(() => setBarsVisible(true), PAGE_ENTER_MS + 80);
    return () => clearTimeout(timer);
  }, [months, data]);

  return (
    <div>
      <div className="flex flex-wrap gap-5 mb-10">
        {TAKE_AXIS.map((t, i) => (
          <div key={t} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TAKE_BAR_COLORS[i] }} />
            <span className="text-xs text-gray-500">{TAKE_LABELS[t]}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 sm:gap-3">
        <div className="relative w-6 sm:w-8 flex-shrink-0" style={{ height: CHART_HEIGHT }}>
          {yTicks.map(tick => (
            <span
              key={tick}
              className="absolute right-0 text-[11px] text-gray-400 tabular-nums -translate-y-1/2"
              style={{ bottom: `${(tick / maxCount) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0 overflow-visible">
          <div className="relative overflow-visible" style={{ height: CHART_HEIGHT }}>
            {yTicks.map(tick => (
              <div
                key={tick}
                className="absolute left-0 right-0 border-t border-dashed border-gray-200 pointer-events-none"
                style={{ bottom: `${(tick / maxCount) * 100}%` }}
              />
            ))}

            <div className="relative h-full flex items-end overflow-visible">
              {months.map((month, monthIdx) => (
                <div key={month} className="flex-1 flex items-end justify-center gap-1.5 sm:gap-2 h-full px-1 overflow-visible">
                  {TAKE_AXIS.map((t, i) => {
                    const val = getTakeCount(data, month, t);
                    const heightPct = val > 0 ? Math.max((val / maxCount) * 100, 6) : 0;
                    const delay = monthIdx * 50 + i * 35;
                    const barId = `${month}-${t}`;
                    return (
                      <div
                        key={t}
                        className={`relative h-full w-8 sm:w-9 flex flex-col justify-end overflow-visible ${val > 0 ? 'cursor-default' : ''}`}
                        onMouseEnter={val > 0 ? () => setHoveredBar(barId) : undefined}
                        onMouseLeave={val > 0 ? () => setHoveredBar(null) : undefined}
                      >
                        {hoveredBar === barId && (
                          <span
                            className="absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold text-gray-800 tabular-nums pointer-events-none leading-none"
                            style={{ bottom: `calc(${heightPct}% + 4px)` }}
                          >
                            {val}
                          </span>
                        )}
                        <div className="h-full bg-[#f2f2f2] rounded-t-md flex flex-col justify-end overflow-hidden">
                          {val > 0 && (
                            <div
                              className="w-full rounded-t-sm origin-bottom"
                              style={{
                                height: `${heightPct}%`,
                                backgroundColor: TAKE_BAR_COLORS[i],
                                transform: barsVisible ? 'scaleY(1)' : 'scaleY(0)',
                                transition: `transform ${BAR_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex mt-3">
            {months.map(month => (
              <div key={month} className="flex-1 text-center px-1">
                <span className="text-[11px] text-gray-500">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleBar({ label, value, max, color = 'bg-blue-500', animDelay = 0 }) {
  const [fillVisible, setFillVisible] = useState(false);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setFillVisible(true);
      return;
    }

    setFillVisible(false);
    const timer = setTimeout(() => setFillVisible(true), PAGE_ENTER_MS + 140 + animDelay);
    return () => clearTimeout(timer);
  }, [animDelay, pct]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-36 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{
            width: `${pct}%`,
            transform: fillVisible ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
            transition: `transform ${SIMPLE_BAR_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-8 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

export default function Reports() {
  const { show: toast } = useToast();
  const [byCategory, setByCategory] = useState([]);
  const [byFactory, setByFactory] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [takesPerMonth, setTakesPerMonth] = useState({ months: [], takes: [], data: {} });
  const [contentKey, setContentKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [expiringPage, setExpiringPage] = useState(1);
  const isInitialLoad = useRef(true);

  const EXPIRING_PAGE_SIZE = 15;
  const expiringTotalPages = Math.max(1, Math.ceil(expiring.length / EXPIRING_PAGE_SIZE));
  const expiringPageItems = expiring.slice(
    (expiringPage - 1) * EXPIRING_PAGE_SIZE,
    expiringPage * EXPIRING_PAGE_SIZE,
  );

  useEffect(() => {
    setExpiringPage(1);
  }, [expiring]);

  const load = async () => {
    const isRefresh = !isInitialLoad.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const reportData = await fetchReportData();
      setByCategory(reportData.byCategory);
      setByFactory(reportData.byFactory);
      setExpiring(reportData.expiring);
      setTakesPerMonth(reportData.takesPerMonth);
      if (isRefresh) setContentKey(k => k + 1);
    } catch {
      toast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isInitialLoad.current = false;
    }
  };

  useEffect(() => { load(); }, []);

  const exportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const reportData = await fetchReportData();

      setByCategory(reportData.byCategory);
      setByFactory(reportData.byFactory);
      setExpiring(reportData.expiring);
      setTakesPerMonth(reportData.takesPerMonth);

      const pdfCategory = reportData.byCategory;
      const pdfFactory = reportData.byFactory;
      const pdfTakesPerMonth = reportData.takesPerMonth;
      const pdfExpiring = reportData.expiring;

      const pdfMaxCategory = Math.max(...pdfCategory.map(r => r.count), 1);
      const pdfMaxFactory = Math.max(...pdfFactory.map(r => r.employee_count), 1);

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const PW = pdf.internal.pageSize.getWidth();
      const PH = pdf.internal.pageSize.getHeight();
      const M = 14;
      const usableW = PW - M * 2;

      const layout = {
        M,
        usableW,
        PH,
        y: M,
        checkPage(needed = 10) {
          if (this.y + needed > PH - M) {
            pdf.addPage('a4', 'landscape');
            this.y = M;
          }
        },
        tableHeader(cols, startY = this.y) {
          let rowY = startY;
          this.y = rowY;
          this.checkPage(8);
          rowY = this.y;
          pdf.setFillColor(245, 247, 250);
          pdf.rect(M, rowY, usableW, 7, 'F');
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(100);
          let x = M + 2;
          cols.forEach(({ label, w }) => {
            pdf.text(label.toUpperCase(), x, rowY + 4.8);
            x += w;
          });
          pdf.setTextColor(30);
          this.y = rowY + 7;
          return this.y;
        },
        tableRow(cols, vals, shade, startY = this.y) {
          let rowY = startY;
          this.y = rowY;
          this.checkPage(7);
          rowY = this.y;
          if (shade) {
            pdf.setFillColor(252, 252, 252);
            pdf.rect(M, rowY, usableW, 6.5, 'F');
          }
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          let x = M + 2;
          cols.forEach(({ w }, i) => {
            const raw = vals[i] != null ? String(vals[i]) : '—';
            const text = pdf.splitTextToSize(raw, w - 2)[0];
            pdf.text(text, x, rowY + 4.5);
            x += w;
          });
          pdf.setDrawColor(230);
          pdf.line(M, rowY + 6.5, M + usableW, rowY + 6.5);
          this.y = rowY + 6.5;
          return this.y;
        },
      };

      const sectionTitle = (text) => {
        layout.checkPage(14);
        pdf.setFillColor(240, 245, 255);
        pdf.roundedRect(M, layout.y, usableW, 8, 1, 1, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(29, 114, 184);
        pdf.text(text, M + 3, layout.y + 5.5);
        pdf.setTextColor(0);
        layout.y += 11;
      };

      const drawBarRow = (label, value, max, colorHex) => {
        layout.checkPage(8);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60);
        pdf.text(String(label).slice(0, 36), M, layout.y + 3.5);

        const barX = M + 56;
        const barW = usableW - 56 - 16;
        const fill = max > 0 ? (value / max) * barW : 0;

        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(barX, layout.y + 1, barW, 4, 1, 1, 'F');

        if (fill > 0) {
          const [r, g, b] = hexToRgb(colorHex);
          pdf.setFillColor(r, g, b);
          pdf.roundedRect(barX, layout.y + 1, fill, 4, 1, 1, 'F');
        }

        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30);
        pdf.text(String(value), barX + barW + 3, layout.y + 3.8);
        layout.y += 8;
      };

      // ── Cover / Header ──────────────────────────────────────────────
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(29, 114, 184);
      pdf.text('JAE TCRMS', M, layout.y + 6);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80);
      pdf.text('Training & Certification Report', M, layout.y + 13);
      pdf.setFontSize(8.5);
      pdf.setTextColor(150);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, M, layout.y + 19);
      pdf.setDrawColor(29, 114, 184);
      pdf.setLineWidth(0.5);
      pdf.line(M, layout.y + 22, M + usableW, layout.y + 22);
      layout.y += 28;

      // ── Training by Category ────────────────────────────────────────
      const catColors = ['#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#06B6D4'];
      sectionTitle('Training by Category');
      if (pdfCategory.length === 0) {
        pdf.setFontSize(8.5); pdf.setTextColor(150);
        pdf.text('No data available.', M + 2, layout.y + 4); layout.y += 10;
      } else {
        pdfCategory.forEach((row, i) => drawBarRow(row.category, row.count, pdfMaxCategory, catColors[i % catColors.length]));
      }
      layout.y += 4;

      // ── Employees by Factory ────────────────────────────────────────
      sectionTitle('Employees by Factory');
      if (pdfFactory.length === 0) {
        pdf.setFontSize(8.5); pdf.setTextColor(150);
        pdf.text('No data available.', M + 2, layout.y + 4); layout.y += 10;
      } else {
        pdfFactory.forEach(row => {
          drawBarRow(row.factory, row.employee_count, pdfMaxFactory, '#22C55E');
          layout.checkPage(5);
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(130);
          pdf.text(`${row.training_count} training records`, M + 58, layout.y - 3);
          pdf.setTextColor(30);
        });
      }
      layout.y += 4;

      // ── Takes per Month ─────────────────────────────────────────────
      sectionTitle('Takes per Month');
      if (!pdfTakesPerMonth.months?.length) {
        pdf.setFontSize(8.5); pdf.setTextColor(150);
        pdf.text('No data available.', M + 2, layout.y + 4); layout.y += 10;
      } else {
        layout.y = drawTakesPerMonthTableInPdf(pdfTakesPerMonth, layout);
      }

      // ── Certifications Requiring Attention ──────────────────────────
      sectionTitle('Certifications Requiring Attention (next 10 days + expired)');
      if (pdfExpiring.length === 0) {
        pdf.setFontSize(8.5); pdf.setTextColor(150);
        pdf.text('No expiring or expired certifications found.', M + 2, layout.y + 4); layout.y += 10;
      } else {
        const expCols = [
          { label: 'Employee', w: 62 },
          { label: 'Training', w: 78 },
          { label: 'Factory/Team', w: 58 },
          { label: 'Expiry', w: 32 },
          { label: 'Status', w: 28 },
        ];
        layout.tableHeader(expCols);
        pdfExpiring.forEach((item, i) => {
          layout.tableRow(expCols, [
            item.full_name,
            item.title,
            `${item.factory} / ${item.team}`,
            item.expiration_date,
            item.cert_status,
          ], i % 2 === 1);
        });
      }

      // Page numbers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        pdf.setPage(p);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(160);
        pdf.text(`Page ${p} of ${pageCount}`, PW - M, PH - 6, { align: 'right' });
        pdf.text('JAE TCRMS - Confidential', M, PH - 6);
      }

      pdf.save(`JAE-TCRMS-Reports-${new Date().toISOString().split('T')[0]}.pdf`);
      toast('PDF exported successfully.', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      toast(err?.response?.data?.message || err?.message || 'Failed to export PDF.', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  const exportExcel = async () => {
    if (exportingXlsx) return;
    setExportingXlsx(true);
    try {
      const reportData = await fetchReportData();

      setByCategory(reportData.byCategory);
      setByFactory(reportData.byFactory);
      setExpiring(reportData.expiring);
      setTakesPerMonth(reportData.takesPerMonth);

      const wb = buildReportsWorkbook(reportData);
      XLSX.writeFile(wb, `JAE-TCRMS-Reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast('Excel exported successfully.', 'success');
    } catch (err) {
      console.error('Excel export error:', err);
      toast(err?.response?.data?.message || err?.message || 'Failed to export Excel.', 'error');
    } finally {
      setExportingXlsx(false);
    }
  };

  const maxCategory = Math.max(...byCategory.map(r => r.count), 1);
  const maxFactory = Math.max(...byFactory.map(r => r.employee_count), 1);

  const categoryColors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500'];

  return (
    <Layout
      title="Reports"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            disabled={loading || exportingXlsx || byCategory.length === 0}
            className="flex items-center gap-2 text-gray-500 hover:text-green-700 text-sm px-3 py-2 rounded-lg hover:bg-green-50 border border-gray-200 hover:border-green-200 transition-colors disabled:opacity-40"
            title="Export raw data to Excel"
          >
            <Sheet size={14} />
            {exportingXlsx ? 'Exporting Excel…' : 'Export Excel'}
          </button>
          <button
            onClick={exportPdf}
            disabled={loading || exportingPdf || byCategory.length === 0}
            className="flex items-center gap-2 text-gray-500 hover:text-red-700 text-sm px-3 py-2 rounded-lg hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors disabled:opacity-40"
            title="Export charts to PDF"
          >
            <FileDown size={14} />
            {exportingPdf ? 'Exporting PDF…' : 'Export PDF'}
          </button>
          <button onClick={load} disabled={loading || refreshing} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40">
            <RefreshCw size={14} className={loading || refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      }
    >
      <div key={contentKey} className={contentKey > 0 ? 'page-enter' : undefined}>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* By Category */}
        <div className="app-panel p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Tag size={16} className="text-[#1D72B8]" /> Training by Category
          </h3>
          {byCategory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No data available</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((row, i) => (
                <SimpleBar
                  key={row.category}
                  label={row.category}
                  value={row.count}
                  max={maxCategory}
                  color={categoryColors[i % categoryColors.length]}
                  animDelay={i * 50}
                />
              ))}
            </div>
          )}
        </div>

        {/* By Factory */}
        <div className="app-panel p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Factory size={16} className="text-green-600" /> Employees by Factory
          </h3>
          {byFactory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No data available</p>
          ) : (
            <div className="space-y-3">
              {byFactory.map((row, i) => (
                <div key={row.factory}>
                  <SimpleBar
                    label={row.factory}
                    value={row.employee_count}
                    max={maxFactory}
                    color="bg-green-500"
                    animDelay={i * 60}
                  />
                  <p className="text-xs text-gray-500 mt-0.5 ml-[156px]">{row.training_count} training records</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Takes per Month — X: Month, Y: Count */}
      <div className="app-panel p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#1D72B8]" /> Takes per Month
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Training records logged per month, broken down by attempt number.
        </p>
        {!takesPerMonth.months || takesPerMonth.months.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No data available</p>
        ) : (
          <>
            <TakesPerMonthChart
              months={takesPerMonth.months}
              data={takesPerMonth.data}
            />
            <div className="mt-8 overflow-x-auto border-t border-gray-200 pt-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase">Month</th>
                    {TAKE_AXIS.map(take => (
                      <th key={take} className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase">
                        {TAKE_LABELS[take]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {buildTakesPerMonthRows(takesPerMonth).map(({ month, counts }) => (
                    <tr key={month}>
                      <td className="py-2 text-gray-700 font-medium">{month}</td>
                      {counts.map((count, i) => (
                        <td key={i} className="py-2 text-right text-gray-900 tabular-nums">{count}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Expiring certifications list */}
      <div className="app-panel p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" /> Certifications Requiring Attention (next 10 days + expired)
        </h3>
        {expiring.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No expiring or expired certifications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Training</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Factory / Team</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Expiry Date</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expiringPageItems.map(item => (
                  <tr key={item.id} className="hover:bg-white">
                    <td className="py-3 text-gray-900 font-medium">{item.full_name}</td>
                    <td className="py-3 text-gray-700">{item.title}</td>
                    <td className="py-3 text-gray-500 text-xs">{item.factory} / {item.team}</td>
                    <td className="py-3 text-gray-700">{item.expiration_date}</td>
                    <td className="py-3"><StatusBadge status={item.cert_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-xs text-gray-500">
                Showing {(expiringPage - 1) * EXPIRING_PAGE_SIZE + 1}–{Math.min(expiringPage * EXPIRING_PAGE_SIZE, expiring.length)} of {expiring.length}
              </p>
              {expiringTotalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpiringPage(p => Math.max(1, p - 1))}
                    disabled={expiringPage === 1}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, expiringTotalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(expiringPage - 2, expiringTotalPages - 4)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setExpiringPage(p)}
                        className={`w-8 h-8 text-xs rounded-lg transition-colors ${p === expiringPage ? 'bg-[#1D72B8] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setExpiringPage(p => Math.min(expiringTotalPages, p + 1))}
                    disabled={expiringPage === expiringTotalPages}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}
