export type ChartType = 
  | 'bar' 
  | 'column' 
  | 'line' 
  | 'area' 
  | 'pie' 
  | 'donut'
  | 'scatter'
  | 'combo';

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  type?: ChartType;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend: boolean;
  showDataLabels: boolean;
  colors?: string[];
  stacked?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartSeries[];
}

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export class ChartEngine {
  private data: (string | number | null)[][] = [];
  private config: ChartConfig = {
    type: 'bar',
    title: 'Gráfico',
    showLegend: true,
    showDataLabels: false,
  };

  public setData(data: (string | number | null)[][]): void {
    this.data = data;
  }

  public setConfig(config: Partial<ChartConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): ChartConfig {
    return { ...this.config };
  }

  public parseDataFromGrid(): ChartData {
    if (this.data.length < 2) {
      return { labels: [], datasets: [] };
    }

    const headers = this.data[0];
    const rows = this.data.slice(1);

    const labels = rows.map(row => String(row[0] || ''));

    const datasets: ChartSeries[] = [];
    const colors = this.config.colors || defaultColors;

    for (let col = 1; col < headers.length; col++) {
      const seriesName = String(headers[col] || `Serie ${col}`);
      const data: ChartDataPoint[] = rows.map((rowItem, idx) => {
        const val = rowItem[col];
        const numValue = typeof val === 'number' ? val : parseFloat(String(val));
        return {
          label: labels[idx],
          value: isNaN(numValue) ? 0 : numValue,
        };
      }).filter(p => p.value !== 0);

      datasets.push({
        name: seriesName,
        data,
        type: this.config.type,
      });
    }

    return { labels, datasets };
  }

  public calculatePieData(): { labels: string[]; values: number[]; colors: string[] } {
    const chartData = this.parseDataFromGrid();
    const colors = this.config.colors || defaultColors;
    
    if (chartData.datasets.length === 0) {
      return { labels: [], values: [], colors: [] };
    }

    const dataset = chartData.datasets[0];
    return {
      labels: dataset.data.map(d => d.label),
      values: dataset.data.map(d => d.value),
      colors: colors.slice(0, dataset.data.length),
    };
  }

  public calculateBarData(): { 
    labels: string[]; 
    datasets: { label: string; data: number[]; backgroundColor: string }[] 
  } {
    const chartData = this.parseDataFromGrid();
    const colors = this.config.colors || defaultColors;

    const datasets = chartData.datasets.map((ds, idx) => ({
      label: ds.name,
      data: ds.data.map(d => d.value),
      backgroundColor: colors[idx % colors.length],
    }));

    return {
      labels: chartData.labels,
      datasets,
    };
  }

  public calculateLineData(): {
    labels: string[];
    datasets: { 
      label: string; 
      data: number[]; 
      borderColor: string; 
      backgroundColor?: string;
      fill?: boolean;
    }[];
  } {
    const chartData = this.parseDataFromGrid();
    const colors = this.config.colors || defaultColors;

    const datasets = chartData.datasets.map((ds, idx) => ({
      label: ds.name,
      data: ds.data.map(d => d.value),
      borderColor: colors[idx % colors.length],
      backgroundColor: this.config.type === 'area' ? colors[idx % colors.length] + '40' : undefined,
      fill: this.config.type === 'area',
    }));

    return {
      labels: chartData.labels,
      datasets,
    };
  }

  public getScatterData(): { x: number; y: number; label: string }[] {
    if (this.data.length < 2) return [];

    const xCol = 0;
    const yCol = 1;

    return this.data.slice(1).map(row => ({
      x: typeof row[xCol] === 'number' ? row[xCol] : parseFloat(String(row[xCol])) || 0,
      y: typeof row[yCol] === 'number' ? row[yCol] : parseFloat(String(row[yCol])) || 0,
      label: String(row[0] || ''),
    })).filter(p => !isNaN(p.x) && !isNaN(p.y));
  }

  public getSummaryStats(): { total: number; average: number; min: number; max: number; count: number } {
    const chartData = this.parseDataFromGrid();
    
    const allValues = chartData.datasets.flatMap(ds => ds.data.map(d => d.value));
    
    if (allValues.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0, count: 0 };
    }

    const total = allValues.reduce((a, b) => a + b, 0);
    const average = total / allValues.length;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    return { total, average, min, max, count: allValues.length };
  }
}

export const chartEngine = new ChartEngine();
