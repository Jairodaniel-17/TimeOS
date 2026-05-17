import { HyperFormula, CellValue } from 'hyperformula';
import type { CellValue as SpreadsheetCellValue, CellRange } from './types';

export class FormulaEngine {
  private hf: HyperFormula | null = null;
  private sheetId: number = 0;
  private listeners: Set<(changes: Array<{ row: number; col: number; value: unknown }>) => void> = new Set();
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      this.hf = HyperFormula.buildEmpty({
        licenseKey: 'gpl-v3',
        maxColumns: 16384,
        maxRows: 1048576,
      });
      const sheetName = this.hf.addSheet('Sheet1');
      if (sheetName) {
        const id = this.hf.getSheetId(sheetName);
        if (id !== undefined) {
          this.sheetId = id;
        }
      }
    } catch (error) {
      console.error('Failed to initialize HyperFormula:', error);
    }
  }

  public getHyperFormula(): HyperFormula | null {
    return this.hf;
  }

  public getSheetId(): number {
    return this.sheetId;
  }

  public getSheetName(): string {
    return this.hf?.getSheetName(this.sheetId) || 'Sheet1';
  }

  private getAddress(row: number, col: number) {
    return { sheet: this.sheetId, row, col };
  }

  public setCellValue(row: number, col: number, value: string | number | boolean | Date | null): void {
    if (!this.hf) return;
    
    try {
      this.hf.setCellContents(this.getAddress(row, col), [[value]]);
      this.scheduleNotification();
    } catch (error) {
      console.error('Error setting cell value:', error);
    }
  }

  public setFormula(row: number, col: number, formula: string): void {
    if (!this.hf) return;
    
    try {
      this.hf.setCellContents(this.getAddress(row, col), [[formula]]);
      this.scheduleNotification();
    } catch (error) {
      console.error('Error setting formula:', error);
    }
  }

  public getCellValue(row: number, col: number): SpreadsheetCellValue {
    if (!this.hf) {
      return { raw: null, formatted: '', type: 'empty' };
    }

    try {
      const address = this.getAddress(row, col);
      const value = this.hf.getCellValue(address);
      const hasFormula = this.hf.doesCellHaveFormula(address);

      if (value === null || value === undefined || this.hf.isCellEmpty(address)) {
        return { raw: null, formatted: '', type: 'empty' };
      }

      if (typeof value === 'string') {
        if (hasFormula) {
          const formula = this.hf.getCellFormula(address);
          return { 
            raw: value, 
            formatted: String(value), 
            type: 'formula',
            formula 
          };
        }
        return { raw: value, formatted: value, type: 'string' };
      }

      if (typeof value === 'number') {
        return { raw: value, formatted: String(value), type: 'number' };
      }

      if (typeof value === 'boolean') {
        return { raw: value, formatted: value ? 'TRUE' : 'FALSE', type: 'boolean' };
      }

      if (value instanceof Date) {
        return { raw: value, formatted: value.toISOString().split('T')[0], type: 'date' };
      }

      return { raw: String(value), formatted: String(value), type: 'string' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { raw: null, formatted: '#ERROR!', type: 'error', error: errorMessage };
    }
  }

  public getRangeValues(range: CellRange): SpreadsheetCellValue[][] {
    if (!this.hf) {
      return [];
    }

    try {
      const values: SpreadsheetCellValue[][] = [];
      
      for (let row = range.startRow; row <= range.endRow; row++) {
        const rowValues: SpreadsheetCellValue[] = [];
        for (let col = range.startCol; col <= range.endCol; col++) {
          rowValues.push(this.getCellValue(row, col));
        }
        values.push(rowValues);
      }
      
      return values;
    } catch (error) {
      console.error('Error getting range values:', error);
      return [];
    }
  }

  public getAllValues(): SpreadsheetCellValue[][] {
    if (!this.hf) return [];
    
    try {
      const dims = this.hf.getSheetDimensions(this.sheetId);
      const rows = dims.height;
      const cols = dims.width;
      
      const values: SpreadsheetCellValue[][] = [];
      for (let row = 0; row < rows; row++) {
        const rowValues: SpreadsheetCellValue[] = [];
        for (let col = 0; col < cols; col++) {
          rowValues.push(this.getCellValue(row, col));
        }
        values.push(rowValues);
      }
      return values;
    } catch (error) {
      console.error('Error getting all values:', error);
      return [];
    }
  }

  public batchUpdate(updates: Array<{ row: number; col: number; value: string | number | boolean | Date | null }>): void {
    if (!this.hf) return;

    try {
      this.hf.batch(() => {
        for (const update of updates) {
          this.hf!.setCellContents(this.getAddress(update.row, update.col), [[update.value]]);
        }
      });
      this.scheduleNotification();
    } catch (error) {
      console.error('Error in batch update:', error);
    }
  }

  private scheduleNotification(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.batchTimeout = setTimeout(() => {
      this.notifyListeners();
    }, 50);
  }

  public recalculate(): void {
    if (!this.hf) return;
    this.hf.rebuildAndRecalculate();
    this.notifyListeners();
  }

  public addChangeListener(listener: (changes: Array<{ row: number; col: number; value: unknown }>) => void): void {
    this.listeners.add(listener);
  }

  public removeChangeListener(listener: (changes: Array<{ row: number; col: number; value: unknown }>) => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    if (!this.hf) return;

    try {
      const dims = this.hf.getSheetDimensions(this.sheetId);
      const changes: Array<{ row: number; col: number; value: unknown }> = [];
      
      for (let row = 0; row < dims.height; row++) {
        for (let col = 0; col < dims.width; col++) {
          const value = this.hf.getCellValue(this.getAddress(row, col));
          changes.push({ row, col, value });
        }
      }

      this.listeners.forEach(listener => listener(changes));
    } catch (error) {
      console.error('Error notifying listeners:', error);
    }
  }

  public getColumnCount(): number {
    return this.hf?.getSheetDimensions(this.sheetId)?.width || 26;
  }

  public getRowCount(): number {
    return this.hf?.getSheetDimensions(this.sheetId)?.height || 100;
  }

  public addSheet(name: string): number {
    if (!this.hf) return -1;
    const sheetName = this.hf.addSheet(name);
    if (sheetName) {
      const id = this.hf.getSheetId(sheetName);
      if (id !== undefined) {
        return id;
      }
    }
    return -1;
  }

  public removeSheet(sheetId: number): void {
    if (!this.hf) return;
    try {
      this.hf.removeSheet(sheetId);
    } catch (error) {
      console.error('Error removing sheet:', error);
    }
  }

  public getSheetNames(): string[] {
    if (!this.hf) return [];
    return this.hf.getSheetNames();
  }

  public setSheetData(data: (string | number | boolean | null)[][]): void {
    if (!this.hf) return;
    
    try {
      this.hf.setSheetContent(this.sheetId, data);
      this.notifyListeners();
    } catch (error) {
      console.error('Error setting sheet data:', error);
    }
  }

  public clearSheet(): void {
    if (!this.hf) return;
    try {
      this.hf.clearSheet(this.sheetId);
      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing sheet:', error);
    }
  }

  public getRawCellValue(row: number, col: number): CellValue {
    if (!this.hf) return null;
    try {
      return this.hf.getCellValue(this.getAddress(row, col));
    } catch {
      return null;
    }
  }

  public doesCellHaveFormula(row: number, col: number): boolean {
    if (!this.hf) return false;
    try {
      return this.hf.doesCellHaveFormula(this.getAddress(row, col));
    } catch {
      return false;
    }
  }

  public getCellFormula(row: number, col: number): string | undefined {
    if (!this.hf) return undefined;
    try {
      return this.hf.getCellFormula(this.getAddress(row, col));
    } catch {
      return undefined;
    }
  }

  public destroy(): void {
    if (this.hf) {
      this.hf.destroy();
      this.hf = null;
    }
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.listeners.clear();
  }
}

export const formulaEngine = new FormulaEngine();
