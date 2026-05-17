'use client';

import { useMemo } from 'react';
import type { ChartType, ChartConfig, ChartData } from './chart-engine';

interface ChartProps {
  data: ChartData;
  config: ChartConfig;
  width?: number;
  height?: number;
}

const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function ChartRenderer({ data, config, width = 600, height = 400 }: ChartProps) {
  const { type, showLegend, showDataLabels, colors = defaultColors } = config;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = Math.max(width - padding.left - padding.right, 100);
  const chartHeight = Math.max(height - padding.top - padding.bottom, 100);

  const hasData = useMemo(() => {
    return data.labels.length > 0 && data.datasets.length > 0 && 
           data.datasets.some(ds => ds.data.length > 0);
  }, [data]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center text-[var(--text-secondary)]" style={{ width, height }}>
        No hay datos para mostrar
      </div>
    );
  }

  const renderBarChart = () => {
    const allValues = data.datasets.flatMap(ds => ds.data.map(d => d.value));
    const maxValue = Math.max(...allValues.filter(v => !isNaN(v) && v > 0), 1);
    
    if (!data.labels.length) return null;
    
    const barWidth = Math.max(chartWidth / data.labels.length / Math.max(data.datasets.length, 1) - 4, 4);
    const groupWidth = chartWidth / data.labels.length;

    return (
      <svg width={width} height={height}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line 
                x1={0} 
                y1={chartHeight * (1 - ratio)} 
                x2={chartWidth} 
                y2={chartHeight * (1 - ratio)} 
                stroke="#E5E7EB" 
                strokeDasharray="4"
              />
              <text 
                x={-10} 
                y={chartHeight * (1 - ratio) + 4} 
                textAnchor="end" 
                alignmentBaseline="middle" 
                className="text-xs fill-gray-500"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          ))}
          
          {data.labels.map((label, i) => (
            <g key={i} transform={`translate(${i * groupWidth}, 0)`}>
              {data.datasets.map((ds, j) => {
                const value = ds.data[i]?.value ?? 0;
                const barHeight = Math.max((value / maxValue) * chartHeight, 0);
                return (
                  <g key={j}>
                    <rect
                      x={Math.max(j * barWidth + 2, 0)}
                      y={chartHeight - barHeight}
                      width={Math.max(barWidth - 4, 0)}
                      height={Math.max(barHeight, 0)}
                      fill={colors[j % colors.length]}
                      rx={2}
                    />
                    {showDataLabels && value > 0 && (
                      <text
                        x={j * barWidth + barWidth / 2}
                        y={chartHeight - barHeight - 5}
                        textAnchor="middle"
                        className="text-xs fill-gray-700"
                      >
                        {value}
                      </text>
                    )}
                  </g>
                );
              })}
              <text
                x={groupWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    );
  };

  const renderLineChart = () => {
    const allValues = data.datasets.flatMap(ds => ds.data.map(d => d.value)).filter(v => !isNaN(v));
    const maxValue = Math.max(...allValues, 1);
    const minValue = Math.min(...allValues, 0);
    const range = Math.max(maxValue - minValue, 1);
    const pointSpacing = Math.max(chartWidth / Math.max(data.labels.length - 1, 1), 1);

    return (
      <svg width={width} height={height}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line 
                x1={0} 
                y1={chartHeight * (1 - ratio)} 
                x2={chartWidth} 
                y2={chartHeight * (1 - ratio)} 
                stroke="#E5E7EB" 
                strokeDasharray="4"
              />
              <text 
                x={-10} 
                y={chartHeight * (1 - ratio) + 4} 
                textAnchor="end" 
                alignmentBaseline="middle" 
                className="text-xs fill-gray-500"
              >
                {Math.round(minValue + range * ratio)}
              </text>
            </g>
          ))}
          
          {data.datasets.map((ds, dsIndex) => {
            const validPoints = ds.data.filter(d => !isNaN(d.value));
            if (validPoints.length === 0) return null;
            
            const points = validPoints.map((d, i) => {
              const labelIndex = data.labels.indexOf(d.label);
              return {
                x: labelIndex * pointSpacing,
                y: chartHeight - ((d.value - minValue) / range) * chartHeight,
                value: d.value,
              };
            }).filter(p => !isNaN(p.y));

            if (points.length === 0) return null;

            const pathD = points.map((p, i) => 
              `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            ).join(' ');

            return (
              <g key={dsIndex}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={colors[dsIndex % colors.length]}
                  strokeWidth={2}
                />
                {points.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={4}
                      fill={colors[dsIndex % colors.length]}
                    />
                    {showDataLabels && (
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        className="text-xs fill-gray-700"
                      >
                        {p.value}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            );
          })}
          
          {data.labels.map((label, i) => (
            <text
              key={i}
              x={i * pointSpacing}
              y={chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {label}
            </text>
          ))}
        </g>
      </svg>
    );
  };

  const renderPieChart = () => {
    const dataset = data.datasets[0];
    if (!dataset || dataset.data.length === 0) return null;

    const validData = dataset.data.filter(d => !isNaN(d.value) && d.value > 0);
    if (validData.length === 0) return null;

    const total = validData.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return null;

    const radius = Math.min(chartWidth, chartHeight) / 2 - 20;
    const centerX = chartWidth / 2 + padding.left;
    const centerY = chartHeight / 2 + padding.top;

    let currentAngle = -Math.PI / 2;

    const slices = validData.map((d, i) => {
      const angle = (d.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(startAngle + angle);
      const y2 = centerY + radius * Math.sin(startAngle + angle);
      
      const largeArc = angle > Math.PI ? 1 : 0;
      
      return {
        label: d.label,
        value: d.value,
        path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: colors[i % colors.length],
        midAngle: startAngle + angle / 2,
        percentage: (d.value / total) * 100,
      };
    });

    return (
      <svg width={width} height={height}>
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth={2}
          />
        ))}
        
        {slices.map((slice, i) => (
          <text
            key={`label-${i}`}
            x={centerX + (radius * 0.6) * Math.cos(slice.midAngle)}
            y={centerY + (radius * 0.6) * Math.sin(slice.midAngle)}
            textAnchor="middle"
            alignmentBaseline="middle"
            className="text-xs fill-white font-medium"
          >
            {slice.percentage > 5 ? `${slice.percentage.toFixed(0)}%` : ''}
          </text>
        ))}
        
        {showLegend && (
          <g transform={`translate(${Math.max(width - 160, 50)}, ${padding.top})`}>
            {validData.map((d, i) => (
              <g key={i} transform={`translate(0, ${i * 20})`}>
                <rect width={12} height={12} fill={colors[i % colors.length]} rx={2} />
                <text x={18} y={10} className="text-xs fill-gray-600">
                  {d.label} ({d.value})
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    );
  };

  const renderAreaChart = () => {
    const allValues = data.datasets.flatMap(ds => ds.data.map(d => d.value)).filter(v => !isNaN(v));
    const maxValue = Math.max(...allValues, 1);
    const minValue = 0;
    const range = Math.max(maxValue - minValue, 1);
    const pointSpacing = Math.max(chartWidth / Math.max(data.labels.length - 1, 1), 1);

    return (
      <svg width={width} height={height}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line 
                x1={0} 
                y1={chartHeight * (1 - ratio)} 
                x2={chartWidth} 
                y2={chartHeight * (1 - ratio)} 
                stroke="#E5E7EB" 
                strokeDasharray="4"
              />
              <text 
                x={-10} 
                y={chartHeight * (1 - ratio) + 4} 
                textAnchor="end" 
                alignmentBaseline="middle" 
                className="text-xs fill-gray-500"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          ))}
          
          {data.datasets.map((ds, dsIndex) => {
            const validData = ds.data.filter(d => !isNaN(d.value));
            if (validData.length === 0) return null;

            const points = validData.map((d, i) => {
              const labelIndex = data.labels.indexOf(d.label);
              return {
                x: labelIndex * pointSpacing,
                y: chartHeight - Math.max((d.value / range) * chartHeight, 0),
              };
            }).filter(p => !isNaN(p.y));

            if (points.length === 0) return null;

            const areaPath = [
              ...points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`),
              `L ${points[points.length - 1].x} ${chartHeight}`,
              `L 0 ${chartHeight}`,
              'Z',
            ].join(' ');

            const linePath = points.map((p, i) => 
              `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            ).join(' ');

            return (
              <g key={dsIndex}>
                <path
                  d={areaPath}
                  fill={colors[dsIndex % colors.length]}
                  fillOpacity={0.3}
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke={colors[dsIndex % colors.length]}
                  strokeWidth={2}
                />
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={colors[dsIndex % colors.length]}
                  />
                ))}
              </g>
            );
          })}
          
          {data.labels.map((label, i) => (
            <text
              key={i}
              x={i * pointSpacing}
              y={chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {label}
            </text>
          ))}
        </g>
      </svg>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'bar':
      case 'column':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'pie':
      case 'donut':
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-[var(--radius-sm)]">
      {config.title && (
        <h3 className="text-sm font-semibold text-center mb-2">{config.title}</h3>
      )}
      {renderContent()}
    </div>
  );
}

export default ChartRenderer;
