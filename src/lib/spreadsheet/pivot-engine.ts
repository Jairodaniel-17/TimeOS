import type { CellValue } from './types';

export type AggregationType = 
  | 'SUM' 
  | 'COUNT' 
  | 'COUNT_DISTINCT' 
  | 'AVERAGE' 
  | 'MIN' 
  | 'MAX' 
  | 'MEDIAN' 
  | 'VAR' 
  | 'STDEV';

export interface PivotField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date';
  isRowField: boolean;
  isColField: boolean;
  isValueField: boolean;
  aggregation: AggregationType;
}

export interface PivotConfig {
  rowFields: string[];
  colFields: string[];
  valueFields: string[];
  filters: Record<string, (string | number | boolean)[]>;
  aggregations: Record<string, AggregationType>;
}

export interface PivotResult {
  rows: string[];
  columns: string[];
  values: (number | string | null)[][];
  grandTotals?: {
    row: (number | string | null)[];
    column: (number | string | null)[];
    grand: number | string | null;
  };
}

interface DataRow {
  [key: string]: string | number | boolean | Date | null;
}

export class PivotEngine {
  private data: DataRow[] = [];
  private fields: Map<string, PivotField> = new Map();

  public setData(data: DataRow[]): void {
    this.data = data;
    this.detectFields();
  }

  private detectFields(): void {
    if (this.data.length === 0) return;

    const sampleRow = this.data[0];
    Object.keys(sampleRow).forEach(key => {
      const value = sampleRow[key];
      let type: 'string' | 'number' | 'date' = 'string';
      
      if (typeof value === 'number') {
        type = 'number';
      } else if (value instanceof Date) {
        type = 'date';
      } else if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num) && value.trim() !== '') {
          type = 'number';
        } else {
          const date = new Date(value);
          if (!isNaN(date.getTime()) && value.includes('-')) {
            type = 'date';
          }
        }
      }

      this.fields.set(key, {
        id: key,
        name: key,
        type,
        isRowField: false,
        isColField: false,
        isValueField: type === 'number',
        aggregation: type === 'number' ? 'SUM' : 'COUNT',
      });
    });
  }

  public getFields(): PivotField[] {
    return Array.from(this.fields.values());
  }

  public getField(name: string): PivotField | undefined {
    return this.fields.get(name);
  }

  public updateField(field: PivotField): void {
    this.fields.set(field.id, field);
  }

  public calculate(config: PivotConfig): PivotResult {
    if (this.data.length === 0) {
      return { rows: [], columns: [], values: [] };
    }

    let filteredData = [...this.data];

    if (Object.keys(config.filters).length > 0) {
      filteredData = filteredData.filter(row => {
        return Object.entries(config.filters).every(([field, values]) => {
          const rowValue = row[field];
          return values.includes(rowValue as string | number | boolean);
        });
      });
    }

    const rowKeys = new Set<string>();
    const colKeys = new Set<string>();

    filteredData.forEach(row => {
      const rowKey = config.rowFields.map(f => String(row[f] ?? '')).join(' | ');
      const colKey = config.colFields.length > 0 
        ? config.colFields.map(f => String(row[f] ?? '')).join(' | ')
        : 'Total';
      
      rowKeys.add(rowKey);
      colKeys.add(colKey);
    });

    const sortedRows = Array.from(rowKeys).sort();
    const sortedCols = Array.from(colKeys).sort();

    const aggregated: Record<string, Record<string, number[]>> = {};

    sortedRows.forEach(rowKey => {
      aggregated[rowKey] = {};
      sortedCols.forEach(colKey => {
        aggregated[rowKey][colKey] = [];
      });
    });

    filteredData.forEach(row => {
      const rowKey = config.rowFields.map(f => String(row[f] ?? '')).join(' | ');
      const colKey = config.colFields.length > 0 
        ? config.colFields.map(f => String(row[f] ?? '')).join(' | ')
        : 'Total';

      if (!aggregated[rowKey]) {
        aggregated[rowKey] = {};
      }
      if (!aggregated[rowKey][colKey]) {
        aggregated[rowKey][colKey] = [];
      }

      config.valueFields.forEach(field => {
        const value = row[field];
        if (typeof value === 'number') {
          aggregated[rowKey][colKey].push(value);
        } else if (typeof value === 'string') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            aggregated[rowKey][colKey].push(num);
          }
        }
      });
    });

    const values: (number | string | null)[][] = sortedRows.map(rowKey => {
      return sortedCols.map(colKey => {
        const rawValues = aggregated[rowKey]?.[colKey] || [];
        
        if (rawValues.length === 0) return null;

        const field = config.valueFields[0];
        const aggType = config.aggregations[field] || 'SUM';

        return this.aggregate(rawValues, aggType);
      });
    });

    return {
      rows: sortedRows,
      columns: sortedCols,
      values,
    };
  }

  private aggregate(values: number[], type: AggregationType): number | null {
    if (values.length === 0) return null;

    switch (type) {
      case 'SUM':
        return values.reduce((a, b) => a + b, 0);
      
      case 'COUNT':
        return values.length;
      
      case 'COUNT_DISTINCT':
        return new Set(values).size;
      
      case 'AVERAGE':
        return values.reduce((a, b) => a + b, 0) / values.length;
      
      case 'MIN':
        return Math.min(...values);
      
      case 'MAX':
        return Math.max(...values);
      
      case 'MEDIAN':
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 
          ? sorted[mid] 
          : (sorted[mid - 1] + sorted[mid]) / 2;
      
      case 'VAR': {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
      }
      
      case 'STDEV': {
        const variance = this.aggregate(values, 'VAR');
        return variance !== null ? Math.sqrt(variance as number) : null;
      }
      
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  }

  public exportToGrid(): (string | number)[][] {
    const fields = this.getFields();
    const numericFields = fields.filter(f => f.type === 'number');
    
    if (numericFields.length === 0) {
      return [['No hay campos numéricos para pivote']];
    }

    const config: PivotConfig = {
      rowFields: fields.filter(f => f.isRowField).map(f => f.id),
      colFields: fields.filter(f => f.isColField).map(f => f.id),
      valueFields: fields.filter(f => f.isValueField).map(f => f.id),
      filters: {},
      aggregations: Object.fromEntries(
        fields.filter(f => f.isValueField).map(f => [f.id, f.aggregation])
      ),
    };

    const result = this.calculate(config);
    
    const output: (string | number)[][] = [];
    
    output.push(['', ...result.columns]);
    
    result.rows.forEach((rowLabel, rowIdx) => {
      const row: (string | number)[] = [rowLabel];
      result.values[rowIdx].forEach(val => {
        row.push(val !== null ? val : '');
      });
      output.push(row);
    });

    return output;
  }
}

export const pivotEngine = new PivotEngine();
