'use client';

import { useState, useCallback, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';

export type CellData = string | number | boolean | null;

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  numFormat?: 'general' | 'number' | 'currency' | 'percent' | 'date';
  bgColor?: string;
  textColor?: string;
}

export interface SheetData {
  cells: Record<string, CellData>;     // "R1C1" -> value
  formulas: Record<string, string>;    // "R1C1" -> formula string
  formats: Record<string, CellFormat>; // "R1C1" -> format
  colWidths: Record<number, number>;   // col -> px width
  rowHeights: Record<number, number>;  // row -> px height
  name: string;
}

export interface SpreadsheetGridHandle {
  getActiveCell: () => { row: number; col: number };
  setActiveCellValue: (value: string) => void;
  getFormula: (row: number, col: number) => string;
  getValue: (row: number, col: number) => CellData;
  insertRow: (afterRow: number) => void;
  deleteRow: (row: number) => void;
  insertCol: (afterCol: number) => void;
  deleteCol: (col: number) => void;
  setFormat: (format: Partial<CellFormat>) => void;
  copySelection: () => void;
  pasteSelection: () => void;
  getSheetData: () => SheetData;
  loadSheetData: (data: SheetData) => void;
  clearRange: () => void;
}

interface SpreadsheetGridProps {
  initialData?: (CellData)[][];
  onCellSelect?: (row: number, col: number, formula: string, value: CellData) => void;
  onDataChange?: (cells: Record<string, CellData>, formulas: Record<string, string>) => void;
  readOnly?: boolean;
  rows?: number;
  cols?: number;
}

const DEFAULT_COL_WIDTH = 120;
const DEFAULT_ROW_HEIGHT = 24;
const HEADER_HEIGHT = 26;
const ROW_HEADER_WIDTH = 52;

function colToLetter(col: number): string {
  let letter = '';
  let n = col;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

function cellKey(row: number, col: number) {
  return `R${row}C${col}`;
}

function formatValue(value: CellData, fmt?: CellFormat): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';

  const numFmt = fmt?.numFormat || 'general';
  if (typeof value === 'number') {
    if (numFmt === 'currency') return '$' + value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (numFmt === 'percent') return (value * 100).toFixed(1) + '%';
    if (numFmt === 'number') return value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    if (numFmt === 'date') {
      const d = new Date(value * 86400000);
      return d.toLocaleDateString('es-PE');
    }
    return String(value);
  }
  return String(value);
}

export const SpreadsheetGrid = forwardRef<SpreadsheetGridHandle, SpreadsheetGridProps>(function SpreadsheetGrid(
  { initialData, onCellSelect, onDataChange, readOnly = false, rows: initRows = 100, cols: initCols = 26 },
  ref
) {
  const [cells, setCells] = useState<Record<string, CellData>>(() => {
    const init: Record<string, CellData> = {};
    if (initialData) {
      initialData.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val !== null && val !== undefined) init[cellKey(r, c)] = val;
        });
      });
    }
    return init;
  });
  const [formulas, setFormulas] = useState<Record<string, string>>({});
  const [formats, setFormats] = useState<Record<string, CellFormat>>({});
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const [rowCount] = useState(initRows);
  const [colCount] = useState(initCols);

  const [selection, setSelection] = useState({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [clipboard, setClipboard] = useState<{ cells: Record<string, CellData>; fmts: Record<string, CellFormat>; rows: number; cols: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizingCol = useRef<{ col: number; startX: number; startWidth: number } | null>(null);
  const isDraggingSelection = useRef(false);

  // Stop drag selection on mouse up anywhere in the document
  useEffect(() => {
    const onMouseUp = () => { isDraggingSelection.current = false; };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [contextMenu]);

  // Update data when initialData prop changes (sheet switch)
  useEffect(() => {
    if (!initialData) return;
    const init: Record<string, CellData> = {};
    initialData.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== null && val !== undefined) init[cellKey(r, c)] = val;
      });
    });
    setCells(init);
    setFormulas({});
    setFormats({});
  }, [initialData]);

  const getColWidth = useCallback((col: number) => colWidths[col] ?? DEFAULT_COL_WIDTH, [colWidths]);

  // Compute column offsets for efficient rendering
  const colOffsets = useMemo(() => {
    const offsets: number[] = [];
    let x = ROW_HEADER_WIDTH;
    for (let c = 0; c < colCount; c++) {
      offsets.push(x);
      x += getColWidth(c);
    }
    offsets.push(x); // total width sentinel
    return offsets;
  }, [colCount, colWidths, getColWidth]);

  const totalWidth = colOffsets[colCount] ?? 0;
  const totalHeight = rowCount * DEFAULT_ROW_HEIGHT + HEADER_HEIGHT;

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const key = cellKey(editingCell.row, editingCell.col);
    if (editValue.startsWith('=')) {
      setFormulas(prev => ({ ...prev, [key]: editValue }));
      // For now store formula result as raw value (HyperFormula integration point)
      setCells(prev => {
        const next = { ...prev, [key]: editValue };
        onDataChange?.(next, formulas);
        return next;
      });
    } else {
      const num = parseFloat(editValue);
      const val: CellData = editValue === '' ? null : !isNaN(num) ? num : editValue;
      setFormulas(prev => { const n = { ...prev }; delete n[key]; return n; });
      setCells(prev => {
        const next = { ...prev, [key]: val };
        onDataChange?.(next, formulas);
        return next;
      });
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, formulas, onDataChange]);

  const startEdit = useCallback((row: number, col: number) => {
    if (readOnly) return;
    const key = cellKey(row, col);
    const f = formulas[key];
    const v = cells[key];
    setEditingCell({ row, col });
    setEditValue(f ?? (v !== null && v !== undefined ? String(v) : ''));
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
  }, [readOnly, formulas, cells]);

  const handleCellMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    if (e.button !== 0) return;
    if (editingCell) commitEdit();
    isDraggingSelection.current = true;
    if (e.shiftKey) {
      setSelection(prev => ({ ...prev, endRow: row, endCol: col }));
    } else {
      setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
      const key = cellKey(row, col);
      onCellSelect?.(row, col, formulas[key] ?? '', cells[key] ?? null);
    }
    containerRef.current?.focus();
    e.preventDefault();
  }, [editingCell, commitEdit, formulas, cells, onCellSelect]);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!isDraggingSelection.current) return;
    setSelection(prev => ({ ...prev, endRow: row, endCol: col }));
  }, []);

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    startEdit(row, col);
  }, [startEdit]);

  const handleGridKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { startRow, startCol } = selection;

    if (editingCell) {
      if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); return; }
      if (e.key === 'Enter') {
        e.preventDefault(); commitEdit();
        const nr = Math.min(startRow + 1, rowCount - 1);
        setSelection({ startRow: nr, startCol, endRow: nr, endCol: startCol });
        onCellSelect?.(nr, startCol, formulas[cellKey(nr, startCol)] ?? '', cells[cellKey(nr, startCol)] ?? null);
      }
      if (e.key === 'Tab') {
        e.preventDefault(); commitEdit();
        const nc = e.shiftKey ? Math.max(startCol - 1, 0) : Math.min(startCol + 1, colCount - 1);
        setSelection({ startRow, startCol: nc, endRow: startRow, endCol: nc });
      }
      return;
    }

    // Navigation
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Tab'].includes(e.key)) {
      e.preventDefault();
      let nr = startRow, nc = startCol;
      if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) nr = Math.max(0, startRow - 1);
      else if (e.key === 'ArrowDown' || e.key === 'Enter') nr = Math.min(rowCount - 1, startRow + 1);
      else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) nc = Math.max(0, startCol - 1);
      else if (e.key === 'ArrowRight' || e.key === 'Tab') nc = Math.min(colCount - 1, startCol + 1);
      if (e.shiftKey && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        setSelection(prev => ({ ...prev, endRow: nr, endCol: nc }));
      } else {
        setSelection({ startRow: nr, startCol: nc, endRow: nr, endCol: nc });
        onCellSelect?.(nr, nc, formulas[cellKey(nr, nc)] ?? '', cells[cellKey(nr, nc)] ?? null);
      }
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const minR = Math.min(selection.startRow, selection.endRow);
      const maxR = Math.max(selection.startRow, selection.endRow);
      const minC = Math.min(selection.startCol, selection.endCol);
      const maxC = Math.max(selection.startCol, selection.endCol);
      setCells(prev => {
        const n = { ...prev };
        for (let r = minR; r <= maxR; r++) for (let c = minC; c <= maxC; c++) delete n[cellKey(r, c)];
        return n;
      });
      return;
    }
    if (e.key === 'F2') { startEdit(startRow, startCol); return; }
    if (e.ctrlKey && e.key === 'c') { handleCopy(); return; }
    if (e.ctrlKey && e.key === 'x') { handleCut(); return; }
    if (e.ctrlKey && e.key === 'v') { handlePaste(); return; }
    if (e.ctrlKey && e.key === 'b') { applyFormat({ bold: !(formats[cellKey(startRow, startCol)]?.bold) }); return; }
    if (e.ctrlKey && e.key === 'i') { applyFormat({ italic: !(formats[cellKey(startRow, startCol)]?.italic) }); return; }

    // Start typing to edit
    if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
      setEditingCell({ row: startRow, col: startCol });
      setEditValue(e.key);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editingCell, selection, rowCount, colCount, commitEdit, formulas, cells, onCellSelect, startEdit, formats]);

  const handleCopy = useCallback(() => {
    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.max(selection.startRow, selection.endRow);
    const minC = Math.min(selection.startCol, selection.endCol);
    const maxC = Math.max(selection.startCol, selection.endCol);
    const clip: Record<string, CellData> = {};
    const clipFmts: Record<string, CellFormat> = {};
    for (let r = minR; r <= maxR; r++)
      for (let c = minC; c <= maxC; c++) {
        clip[cellKey(r - minR, c - minC)] = cells[cellKey(r, c)] ?? null;
        if (formats[cellKey(r, c)]) clipFmts[cellKey(r - minR, c - minC)] = formats[cellKey(r, c)];
      }
    setClipboard({ cells: clip, fmts: clipFmts, rows: maxR - minR + 1, cols: maxC - minC + 1 });
  }, [selection, cells, formats]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    const { startRow, startCol } = selection;
    setCells(prev => {
      const next = { ...prev };
      for (let r = 0; r < clipboard.rows; r++)
        for (let c = 0; c < clipboard.cols; c++) {
          const val = clipboard.cells[cellKey(r, c)];
          if (val !== undefined) next[cellKey(startRow + r, startCol + c)] = val;
        }
      return next;
    });
    setFormats(prev => {
      const next = { ...prev };
      for (let r = 0; r < clipboard.rows; r++)
        for (let c = 0; c < clipboard.cols; c++) {
          const fmt = clipboard.fmts[cellKey(r, c)];
          if (fmt) next[cellKey(startRow + r, startCol + c)] = fmt;
        }
      return next;
    });
  }, [clipboard, selection]);

  const handleCut = useCallback(() => {
    handleCopy();
    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.max(selection.startRow, selection.endRow);
    const minC = Math.min(selection.startCol, selection.endCol);
    const maxC = Math.max(selection.startCol, selection.endCol);
    setCells(prev => {
      const n = { ...prev };
      for (let r = minR; r <= maxR; r++) for (let c = minC; c <= maxC; c++) delete n[cellKey(r, c)];
      return n;
    });
  }, [handleCopy, selection]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const applyFormat = useCallback((fmt: Partial<CellFormat>) => {
    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.max(selection.startRow, selection.endRow);
    const minC = Math.min(selection.startCol, selection.endCol);
    const maxC = Math.max(selection.startCol, selection.endCol);
    setFormats(prev => {
      const next = { ...prev };
      for (let r = minR; r <= maxR; r++)
        for (let c = minC; c <= maxC; c++) {
          const key = cellKey(r, c);
          next[key] = { ...(next[key] || {}), ...fmt };
        }
      return next;
    });
  }, [selection]);

  // Column resize
  const startColResize = useCallback((e: React.MouseEvent, col: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingCol.current = { col, startX: e.clientX, startWidth: getColWidth(col) };
    const onMove = (ev: MouseEvent) => {
      if (!resizingCol.current) return;
      const delta = ev.clientX - resizingCol.current.startX;
      const newWidth = Math.max(40, resizingCol.current.startWidth + delta);
      setColWidths(prev => ({ ...prev, [resizingCol.current!.col]: newWidth }));
    };
    const onUp = () => {
      resizingCol.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [getColWidth]);

  const isInSelection = useCallback((row: number, col: number) => {
    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.max(selection.startRow, selection.endRow);
    const minC = Math.min(selection.startCol, selection.endCol);
    const maxC = Math.max(selection.startCol, selection.endCol);
    return row >= minR && row <= maxR && col >= minC && col <= maxC;
  }, [selection]);

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    getActiveCell: () => ({ row: selection.startRow, col: selection.startCol }),
    setActiveCellValue: (value: string) => {
      const { startRow, startCol } = selection;
      const key = cellKey(startRow, startCol);
      if (value.startsWith('=')) {
        setFormulas(prev => ({ ...prev, [key]: value }));
        setCells(prev => ({ ...prev, [key]: value }));
      } else {
        const num = parseFloat(value);
        setCells(prev => ({ ...prev, [key]: value === '' ? null : !isNaN(num) ? num : value }));
        setFormulas(prev => { const n = { ...prev }; delete n[key]; return n; });
      }
    },
    getFormula: (row, col) => formulas[cellKey(row, col)] ?? '',
    getValue: (row, col) => cells[cellKey(row, col)] ?? null,
    insertRow: (afterRow: number) => {
      setCells(prev => {
        const next: Record<string, CellData> = {};
        Object.entries(prev).forEach(([k, v]) => {
          const m = k.match(/R(\d+)C(\d+)/);
          if (!m) return;
          const r = parseInt(m[1]), c = parseInt(m[2]);
          if (r > afterRow) next[cellKey(r + 1, c)] = v;
          else next[k] = v;
        });
        return next;
      });
    },
    deleteRow: (row: number) => {
      setCells(prev => {
        const next: Record<string, CellData> = {};
        Object.entries(prev).forEach(([k, v]) => {
          const m = k.match(/R(\d+)C(\d+)/);
          if (!m) return;
          const r = parseInt(m[1]), c = parseInt(m[2]);
          if (r < row) next[k] = v;
          else if (r > row) next[cellKey(r - 1, c)] = v;
        });
        return next;
      });
    },
    insertCol: (afterCol: number) => {
      setCells(prev => {
        const next: Record<string, CellData> = {};
        Object.entries(prev).forEach(([k, v]) => {
          const m = k.match(/R(\d+)C(\d+)/);
          if (!m) return;
          const r = parseInt(m[1]), c = parseInt(m[2]);
          if (c > afterCol) next[cellKey(r, c + 1)] = v;
          else next[k] = v;
        });
        return next;
      });
    },
    deleteCol: (col: number) => {
      setCells(prev => {
        const next: Record<string, CellData> = {};
        Object.entries(prev).forEach(([k, v]) => {
          const m = k.match(/R(\d+)C(\d+)/);
          if (!m) return;
          const r = parseInt(m[1]), c = parseInt(m[2]);
          if (c < col) next[k] = v;
          else if (c > col) next[cellKey(r, c - 1)] = v;
        });
        return next;
      });
    },
    setFormat: (fmt: Partial<CellFormat>) => applyFormat(fmt),
    copySelection: handleCopy,
    pasteSelection: handlePaste,
    getSheetData: () => ({ cells, formulas, formats, colWidths, rowHeights: {}, name: 'Sheet1' }),
    loadSheetData: (data: SheetData) => {
      setCells(data.cells);
      setFormulas(data.formulas);
      setFormats(data.formats);
      setColWidths(data.colWidths);
    },
    clearRange: () => {
      const minR = Math.min(selection.startRow, selection.endRow);
      const maxR = Math.max(selection.startRow, selection.endRow);
      const minC = Math.min(selection.startCol, selection.endCol);
      const maxC = Math.max(selection.startCol, selection.endCol);
      setCells(prev => {
        const n = { ...prev };
        for (let r = minR; r <= maxR; r++)
          for (let c = minC; c <= maxC; c++) delete n[cellKey(r, c)];
        return n;
      });
    },
  }), [selection, formulas, cells, formats, colWidths, applyFormat, handleCopy, handlePaste]);

  // Render only visible cells
  const [viewportRows, setViewportRows] = useState({ start: 0, end: 40 });
  const [viewportCols, setViewportCols] = useState({ start: 0, end: 15 });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollTop = el.scrollTop;
    const scrollLeft = el.scrollLeft;
    const startRow = Math.max(0, Math.floor(scrollTop / DEFAULT_ROW_HEIGHT) - 2);
    const endRow = Math.min(rowCount, startRow + Math.ceil(el.clientHeight / DEFAULT_ROW_HEIGHT) + 4);
    // Find start col from offsets
    let startCol = 0;
    for (let c = 0; c < colCount; c++) {
      if (colOffsets[c] - ROW_HEADER_WIDTH > scrollLeft) { startCol = Math.max(0, c - 1); break; }
    }
    const endCol = Math.min(colCount, startCol + 15);
    setViewportRows({ start: startRow, end: endRow });
    setViewportCols({ start: startCol, end: endCol });
  }, [rowCount, colCount, colOffsets]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto select-none focus:outline-none"
      style={{ height: '100%', width: '100%', backgroundColor: 'var(--bg-surface)' }}
      tabIndex={0}
      onKeyDown={handleGridKeyDown}
      onScroll={handleScroll}
      onContextMenu={handleContextMenu}
    >
      <div style={{ width: totalWidth, height: totalHeight, position: 'relative' }}>
        {/* Sticky column headers */}
        <div
          className="sticky top-0 z-20 flex"
          style={{ height: HEADER_HEIGHT }}
        >
          {/* Corner */}
          <div
            className="flex-shrink-0 border-b border-r border-[var(--border-default)]"
            style={{ width: ROW_HEADER_WIDTH, height: HEADER_HEIGHT, backgroundColor: 'var(--bg-base)' }}
          />
          {/* Column headers */}
          {Array.from({ length: colCount }, (_, c) => (
            <div
              key={c}
              className="relative flex-shrink-0 flex items-center justify-center text-xs font-medium border-b border-r border-[var(--border-default)] cursor-pointer"
              style={{
                width: getColWidth(c), height: HEADER_HEIGHT,
                backgroundColor: (c >= Math.min(selection.startCol, selection.endCol) && c <= Math.max(selection.startCol, selection.endCol))
                  ? 'var(--bg-selected)' : 'var(--bg-base)',
                color: (c >= Math.min(selection.startCol, selection.endCol) && c <= Math.max(selection.startCol, selection.endCol))
                  ? 'var(--color-primary)' : 'var(--text-secondary)',
              }}
              onClick={(e) => {
                if (editingCell) commitEdit();
                if (e.shiftKey) setSelection(prev => ({ ...prev, endRow: rowCount - 1, endCol: c }));
                else setSelection({ startRow: 0, startCol: c, endRow: rowCount - 1, endCol: c });
              }}
            >
              {colToLetter(c)}
              {/* Resize handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-redwood-primary z-10"
                onMouseDown={(e) => startColResize(e, c)}
              />
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rowCount }, (_, r) => {
          if (r < viewportRows.start || r > viewportRows.end) {
            return (
              <div
                key={r}
                style={{
                  position: 'absolute',
                  top: HEADER_HEIGHT + r * DEFAULT_ROW_HEIGHT,
                  left: 0,
                  width: totalWidth,
                  height: DEFAULT_ROW_HEIGHT,
                }}
              />
            );
          }
          const isRowSelected = r >= Math.min(selection.startRow, selection.endRow) && r <= Math.max(selection.startRow, selection.endRow);
          return (
            <div
              key={r}
              className="flex absolute"
              style={{
                top: HEADER_HEIGHT + r * DEFAULT_ROW_HEIGHT,
                left: 0,
                height: DEFAULT_ROW_HEIGHT,
                width: totalWidth,
              }}
            >
              {/* Row header */}
              <div
                className="flex-shrink-0 flex items-center justify-center text-xs font-medium border-b border-r border-[var(--border-default)] sticky left-0 z-10 cursor-pointer"
                style={{
                  width: ROW_HEADER_WIDTH, height: DEFAULT_ROW_HEIGHT,
                  backgroundColor: isRowSelected ? 'var(--bg-selected)' : 'var(--bg-base)',
                  color: isRowSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                }}
                onClick={(e) => {
                  if (editingCell) commitEdit();
                  if (e.shiftKey) setSelection(prev => ({ ...prev, endRow: r, endCol: colCount - 1 }));
                  else setSelection({ startRow: r, startCol: 0, endRow: r, endCol: colCount - 1 });
                }}
              >
                {r + 1}
              </div>
              {/* Cells */}
              {Array.from({ length: colCount }, (_, c) => {
                if (c < viewportCols.start || c > viewportCols.end) {
                  return (
                    <div
                      key={c}
                      className="flex-shrink-0 border-b border-r border-[var(--border-default)]"
                      style={{ width: getColWidth(c), height: DEFAULT_ROW_HEIGHT, backgroundColor: 'var(--bg-surface)' }}
                    />
                  );
                }
                const key = cellKey(r, c);
                const value = cells[key];
                const fmt = formats[key];
                const isSel = isInSelection(r, c);
                const isActive = selection.startRow === r && selection.startCol === c && selection.endRow === r && selection.endCol === c;
                const isEdit = editingCell?.row === r && editingCell?.col === c;
                const displayVal = formatValue(value, fmt);

                return (
                  <div
                    key={c}
                    className="flex-shrink-0 relative border-b border-r border-[var(--border-default)] overflow-hidden"
                    style={{
                      width: getColWidth(c),
                      height: DEFAULT_ROW_HEIGHT,
                      backgroundColor: fmt?.bgColor || (isSel ? (isActive ? 'var(--bg-selected)' : 'color-mix(in srgb, var(--bg-selected) 30%, transparent)') : 'var(--bg-surface)'),
                    }}
                    onMouseDown={(e) => handleCellMouseDown(e, r, c)}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                    onDoubleClick={() => handleCellDoubleClick(r, c)}
                  >
                    {isEdit ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        className="w-full h-full px-1.5 text-xs border-none outline-none z-20"
                        style={{ fontSize: 12, backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <div
                        className="w-full h-full px-1.5 flex items-center text-xs overflow-hidden"
                        style={{
                          fontWeight: fmt?.bold ? 700 : 400,
                          fontStyle: fmt?.italic ? 'italic' : 'normal',
                          justifyContent: fmt?.align === 'center' ? 'center' : fmt?.align === 'right' ? 'flex-end' : 'flex-start',
                          color: fmt?.textColor || 'var(--text-primary)',
                          fontSize: 12,
                        }}
                      >
                        <span className="truncate">{displayVal}</span>
                      </div>
                    )}
                    {/* Active cell border */}
                    {isActive && !isEdit && (
                      <div className="absolute inset-0 border-2 border-redwood-primary pointer-events-none z-10" />
                    )}
                    {/* Selection highlight */}
                    {isSel && !isActive && (
                      <div className="absolute inset-0 bg-redwood-primary/8 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Custom context menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] min-w-[200px] rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] py-1 text-[13px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          {[
            { label: 'Cortar', shortcut: 'Ctrl+X', action: () => { handleCut(); setContextMenu(null); } },
            { label: 'Copiar', shortcut: 'Ctrl+C', action: () => { handleCopy(); setContextMenu(null); } },
            { label: 'Pegar', shortcut: 'Ctrl+V', action: () => { handlePaste(); setContextMenu(null); }, disabled: !clipboard },
            null,
            { label: 'Insertar fila', shortcut: '', action: () => { const cell = { row: selection.startRow, col: selection.startCol }; setCells(prev => { const next: Record<string, CellData> = {}; Object.entries(prev).forEach(([k, v]) => { const m = k.match(/R(\d+)C(\d+)/); if (!m) return; const r = parseInt(m[1]), c = parseInt(m[2]); if (r > cell.row) next[cellKey(r + 1, c)] = v; else next[k] = v; }); return next; }); setContextMenu(null); } },
            { label: 'Eliminar fila', shortcut: '', action: () => { const cell = { row: selection.startRow, col: selection.startCol }; setCells(prev => { const next: Record<string, CellData> = {}; Object.entries(prev).forEach(([k, v]) => { const m = k.match(/R(\d+)C(\d+)/); if (!m) return; const r = parseInt(m[1]), c = parseInt(m[2]); if (r < cell.row) next[k] = v; else if (r > cell.row) next[cellKey(r - 1, c)] = v; }); return next; }); setContextMenu(null); } },
            null,
            { label: 'Limpiar celda(s)', shortcut: 'Supr', action: () => { const minR = Math.min(selection.startRow, selection.endRow), maxR = Math.max(selection.startRow, selection.endRow), minC = Math.min(selection.startCol, selection.endCol), maxC = Math.max(selection.startCol, selection.endCol); setCells(prev => { const n = { ...prev }; for (let r = minR; r <= maxR; r++) for (let c = minC; c <= maxC; c++) delete n[cellKey(r, c)]; return n; }); setContextMenu(null); } },
            null,
            { label: 'Negrita', shortcut: 'Ctrl+B', action: () => { applyFormat({ bold: !(formats[cellKey(selection.startRow, selection.startCol)]?.bold) }); setContextMenu(null); } },
            { label: 'Cursiva', shortcut: 'Ctrl+I', action: () => { applyFormat({ italic: !(formats[cellKey(selection.startRow, selection.startCol)]?.italic) }); setContextMenu(null); } },
          ].map((item, i) =>
            item === null ? (
              <div key={i} className="my-1 h-px bg-[var(--border-default)]" />
            ) : (
              <button
                key={i}
                disabled={item.disabled}
                onClick={item.action}
                className="flex w-full items-center justify-between gap-8 px-4 py-1.5 text-left transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-primary)]"
              >
                <span>{item.label}</span>
                {item.shortcut && <span className="text-[11px] text-[var(--text-tertiary)] font-mono flex-shrink-0">{item.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
});

export default SpreadsheetGrid;
