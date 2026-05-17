'use client';

import { useEffect, useState, useMemo, useCallback, useRef, useContext } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button } from '@/components/ui';
import {
  Download, RefreshCw, Plus, BarChart3, FileSpreadsheet,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  DollarSign, Percent, Hash, X, Trash2, PieChart,
  TrendingUp, LayoutGrid, ChevronDown, Filter, Settings,
} from 'lucide-react';
import { SpreadsheetGrid, type SpreadsheetGridHandle, type CellData } from '@/lib/spreadsheet/SpreadsheetGrid';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const REDWOOD_COLORS = ['#227e9e', '#436a28', '#96611c', '#b23021', '#312d2a', '#006692', '#5c5c5c'];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Sheet {
  id: string;
  name: string;
  cells: Record<string, CellData>;
  formulas: Record<string, string>;
  formats: Record<string, Record<string, unknown>>;
  colWidths: Record<number, number>;
}

interface PivotConfig {
  rowField: number | null;
  colField: number | null;
  valueField: number | null;
  aggFunc: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie' | 'combo';
  dataRange: string; // e.g. "A1:C10"
  title: string;
  xField: number;
  yFields: number[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cellKey(r: number, c: number) { return `R${r}C${c}`; }
function colToLetter(col: number): string {
  let letter = '';
  let n = col;
  while (n >= 0) { letter = String.fromCharCode((n % 26) + 65) + letter; n = Math.floor(n / 26) - 1; }
  return letter;
}

function cellRefToAddress(ref: string): { row: number; col: number } | null {
  const m = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return null;
  const col = m[1].toUpperCase().split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const row = parseInt(m[2]) - 1;
  return { row, col };
}

function getCellRef(row: number, col: number) { return `${colToLetter(col)}${row + 1}`; }

function gridToRows(cells: Record<string, CellData>, maxRows = 200, maxCols = 26): CellData[][] {
  const rows: CellData[][] = [];
  for (let r = 0; r < maxRows; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < maxCols; c++) row.push(cells[cellKey(r, c)] ?? null);
    rows.push(row);
  }
  return rows;
}

function buildPivotTable(
  cells: Record<string, CellData>,
  config: PivotConfig,
  headerRow: number = 0
): { headers: string[]; rows: string[][]; } {
  if (config.rowField === null || config.valueField === null) return { headers: [], rows: [] };

  const header: Record<number, string> = {};
  let c = 0;
  while (cells[cellKey(headerRow, c)] !== undefined && cells[cellKey(headerRow, c)] !== null) {
    header[c] = String(cells[cellKey(headerRow, c)] ?? c);
    c++;
  }

  const data: Array<Record<string, CellData>> = [];
  let r = headerRow + 1;
  while (cells[cellKey(r, 0)] !== undefined && cells[cellKey(r, 0)] !== null) {
    const row: Record<string, CellData> = {};
    Object.entries(header).forEach(([col, name]) => { row[name] = cells[cellKey(r, parseInt(col))] ?? null; });
    data.push(row);
    r++;
  }

  const rowFieldName = header[config.rowField];
  const colFieldName = config.colField !== null ? header[config.colField] : null;
  const valFieldName = header[config.valueField];

  if (!rowFieldName || !valFieldName) return { headers: [], rows: [] };

  const rowKeys = [...new Set(data.map(d => String(d[rowFieldName] ?? '')))];
  const colKeys = colFieldName ? [...new Set(data.map(d => String(d[colFieldName!] ?? '')))] : ['Total'];

  const agg = (vals: number[]) => {
    if (!vals.length) return 0;
    if (config.aggFunc === 'sum') return vals.reduce((a, b) => a + b, 0);
    if (config.aggFunc === 'count') return vals.length;
    if (config.aggFunc === 'avg') return vals.reduce((a, b) => a + b, 0) / vals.length;
    if (config.aggFunc === 'min') return Math.min(...vals);
    if (config.aggFunc === 'max') return Math.max(...vals);
    return 0;
  };

  const table: string[][] = rowKeys.map(rk => {
    return [
      rk,
      ...colKeys.map(ck => {
        const filtered = data.filter(d =>
          String(d[rowFieldName] ?? '') === rk &&
          (!colFieldName || String(d[colFieldName!] ?? '') === ck)
        );
        const vals = filtered.map(d => parseFloat(String(d[valFieldName] ?? 0))).filter(v => !isNaN(v));
        return String(Math.round(agg(vals) * 100) / 100);
      }),
    ];
  });

  return { headers: [rowFieldName, ...colKeys], rows: table };
}

function extractChartData(cells: Record<string, CellData>, xField: number, yFields: number[]) {
  const rows: Array<Record<string, string | number>> = [];
  let r = 1;
  while (cells[cellKey(r, xField)] !== null && cells[cellKey(r, xField)] !== undefined) {
    const row: Record<string, string | number> = { label: String(cells[cellKey(r, xField)] ?? '') };
    yFields.forEach(c => {
      const hdr = String(cells[cellKey(0, c)] ?? colToLetter(c));
      const val = parseFloat(String(cells[cellKey(r, c)] ?? 0));
      row[hdr] = isNaN(val) ? 0 : val;
    });
    rows.push(row);
    r++;
  }
  return rows;
}

// ─── Default seed data ────────────────────────────────────────────────────────

function buildDefaultSheet(name: string, apiData: CellData[][]): Sheet {
  const cells: Record<string, CellData> = {};
  apiData.forEach((row, r) => row.forEach((v, c) => { if (v !== null) cells[cellKey(r, c)] = v; }));
  return { id: name, name, cells, formulas: {}, formats: {}, colWidths: {} };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SpreadsheetPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState('Proyectos');
  const [activeCellRef, setActiveCellRef] = useState('A1');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [rightPanel, setRightPanel] = useState<'none' | 'chart' | 'pivot'>('none');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({ type: 'bar', dataRange: '', title: 'Gráfico', xField: 0, yFields: [1, 2] });
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({ rowField: 0, colField: null, valueField: 1, aggFunc: 'sum' });
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gridRef = useRef<SpreadsheetGridHandle>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes, timeRes] = await Promise.all([
        fetch('/api/projects'), fetch('/api/tasks?parentId=null'), fetch('/api/task-time-entries'),
      ]);
      const [projData, taskData, timeData] = await Promise.all([projRes.json(), taskRes.json(), timeRes.json()]);

      const projects = projData.success ? projData.data : [];
      const tasks = taskData.success ? taskData.data : [];
      const timeEntries = timeData.success ? (timeData.data || []) : [];

      const projSheet: CellData[][] = [
        ['Proyecto', 'Cliente', 'Estado', 'Presupuesto', 'Horas Est.', 'Avance %', 'Billable'],
        ...projects.map((p: Record<string, unknown>) => [
          p.name, p.client || '-',
          p.status === 'active' ? 'Activo' : p.status === 'completed' ? 'Completado' : 'Archivado',
          p.budget || 0, p.budgetHours || 0, p.progress || 0,
          p.billable ? 'Sí' : 'No',
        ]),
      ];

      const taskSheet: CellData[][] = [
        ['Tarea', 'Proyecto', 'Estado', 'Prioridad', 'Horas Est.', 'Horas Reales', 'Avance %', 'Asignado'],
        ...tasks.map((t: Record<string, unknown>) => {
          const proj = projects.find((p: Record<string, unknown>) => p.id === t.projectId);
          return [
            t.name,
            proj?.name || '-',
            t.status === 'done' ? 'Completado' : t.status === 'in_progress' ? 'En Progreso' : 'Pendiente',
            t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja',
            t.estimatedHours || 0,
            t.actualHours || 0,
            t.progress || 0,
            t.assigneeId || '-',
          ];
        }),
      ];

      const summarySheet: CellData[][] = [
        ['Métrica', 'Valor'],
        ['Total Proyectos', projects.length],
        ['Proyectos Activos', projects.filter((p: Record<string, unknown>) => p.status === 'active').length],
        ['Proyectos Completados', projects.filter((p: Record<string, unknown>) => p.status === 'completed').length],
        ['Total Tareas', tasks.length],
        ['Tareas Completadas', tasks.filter((t: Record<string, unknown>) => t.status === 'done').length],
        ['Tareas en Progreso', tasks.filter((t: Record<string, unknown>) => t.status === 'in_progress').length],
        ['Horas Est. Totales', tasks.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.estimatedHours) || 0), 0)],
        ['Horas Reales Totales', tasks.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.actualHours) || 0), 0)],
        ['Presupuesto Total', projects.reduce((s: number, p: Record<string, unknown>) => s + (Number(p.budget) || 0), 0)],
        ['Proyectos Billable', projects.filter((p: Record<string, unknown>) => p.billable).length],
      ];

      const timeSheet: CellData[][] = [
        ['Usuario', 'Proyecto', 'Tarea', 'Horas', 'Fecha', 'Descripción'],
        ...timeEntries.slice(0, 500).map((e: Record<string, unknown>) => [
          e.userId || '-',
          projects.find((p: Record<string, unknown>) => p.id === e.projectId)?.name || e.projectId || '-',
          e.taskId || '-',
          e.hours || 0,
          e.date || '-',
          e.description || '-',
        ]),
      ];

      const freeSheet: CellData[][] = [['', '', '', ''], ['', '', '', '']];

      // Try to restore saved sheets for user's free sheets
      const defaultSheets = [
        buildDefaultSheet('Proyectos', projSheet),
        buildDefaultSheet('Tareas', taskSheet),
        buildDefaultSheet('Resumen', summarySheet),
        buildDefaultSheet('Tiempo', timeSheet),
        buildDefaultSheet('Hoja Libre', freeSheet),
      ];

      if (user) {
        try {
          const savedRes = await fetch(`/api/spreadsheet?userId=${user.id}`);
          const savedData = await savedRes.json();
          if (savedData.success && savedData.data?.sheets) {
            // Merge: use saved user-edited sheets, keeping data sheets fresh
            const saved = savedData.data.sheets as Sheet[];
            const freeSheets = saved.filter(s => !['Proyectos', 'Tareas', 'Resumen', 'Tiempo'].includes(s.name));
            setSheets([...defaultSheets.slice(0, 4), ...freeSheets.length ? freeSheets : [buildDefaultSheet('Hoja Libre', freeSheet)]]);
            setLoading(false);
            return;
          }
        } catch { /* fallback to default */ }
      }

      setSheets(defaultSheets);
    } catch (e) {
      console.error(e);
      setSheets([buildDefaultSheet('Hoja 1', [])]);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoSave = useCallback((updatedSheets: Sheet[]) => {
    if (!user) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/spreadsheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, sheets: updatedSheets }),
        });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 2000);
  }, [user]);

  const activeSheet = useMemo(() => sheets.find(s => s.id === activeSheetId) || sheets[0], [sheets, activeSheetId]);

  const initialData = useMemo(() => {
    if (!activeSheet) return [];
    return gridToRows(activeSheet.cells, 200, 26);
  }, [activeSheet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellSelect = useCallback((row: number, col: number, formula: string, value: CellData) => {
    setActiveCellRef(getCellRef(row, col));
    setFormulaBarValue(formula || (value !== null ? String(value) : ''));
  }, []);

  const handleFormulaBarChange = (val: string) => {
    setFormulaBarValue(val);
  };

  const handleFormulaBarCommit = () => {
    gridRef.current?.setActiveCellValue(formulaBarValue);
  };

  const handleFormulaBarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleFormulaBarCommit(); }
    if (e.key === 'Escape') { setFormulaBarValue(''); }
  };

  const applyFmt = (fmt: Record<string, unknown>) => {
    gridRef.current?.setFormat(fmt);
  };

  const exportCSV = () => {
    if (!activeSheet) return;
    const rows = gridToRows(activeSheet.cells, 200, 26);
    const csv = rows
      .filter(r => r.some(v => v !== null))
      .map(r => r.map(v => v === null ? '' : `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeSheet.name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDataChange = useCallback((cells: Record<string, CellData>, formulas: Record<string, string>) => {
    setSheets(prev => {
      const updated = prev.map(s => s.id === activeSheetId ? { ...s, cells, formulas } : s);
      triggerAutoSave(updated);
      return updated;
    });
  }, [activeSheetId, triggerAutoSave]);

  const addSheet = () => {
    const name = `Hoja ${sheets.length + 1}`;
    const newSheet: Sheet = { id: `sheet_${Date.now()}`, name, cells: {}, formulas: {}, formats: {}, colWidths: {} };
    const updated = [...sheets, newSheet];
    setSheets(updated);
    setActiveSheetId(newSheet.id);
    triggerAutoSave(updated);
  };

  const deleteSheet = (id: string) => {
    if (sheets.length <= 1) return;
    const updated = sheets.filter(s => s.id !== id);
    setSheets(updated);
    if (activeSheetId === id) setActiveSheetId(updated[0].id);
    triggerAutoSave(updated);
  };

  const renameSheet = (id: string, newName: string) => {
    const updated = sheets.map(s => s.id === id ? { ...s, name: newName } : s);
    setSheets(updated);
    setRenaming(null);
    triggerAutoSave(updated);
  };

  const insertRow = () => {
    const cell = gridRef.current?.getActiveCell();
    if (cell) gridRef.current?.insertRow(cell.row);
  };

  const deleteRow = () => {
    const cell = gridRef.current?.getActiveCell();
    if (cell) gridRef.current?.deleteRow(cell.row);
  };

  // ── Pivot table ──────────────────────────────────────────────────────────────

  const pivotResult = useMemo(() => {
    if (!activeSheet || rightPanel !== 'pivot') return null;
    return buildPivotTable(activeSheet.cells, pivotConfig);
  }, [activeSheet, pivotConfig, rightPanel]);

  const headerFields = useMemo(() => {
    if (!activeSheet) return [];
    const fields: string[] = [];
    let c = 0;
    while (activeSheet.cells[cellKey(0, c)] !== undefined && activeSheet.cells[cellKey(0, c)] !== null) {
      fields.push(String(activeSheet.cells[cellKey(0, c)] ?? c));
      c++;
    }
    return fields;
  }, [activeSheet]);

  // ── Chart ────────────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    if (!activeSheet || rightPanel !== 'chart') return [];
    return extractChartData(activeSheet.cells, chartConfig.xField, chartConfig.yFields);
  }, [activeSheet, chartConfig, rightPanel]);

  const chartYKeys = useMemo(() => {
    if (!activeSheet) return [];
    return chartConfig.yFields.map(c => String(activeSheet.cells[cellKey(0, c)] ?? colToLetter(c)));
  }, [activeSheet, chartConfig.yFields]);

  const renderChart = () => {
    if (!chartData.length) return <div className="flex items-center justify-center h-48 text-redwood-muted text-sm">Sin datos</div>;

    const pieData = chartYKeys.flatMap(key =>
      chartData.map(d => ({ name: String(d.label), value: Number(d[key]) || 0 }))
    );

    const H = 280;

    if (chartConfig.type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={H}>
          <RePieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={(entry) => `${entry.name}: ${((entry.percent ?? 0) * 100).toFixed(0)}%`}>
              {pieData.map((_, i) => <Cell key={i} fill={REDWOOD_COLORS[i % REDWOOD_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </RePieChart>
        </ResponsiveContainer>
      );
    }
    if (chartConfig.type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={H}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dfe4e9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {chartYKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={REDWOOD_COLORS[i % REDWOOD_COLORS.length]} strokeWidth={2} dot={false} />)}
            {chartYKeys.length > 1 && <Legend />}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (chartConfig.type === 'area') {
      return (
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dfe4e9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {chartYKeys.map((k, i) => <Area key={k} type="monotone" dataKey={k} stroke={REDWOOD_COLORS[i % REDWOOD_COLORS.length]} fill={REDWOOD_COLORS[i % REDWOOD_COLORS.length] + '33'} />)}
            {chartYKeys.length > 1 && <Legend />}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    // bar (default)
    return (
      <ResponsiveContainer width="100%" height={H}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dfe4e9" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {chartYKeys.map((k, i) => <Bar key={k} dataKey={k} fill={REDWOOD_COLORS[i % REDWOOD_COLORS.length]} radius={[3, 3, 0, 0]} />)}
          {chartYKeys.length > 1 && <Legend />}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <PageLayout>
        <Header title="Análisis y Datos" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Análisis y Datos' }]} />
        <PageContent className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-redwood-muted">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Cargando datos...</span>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Análisis y Datos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Análisis y Datos' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant={rightPanel === 'pivot' ? 'primary' : 'subtle'} size="compact" icon={<LayoutGrid className="h-4 w-4" />} onClick={() => setRightPanel(p => p === 'pivot' ? 'none' : 'pivot')}>Tabla Dinámica</Button>
            <Button variant={rightPanel === 'chart' ? 'primary' : 'subtle'} size="compact" icon={<BarChart3 className="h-4 w-4" />} onClick={() => setRightPanel(p => p === 'chart' ? 'none' : 'chart')}>Gráfico</Button>
            <Button variant="subtle" size="compact" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchData}>Actualizar</Button>
            <Button variant="subtle" size="compact" icon={<Download className="h-4 w-4" />} onClick={exportCSV}>Exportar CSV</Button>
          </div>
        }
      />

      <PageContent className="p-0 flex flex-col h-[calc(100vh-64px)]">
        {/* ── Toolbar ── */}
        <div className="flex items-center gap-1 px-3 py-1 border-b border-redwood-border bg-redwood-surface flex-shrink-0 flex-wrap">
          <button onClick={() => applyFmt({ bold: true })} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Negrita (Ctrl+B)"><Bold className="h-3.5 w-3.5" /></button>
          <button onClick={() => applyFmt({ italic: true })} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Cursiva (Ctrl+I)"><Italic className="h-3.5 w-3.5" /></button>
          <div className="w-px h-5 bg-redwood-border mx-1" />
          <button onClick={() => applyFmt({ align: 'left' })} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Alinear izquierda"><AlignLeft className="h-3.5 w-3.5" /></button>
          <button onClick={() => applyFmt({ align: 'center' })} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Centrar"><AlignCenter className="h-3.5 w-3.5" /></button>
          <button onClick={() => applyFmt({ align: 'right' })} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Alinear derecha"><AlignRight className="h-3.5 w-3.5" /></button>
          <div className="w-px h-5 bg-redwood-border mx-1" />
          <button onClick={() => applyFmt({ numFormat: 'currency' })} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Moneda"><DollarSign className="h-3.5 w-3.5" /></button>
          <button onClick={() => applyFmt({ numFormat: 'percent' })} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Porcentaje"><Percent className="h-3.5 w-3.5" /></button>
          <button onClick={() => applyFmt({ numFormat: 'number' })} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Número"><Hash className="h-3.5 w-3.5" /></button>
          <div className="w-px h-5 bg-redwood-border mx-1" />
          <button onClick={insertRow} className="p-1.5 rounded hover:bg-redwood-hover-bg text-xs font-medium text-redwood-muted" title="Insertar fila">+Fila</button>
          <button onClick={deleteRow} className="p-1.5 rounded hover:bg-redwood-hover-bg" title="Eliminar fila"><Trash2 className="h-3.5 w-3.5 text-redwood-danger" /></button>
          <div className="w-px h-5 bg-redwood-border mx-1" />
          {/* Background color picker */}
          <div className="flex items-center gap-0.5">
            {['#fef9c3','#dcfce7','#dbeafe','#fce7f3','#fff7ed'].map(color => (
              <button key={color} onClick={() => applyFmt({ bgColor: color })}
                className="w-5 h-5 rounded border border-redwood-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }} title="Color de celda" />
            ))}
            <button onClick={() => applyFmt({ bgColor: undefined })} className="p-1 rounded hover:bg-redwood-hover-bg text-redwood-muted" title="Sin color"><X className="h-3 w-3" /></button>
          </div>
        </div>

        {/* ── Formula bar ── */}
        <div className="flex items-center gap-2 px-3 py-1 border-b border-redwood-border bg-redwood-surface flex-shrink-0">
          <div className="w-14 flex-shrink-0 px-2 py-1 text-xs font-mono font-semibold text-redwood-primary bg-redwood-selected-bg rounded text-center border border-redwood-border">
            {activeCellRef}
          </div>
          <span className="text-redwood-muted text-xs select-none">fx</span>
          <input
            type="text"
            value={formulaBarValue}
            onChange={e => handleFormulaBarChange(e.target.value)}
            onKeyDown={handleFormulaBarKeyDown}
            onBlur={handleFormulaBarCommit}
            className="flex-1 px-2 py-1 text-xs border border-redwood-border rounded focus:outline-none focus:border-redwood-primary bg-redwood-surface"
            placeholder="Ingresa un valor o fórmula (ej: =SUMA(A1:A10))"
          />
          {autoSaveStatus !== 'idle' && (
            <span className={`text-xs flex-shrink-0 ${autoSaveStatus === 'saved' ? 'text-green-600' : 'text-redwood-muted'}`}>
              {autoSaveStatus === 'saving' ? 'Guardando…' : 'Guardado'}
            </span>
          )}
        </div>

        {/* ── Main area ── */}
        <div className="flex flex-1 min-h-0">
          {/* Grid */}
          <div className={`flex flex-col min-h-0 ${rightPanel !== 'none' ? 'flex-1' : 'flex-1'}`}>
            <div className="flex-1 min-h-0">
              <SpreadsheetGrid
                key={activeSheetId}
                ref={gridRef}
                initialData={initialData}
                onCellSelect={handleCellSelect}
                onDataChange={handleDataChange}
                rows={200}
                cols={26}
              />
            </div>

            {/* Sheet tabs */}
            <div className="flex items-center border-t border-redwood-border bg-redwood-surface-soft flex-shrink-0 overflow-x-auto">
              <div className="flex items-end gap-0 min-w-0">
                {sheets.map(sheet => (
                  <div
                    key={sheet.id}
                    className={`group flex items-center gap-1 px-4 py-2 text-xs font-medium border-r border-redwood-border cursor-pointer transition-colors flex-shrink-0 ${
                      sheet.id === activeSheetId
                        ? 'bg-redwood-surface text-redwood-primary border-t-2 border-t-redwood-primary -mt-px'
                        : 'text-redwood-muted hover:bg-redwood-surface hover:text-redwood-text'
                    }`}
                    onClick={() => setActiveSheetId(sheet.id)}
                    onDoubleClick={() => { setRenaming(sheet.id); setRenameValue(sheet.name); }}
                  >
                    <FileSpreadsheet className="h-3 w-3 flex-shrink-0" />
                    {renaming === sheet.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => renameSheet(sheet.id, renameValue)}
                        onKeyDown={e => { if (e.key === 'Enter') renameSheet(sheet.id, renameValue); if (e.key === 'Escape') setRenaming(null); }}
                        className="w-20 border-b border-redwood-primary bg-transparent outline-none text-xs"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="max-w-[80px] truncate">{sheet.name}</span>
                    )}
                    {sheets.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteSheet(sheet.id); }}
                        className="opacity-0 group-hover:opacity-100 ml-1 text-redwood-muted hover:text-redwood-danger transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addSheet}
                className="flex items-center gap-1 px-3 py-2 text-xs text-redwood-muted hover:text-redwood-text hover:bg-redwood-surface transition-colors flex-shrink-0"
                title="Nueva hoja"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right panel: Chart or Pivot */}
          {rightPanel !== 'none' && (
            <div className="w-80 xl:w-96 border-l border-redwood-border bg-redwood-page flex flex-col overflow-y-auto flex-shrink-0">
              {rightPanel === 'chart' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-redwood-text flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-redwood-primary" />
                      Gráfico
                    </h3>
                    <button onClick={() => setRightPanel('none')} className="text-redwood-muted hover:text-redwood-text"><X className="h-4 w-4" /></button>
                  </div>

                  {/* Chart type selector */}
                  <div className="flex gap-1 mb-3 p-1 bg-redwood-solid-bg rounded-lg">
                    {(['bar','line','area','pie'] as const).map(t => (
                      <button key={t} onClick={() => setChartConfig(c => ({ ...c, type: t }))}
                        className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${chartConfig.type === t ? 'bg-redwood-surface text-redwood-primary shadow-sm' : 'text-redwood-muted hover:text-redwood-text'}`}>
                        {t === 'bar' ? 'Barras' : t === 'line' ? 'Línea' : t === 'area' ? 'Área' : 'Pie'}
                      </button>
                    ))}
                  </div>

                  {/* Field config */}
                  <div className="space-y-2 mb-4">
                    <div>
                      <label className="text-xs text-redwood-muted mb-1 block">Eje X (columna)</label>
                      <select
                        value={chartConfig.xField}
                        onChange={e => setChartConfig(c => ({ ...c, xField: parseInt(e.target.value) }))}
                        className="w-full text-xs border border-redwood-border rounded px-2 py-1 bg-redwood-surface focus:outline-none focus:border-redwood-primary"
                      >
                        {headerFields.map((f, i) => <option key={i} value={i}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-redwood-muted mb-1 block">Valores (columnas, separadas por coma)</label>
                      <input
                        type="text"
                        value={chartConfig.yFields.map(c => colToLetter(c)).join(',')}
                        onChange={e => {
                          const cols = e.target.value.split(',').map(s => s.trim()).filter(Boolean).map(l => {
                            let col = 0; for (const ch of l.toUpperCase()) col = col * 26 + ch.charCodeAt(0) - 64;
                            return col - 1;
                          }).filter(c => c >= 0 && c < 26);
                          if (cols.length) setChartConfig(c => ({ ...c, yFields: cols }));
                        }}
                        placeholder="B,C,D"
                        className="w-full text-xs border border-redwood-border rounded px-2 py-1 bg-redwood-surface focus:outline-none focus:border-redwood-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-redwood-muted mb-1 block">Título</label>
                      <input
                        type="text"
                        value={chartConfig.title}
                        onChange={e => setChartConfig(c => ({ ...c, title: e.target.value }))}
                        className="w-full text-xs border border-redwood-border rounded px-2 py-1 bg-redwood-surface focus:outline-none focus:border-redwood-primary"
                      />
                    </div>
                  </div>

                  {/* Chart area */}
                  <div className="bg-redwood-surface rounded-lg border border-redwood-border p-3">
                    {chartConfig.title && <p className="text-xs font-semibold text-center text-redwood-text mb-2">{chartConfig.title}</p>}
                    {renderChart()}
                  </div>
                </div>
              )}

              {rightPanel === 'pivot' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-redwood-text flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-redwood-primary" />
                      Tabla Dinámica
                    </h3>
                    <button onClick={() => setRightPanel('none')} className="text-redwood-muted hover:text-redwood-text"><X className="h-4 w-4" /></button>
                  </div>

                  {/* Pivot config */}
                  <div className="space-y-2 mb-4 p-3 bg-redwood-surface rounded-lg border border-redwood-border">
                    <p className="text-xs font-medium text-redwood-muted uppercase tracking-wide mb-2">Configurar campos</p>
                    <div>
                      <label className="text-xs text-redwood-muted mb-1 block">Filas</label>
                      <select value={pivotConfig.rowField ?? ''} onChange={e => setPivotConfig(p => ({ ...p, rowField: e.target.value === '' ? null : parseInt(e.target.value) }))}
                        className="w-full text-xs border border-redwood-border rounded px-2 py-1 bg-redwood-surface">
                        <option value="">-- ninguno --</option>
                        {headerFields.map((f, i) => <option key={i} value={i}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-redwood-muted mb-1 block">Columnas (opcional)</label>
                      <select value={pivotConfig.colField ?? ''} onChange={e => setPivotConfig(p => ({ ...p, colField: e.target.value === '' ? null : parseInt(e.target.value) }))}
                        className="w-full text-xs border border-redwood-border rounded px-2 py-1 bg-redwood-surface">
                        <option value="">-- ninguno --</option>
                        {headerFields.map((f, i) => <option key={i} value={i}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-redwood-muted mb-1 block">Valores</label>
                      <select value={pivotConfig.valueField ?? ''} onChange={e => setPivotConfig(p => ({ ...p, valueField: e.target.value === '' ? null : parseInt(e.target.value) }))}
                        className="w-full text-xs border border-redwood-border rounded px-2 py-1 bg-redwood-surface">
                        <option value="">-- ninguno --</option>
                        {headerFields.map((f, i) => <option key={i} value={i}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-redwood-muted mb-1 block">Agregación</label>
                      <select value={pivotConfig.aggFunc} onChange={e => setPivotConfig(p => ({ ...p, aggFunc: e.target.value as PivotConfig['aggFunc'] }))}
                        className="w-full text-xs border border-redwood-border rounded px-2 py-1 bg-redwood-surface">
                        <option value="sum">Suma</option>
                        <option value="count">Conteo</option>
                        <option value="avg">Promedio</option>
                        <option value="min">Mínimo</option>
                        <option value="max">Máximo</option>
                      </select>
                    </div>
                  </div>

                  {/* Pivot table output */}
                  {pivotResult && pivotResult.headers.length > 0 ? (
                    <div className="overflow-auto rounded-lg border border-redwood-border">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            {pivotResult.headers.map((h, i) => (
                              <th key={i} className="px-3 py-2 bg-redwood-solid-bg text-left font-semibold text-redwood-text border-b border-redwood-border border-r last:border-r-0">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pivotResult.rows.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? 'bg-redwood-surface' : 'bg-redwood-surface-soft'}>
                              {row.map((cell, ci) => (
                                <td key={ci} className={`px-3 py-1.5 border-b border-r last:border-r-0 border-redwood-border ${ci > 0 ? 'text-right font-mono' : 'font-medium'}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-redwood-muted text-center py-8">
                      Selecciona los campos para generar la tabla dinámica.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
