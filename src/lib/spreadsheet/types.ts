export interface CellValue {
  raw: string | number | boolean | Date | null;
  formatted: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'error' | 'formula' | 'empty';
  error?: string;
  formula?: string;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  border?: CellBorder;
  numberFormat?: string;
}

export interface CellBorder {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export interface Cell {
  id: string;
  row: number;
  col: number;
  value: CellValue;
  style?: CellStyle;
  formula?: string;
  dependencies?: string[];
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface Sheet {
  id: string;
  name: string;
  cells: Map<string, Cell>;
  columnCount: number;
  rowCount: number;
  columnWidths: Map<number, number>;
  rowHeights: Map<number, number>;
  mergedCells: CellRange[];
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface ClipboardOperation {
  sourceRange: CellRange;
  targetRange: CellRange;
  copy: boolean;
}

export interface UndoRedoAction {
  type: 'set_value' | 'set_style' | 'insert_row' | 'delete_row' | 'insert_col' | 'delete_col' | 'merge' | 'unmerge';
  sheetId: string;
  before: unknown;
  after: unknown;
}

export type CellChangeEvent = {
  type: 'value_change' | 'style_change' | 'selection_change' | 'sheet_change';
  sheetId: string;
  changes: Array<{
    row: number;
    col: number;
    oldValue?: CellValue;
    newValue?: CellValue;
  }>;
};

export interface SpreadsheetState {
  sheets: Sheet[];
  activeSheetId: string;
  selection: Selection;
  clipboard: ClipboardOperation | null;
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
}
