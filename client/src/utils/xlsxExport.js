import * as XLSX from 'xlsx-js-style';

const HEADER_FILL = '1D72B8';
const HEADER_FONT_COLOR = 'FFFFFF';
const HEADER_FONT_SIZE = 12;
const HEADER_ROW_HEIGHT = 24;

const HEADER_CELL_STYLE = {
  font: { bold: true, sz: HEADER_FONT_SIZE, color: { rgb: HEADER_FONT_COLOR } },
  fill: { patternType: 'solid', fgColor: { rgb: HEADER_FILL } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};

export function styleHeaderRow(worksheet, colCount) {
  if (!worksheet || colCount <= 0) return;

  if (!worksheet['!rows']) worksheet['!rows'] = [];
  worksheet['!rows'][0] = { hpt: HEADER_ROW_HEIGHT };

  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!worksheet[addr]) continue;
    worksheet[addr].s = HEADER_CELL_STYLE;
  }
}

function autoSizeFromWidths(widths) {
  return widths.map(wch => ({ wch: Math.max(wch, 10) }));
}

export function autoSizeColumnsFromKeys(worksheet, data, keys) {
  const widths = keys.map(key =>
    Math.max(
      key.length,
      ...data.map(row => String(row[key] ?? '').length),
      10,
    ),
  );
  worksheet['!cols'] = autoSizeFromWidths(widths);
}

export function autoSizeColumnsFromDefinitions(worksheet, columns, rows) {
  const widths = columns.map(col =>
    Math.max(
      col.header.length,
      ...rows.map(row => String(row[col.key] ?? '').length),
      10,
    ),
  );
  worksheet['!cols'] = autoSizeFromWidths(widths);
}

export function jsonToStyledSheet(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    autoSizeColumnsFromKeys(worksheet, data, keys);
    styleHeaderRow(worksheet, keys.length);
  }
  return worksheet;
}

export function sheetFromRows(rows, columns) {
  const headers = columns.map(col => col.header);
  const aoa = [
    headers,
    ...rows.map(row => columns.map(col => row[col.key] ?? '')),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  autoSizeColumnsFromDefinitions(worksheet, columns, rows);
  styleHeaderRow(worksheet, columns.length);
  return worksheet;
}

export function exportJsonToXLSX(data, sheetName, filename) {
  if (!data.length) return;
  const worksheet = jsonToStyledSheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export function writeWorkbook(workbook, filename) {
  XLSX.writeFile(workbook, filename);
}

export { XLSX };
