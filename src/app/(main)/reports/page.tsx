'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { Download, RefreshCw, Loader2, GripVertical, Calendar, Users, Clock, AlertCircle } from 'lucide-react';
import { getWeekNumber, getCurrentYear } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface EmployeeHours {
  userId: string;
  userName: string;
  dailyHours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  totalHours: number;
  averageDailyHours: number;
  status: 'green' | 'blue' | 'red' | 'orange' | 'yellow';
  statusLabel: string;
  completionPercentage: number;
}

interface ReportSummary {
  totalEmployees: number;
  completed: number;
  overTime: number;
  noEntry: number;
  lowEntry: number;
  partial: number;
  totalHours: number;
  averageHours: number;
}

const DAYS = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mié' },
  { key: 'thu', label: 'Jue' },
  { key: 'fri', label: 'Vie' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
];

const STATUS_COLORS = {
  green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'Completado (40h)' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Horas extra (>40h)' },
  red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Sin registro (0h)' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: 'Bajo registro (<30h)' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: 'Parcial (30-39h)' },
};

export default function ReportsPage() {
  const [employees, setEmployees] = useState<EmployeeHours[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekNumber, setWeekNumber] = useState(getWeekNumber());
  const [year, setYear] = useState(getCurrentYear());
  const [draggedEmployee, setDraggedEmployee] = useState<EmployeeHours | null>(null);
  const [dropZone, setDropZone] = useState<EmployeeHours['status'] | null>(null);
  const { user } = useAuth();
  const { isAdmin, isManager } = usePermissions();

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      // Members can only see their own data
      const userIdParam = (!isAdmin && !isManager && user) ? `&userId=${user.id}` : '';
      const response = await fetch(`/api/reports/employee-hours?weekNumber=${weekNumber}&year=${year}${userIdParam}`);
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.data.employees);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [weekNumber, year, user, isAdmin, isManager]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDragStart = (employee: EmployeeHours) => {
    setDraggedEmployee(employee);
  };

  const handleDragOver = (e: React.DragEvent, zone: typeof dropZone) => {
    e.preventDefault();
    setDropZone(zone);
  };

  const handleDragLeave = () => {
    setDropZone(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: EmployeeHours['status']) => {
    e.preventDefault();
    setDropZone(null);
    
    if (!draggedEmployee) return;

    // In a real implementation, this would update the backend
    // For now, we just update the local state
    setEmployees(prev => prev.map(emp => 
      emp.userId === draggedEmployee.userId 
        ? { ...emp, status: targetStatus, statusLabel: STATUS_COLORS[targetStatus].label.split(' ')[0] }
        : emp
    ));
    setDraggedEmployee(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['Empleado', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Total', 'Estado'].join(','),
      ...employees.map(emp => [
        emp.userName,
        emp.dailyHours.mon,
        emp.dailyHours.tue,
        emp.dailyHours.wed,
        emp.dailyHours.thu,
        emp.dailyHours.fri,
        emp.dailyHours.sat,
        emp.dailyHours.sun,
        emp.totalHours,
        emp.statusLabel,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-horas-semana-${weekNumber}.csv`;
    link.click();
  };

  const renderEmployeeCard = (employee: EmployeeHours) => (
    <div
      key={employee.userId}
      draggable
      onDragStart={() => handleDragStart(employee)}
      className={`
        p-4 rounded-lg border-2 cursor-move transition-all hover:shadow-md
        ${STATUS_COLORS[employee.status].bg}
        ${STATUS_COLORS[employee.status].border}
        border-opacity-50
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-semibold text-gray-900">{employee.userName}</h4>
            <p className={`text-sm ${STATUS_COLORS[employee.status].text}`}>
              {employee.statusLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{employee.totalHours}h</div>
          <div className="text-xs text-gray-500">de 40h objetivo</div>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
        {DAYS.map(day => (
          <div key={day.key} className="bg-white/50 rounded p-1">
            <div className="text-gray-500">{day.label}</div>
            <div className="font-medium text-gray-900">
              {employee.dailyHours[day.key as keyof typeof employee.dailyHours]}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              employee.status === 'green' ? 'bg-green-500' :
              employee.status === 'blue' ? 'bg-blue-500' :
              employee.status === 'red' ? 'bg-red-500' :
              employee.status === 'orange' ? 'bg-orange-500' :
              'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(employee.completionPercentage, 100)}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">
          {employee.completionPercentage}%
        </div>
      </div>
    </div>
  );

  const renderDropZone = (
    status: EmployeeHours['status'],
    title: string,
    count: number,
    icon: React.ReactNode
  ) => (
    <div
      onDragOver={(e) => handleDragOver(e, status)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, status)}
      className={`
        p-4 rounded-lg border-2 transition-all min-h-[200px]
        ${dropZone === status ? 'border-dashed border-blue-500 bg-blue-50' : 'border-gray-200'}
        ${STATUS_COLORS[status].bg}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="text-2xl font-bold text-gray-900">{count}</span>
      </div>
      <div className="space-y-2">
        {employees
          .filter(emp => emp.status === status)
          .map(renderEmployeeCard)}
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageLayout>
        <Header
          title="Reportes"
          breadcrumbs={[{ label: 'TimeOS' }, { label: 'Reportes' }]}
        />
        <PageContent className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando reporte...</span>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Dashboard Power BI - Horas por Empleado"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Reportes' }]}
        actions={
          <>
            <div className="flex items-center gap-2">
              <select
                className="border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2 text-sm"
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value))}
              >
                {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Semana {w}</option>
                ))}
              </select>
              <select
                className="border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] px-3 py-2 text-sm"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchReport}>
              Actualizar
            </Button>
            <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Exportar CSV
            </Button>
          </>
        }
      />
      <PageContent>
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Empleados</p>
                  <p className="text-2xl font-bold">{summary.totalEmployees}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horas Totales</p>
                  <p className="text-2xl font-bold">{summary.totalHours}h</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Promedio</p>
                  <p className="text-2xl font-bold">{summary.averageHours}h</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sin registro</p>
                  <p className="text-2xl font-bold">{summary.noEntry}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Legend */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Leyenda de Colores - Sistema de Horas</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-700">Verde: 40h exactas (✓)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-gray-700">Azul: Más de 40h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-700">Amarillo: 30-39h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span className="text-sm text-gray-700">Naranja: Menos de 30h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-gray-700">Rojo: Sin registro</span>
            </div>
          </div>
        </Card>

        {/* Drag & Drop Board */}
        <div className="grid grid-cols-5 gap-4">
          {renderDropZone(
            'green',
            'Completado',
            summary?.completed || 0,
            <div className="w-3 h-3 rounded-full bg-green-500" />
          )}
          {renderDropZone(
            'blue',
            'Horas Extra',
            summary?.overTime || 0,
            <div className="w-3 h-3 rounded-full bg-blue-500" />
          )}
          {renderDropZone(
            'yellow',
            'Parcial',
            summary?.partial || 0,
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
          )}
          {renderDropZone(
            'orange',
            'Bajo Registro',
            summary?.lowEntry || 0,
            <div className="w-3 h-3 rounded-full bg-orange-500" />
          )}
          {renderDropZone(
            'red',
            'Sin Registro',
            summary?.noEntry || 0,
            <div className="w-3 h-3 rounded-full bg-red-500" />
          )}
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-2">💡 Cómo usar este panel:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Arrastra las tarjetas de empleados entre columnas para categorizarlos manualmente</li>
              <li>El color se asigna automáticamente según las horas registradas:</li>
              <li className="ml-5">• <strong>Verde</strong>: Cumplió exactamente 40 horas semanales</li>
              <li className="ml-5">• <strong>Azul</strong>: Trabajó más de 40 horas (horas extra)</li>
              <li className="ml-5">• <strong>Amarillo</strong>: Entre 30 y 39 horas (parcial)</li>
              <li className="ml-5">• <strong>Naranja</strong>: Menos de 30 horas (bajo registro)</li>
              <li className="ml-5">• <strong>Rojo</strong>: No registró horas esta semana</li>
              <li>Exporta los datos a CSV para análisis externos</li>
            </ul>
          </div>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
