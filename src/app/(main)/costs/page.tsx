'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, KPICard, Badge } from '@/components/ui';
import { Download, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, X } from 'lucide-react';
import { usePermissions, PermissionGate } from '@/hooks/usePermissions';
import Link from 'next/link';

interface ProjectCost {
  id: string;
  name: string;
  code: string;
  client?: string;
  billable: boolean;
  budget: number;
  budgetHours: number;
  actualCost: number;
  actualHours: number;
  hourlyRate: number;
  currency: string;
  profit: number;
  profitMargin: number;
  eac?: number;
  cpi?: number;
  spi?: number;
}

function calcMetrics(p: ProjectCost): { eac: number; cpi: number; spi: number } {
  const pct = p.budgetHours > 0 ? Math.min(p.actualHours / p.budgetHours, 1) : 0;
  const ev = p.budget * pct;
  const cpi = p.actualCost > 0 ? ev / p.actualCost : 1;
  const eac = cpi > 0 ? p.budget / cpi : p.budget;
  const spi = p.budgetHours > 0 ? p.actualHours / p.budgetHours : 0;
  return { eac, cpi, spi };
}

interface ResourceCost {
  id: string;
  userId: string;
  userName: string;
  hourlyRate: number;
  monthlySalary?: number;
  totalHours: number;
  totalCost: number;
  projects: string[];
}

interface CostSummary {
  totalBudget: number;
  totalActualCost: number;
  totalProfit: number;
  averageProfitMargin: number;
  profitableProjects: number;
  lossProjects: number;
  billableRevenue: number;
}

export default function CostsDashboard() {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectCost[]>([]);
  const [resources, setResources] = useState<ResourceCost[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectCost | null>(null);

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    setLoading(true);
    try {
      const [projectsRes, resourcesRes] = await Promise.all([
        fetch('/api/projects?withCosts=true'),
        fetch('/api/resources?withCosts=true'),
      ]);
      const [projectsData, resourcesData] = await Promise.all([
        projectsRes.json(),
        resourcesRes.json(),
      ]);

      if (projectsData.success) {
        const projectsWithCosts = projectsData.data || [];
        setProjects(projectsWithCosts);

        const summaryData: CostSummary = {
          totalBudget: projectsWithCosts.reduce((sum: number, p: ProjectCost) => sum + (p.budget || 0), 0),
          totalActualCost: projectsWithCosts.reduce((sum: number, p: ProjectCost) => sum + (p.actualCost || 0), 0),
          totalProfit: projectsWithCosts.reduce((sum: number, p: ProjectCost) => sum + (p.profit || 0), 0),
          averageProfitMargin: projectsWithCosts.length > 0
            ? projectsWithCosts.reduce((sum: number, p: ProjectCost) => sum + (p.profitMargin || 0), 0) / projectsWithCosts.length
            : 0,
          profitableProjects: projectsWithCosts.filter((p: ProjectCost) => (p.profit || 0) > 0).length,
          lossProjects: projectsWithCosts.filter((p: ProjectCost) => (p.profit || 0) < 0).length,
          billableRevenue: projectsWithCosts
            .filter((p: ProjectCost) => p.billable)
            .reduce((sum: number, p: ProjectCost) => sum + ((p.actualHours || 0) * (p.hourlyRate || 0)), 0),
        };
        setSummary(summaryData);
      }

      if (resourcesData.success) {
        setResources(resourcesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Proyecto', 'Cliente', 'Presupuesto', 'Costo Real', 'Ganancia', 'Margen %', 'Estado'].join(','),
      ...projects.map(p => [
        p.name,
        p.client || 'N/A',
        p.budget || 0,
        p.actualCost || 0,
        p.profit || 0,
        `${(p.profitMargin || 0).toFixed(1)}%`,
        (p.profit || 0) >= 0 ? 'Rentable' : 'Pérdida',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-costos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Calculate utilization
  const utilization = useMemo(() => {
    if (!summary || summary.totalBudget === 0) return 0;
    return ((summary.totalActualCost / summary.totalBudget) * 100).toFixed(1);
  }, [summary]);

  // Get profitability status
  const getProfitabilityStatus = (margin: number): { label: string; severity: 'success' | 'warning' | 'error' } => {
    if (margin >= 30) return { label: 'Excelente', severity: 'success' };
    if (margin >= 15) return { label: 'Bueno', severity: 'success' };
    if (margin >= 0) return { label: 'Regular', severity: 'warning' };
    return { label: 'Pérdida', severity: 'error' };
  };

  if (loading) {
    return (
      <PageLayout>
        <Header
          title="Dashboard de Costos y Rentabilidad"
          breadcrumbs={[{ label: 'TimeOS' }, { label: 'Costos' }]}
        />
        <PageContent className="flex items-center justify-center">
          <div className="text-center py-12 text-redwood-muted">
            Cargando datos de costos...
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Dashboard de Costos y Rentabilidad"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Costos' }]}
        actions={
          <PermissionGate permission="reports:costs">
            <>
              <Button variant="subtle" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchCostData}>
                Actualizar
              </Button>
              <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
                Exportar CSV
              </Button>
            </>
          </PermissionGate>
        }
      />
      <PageContent>
        {summary && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KPICard
                label="Presupuesto Total"
                value={`$${summary.totalBudget.toLocaleString()}`}
                accent="primary"
              />
              <KPICard
                label="Costo Real"
                value={`$${summary.totalActualCost.toLocaleString()}`}
                subtitle={`${utilization}% utilizado`}
                accent={parseFloat(utilization as string) > 100 ? 'danger' : 'neutral'}
              />
              <KPICard
                label="Ganancia Neta"
                value={`$${summary.totalProfit.toLocaleString()}`}
                trend={`${summary.averageProfitMargin.toFixed(1)}% margen`}
                accent={summary.totalProfit >= 0 ? 'success' : 'danger'}
              />
              <KPICard
                label="Proyectos Rentables"
                value={`${summary.profitableProjects}/${projects.length}`}
                subtitle={summary.lossProjects > 0 ? `${summary.lossProjects} con pérdida` : 'Todos rentables'}
                accent={summary.lossProjects > 0 ? 'warning' : 'success'}
              />
            </div>

            {/* Budget vs Actual Chart */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card>
                <h3 className="text-sm font-semibold text-redwood-text mb-4">
                  Comparativa Presupuesto vs Costo Real
                </h3>
                <div className="space-y-4">
                  {projects.slice(0, 5).map(project => {
                    const percentage = project.budget > 0 
                      ? Math.min((project.actualCost / project.budget) * 100, 100)
                      : 0;
                    const overBudget = project.actualCost > project.budget;
                    
                    return (
                      <div key={project.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-redwood-text truncate flex-1">{project.name}</span>
                          <span className={`text-xs ${overBudget ? 'text-red-600' : 'text-redwood-muted'}`}>
                            ${project.actualCost.toLocaleString()} / ${project.budget.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-redwood-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              overBudget ? 'bg-redwood-danger' : 'bg-redwood-primary'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {overBudget && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            Excedido en ${(project.actualCost - project.budget).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-redwood-text mb-4">
                  Rentabilidad por Proyecto
                </h3>
                <div className="space-y-3">
                  {projects
                    .sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0))
                    .slice(0, 5)
                    .map(project => {
                      const status = getProfitabilityStatus(project.profitMargin || 0);
                      return (
                        <div 
                          key={project.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-redwood-hover-bg cursor-pointer transition-colors"
                          onClick={() => setSelectedProject(project)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-redwood-text truncate">
                                {project.name}
                              </span>
                              <Badge severity={status.severity}>{status.label}</Badge>
                            </div>
                            <span className="text-xs text-redwood-muted">
                              {project.client || 'Sin cliente'} · {project.billable ? 'Facturable' : 'Interno'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {project.profit >= 0 ? '+' : ''}${project.profit.toLocaleString()}
                            </div>
                            <div className="text-xs text-redwood-muted">
                              {project.profitMargin.toFixed(1)}% margen
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>

            {/* Resource Costs */}
            <PermissionGate permission="resources:read">
              <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-redwood-text">
                    Costos por Recurso
                  </h3>
                  <Link href="/resources">
                    <Button variant="subtle" size="compact">Ver todos</Button>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-redwood-border">
                        <th className="text-left py-2 text-xs font-medium text-redwood-muted">Recurso</th>
                        <th className="text-right py-2 text-xs font-medium text-redwood-muted">Tarifa/Hora</th>
                        <th className="text-right py-2 text-xs font-medium text-redwood-muted">Horas Totales</th>
                        <th className="text-right py-2 text-xs font-medium text-redwood-muted">Costo Total</th>
                        <th className="text-left py-2 text-xs font-medium text-redwood-muted">Proyectos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-redwood-border">
                      {resources.slice(0, 5).map(resource => (
                        <tr key={resource.id} className="hover:bg-redwood-hover-bg">
                          <td className="py-3 text-sm text-redwood-text">{resource.userName}</td>
                          <td className="py-3 text-sm text-redwood-text text-right">
                            ${resource.hourlyRate}/h
                          </td>
                          <td className="py-3 text-sm text-redwood-text text-right">
                            {resource.totalHours}h
                          </td>
                          <td className="py-3 text-sm font-medium text-redwood-text text-right">
                            ${resource.totalCost.toLocaleString()}
                          </td>
                          <td className="py-3 text-sm text-redwood-muted">
                            {resource.projects.slice(0, 2).join(', ')}
                            {resource.projects.length > 2 && ` +${resource.projects.length - 2}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </PermissionGate>

            {/* All Projects Table */}
            <Card>
              <h3 className="text-sm font-semibold text-redwood-text mb-4">
                Todos los Proyectos - Detalle Financiero
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-redwood-border">
                      <th className="text-left py-2 text-xs font-medium text-redwood-muted">Proyecto</th>
                      <th className="text-left py-2 text-xs font-medium text-redwood-muted">Cliente</th>
                      <th className="text-right py-2 text-xs font-medium text-redwood-muted">Presupuesto</th>
                      <th className="text-right py-2 text-xs font-medium text-redwood-muted">Costo Real</th>
                      <th className="text-right py-2 text-xs font-medium text-redwood-muted">Ganancia</th>
                      <th className="text-right py-2 text-xs font-medium text-redwood-muted">Margen</th>
                      <th className="text-right py-2 text-xs font-medium text-redwood-muted" title="Estimate At Completion">EAC</th>
                      <th className="text-right py-2 text-xs font-medium text-redwood-muted" title="Cost Performance Index">CPI</th>
                      <th className="text-right py-2 text-xs font-medium text-redwood-muted" title="Schedule Performance Index">SPI</th>
                      <th className="text-center py-2 text-xs font-medium text-redwood-muted">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-redwood-border">
                    {projects.map(project => {
                      const status = getProfitabilityStatus(project.profitMargin || 0);
                      const { eac, cpi, spi } = calcMetrics(project);
                      return (
                        <tr key={project.id} className="hover:bg-redwood-hover-bg">
                          <td className="py-3 text-sm font-medium text-redwood-text">
                            {project.name}
                            <div className="text-xs text-redwood-muted">{project.code}</div>
                          </td>
                          <td className="py-3 text-sm text-redwood-muted">
                            {project.client || '—'}
                          </td>
                          <td className="py-3 text-sm text-redwood-text text-right">
                            ${project.budget.toLocaleString()}
                          </td>
                          <td className="py-3 text-sm text-redwood-text text-right">
                            ${project.actualCost.toLocaleString()}
                          </td>
                          <td className={`py-3 text-sm font-medium text-right ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {project.profit >= 0 ? '+' : ''}${project.profit.toLocaleString()}
                          </td>
                          <td className="py-3 text-sm text-redwood-text text-right">
                            {project.profitMargin.toFixed(1)}%
                          </td>
                          <td className="py-3 text-sm text-redwood-text text-right" title="Costo estimado al completar">
                            ${eac.toLocaleString('es', { maximumFractionDigits: 0 })}
                          </td>
                          <td className={`py-3 text-sm font-medium text-right ${cpi >= 1 ? 'text-green-600' : 'text-red-600'}`} title="Índice de rendimiento de costo (>1 = bajo presupuesto)">
                            {cpi.toFixed(2)}
                          </td>
                          <td className={`py-3 text-sm font-medium text-right ${spi >= 1 ? 'text-green-600' : 'text-amber-600'}`} title="Índice de rendimiento de cronograma (>1 = adelantado)">
                            {spi.toFixed(2)}
                          </td>
                          <td className="py-3 text-center">
                            <Badge severity={status.severity}>{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {!summary && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-redwood-text mb-2">
              No hay datos de costos disponibles
            </h3>
            <p className="text-sm text-redwood-muted mb-4">
              Los proyectos necesitan tener configurados presupuestos y las horas registradas para calcular costos.
            </p>
            <PermissionGate permission="projects:update">
              <Link href="/projects">
                <Button variant="primary">Configurar Proyectos</Button>
              </Link>
            </PermissionGate>
          </div>
        )}
      </PageContent>

      {/* Project detail modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-redwood-text">{selectedProject.name}</h3>
                <p className="text-sm text-redwood-muted">{selectedProject.code} · {selectedProject.client || 'Sin cliente'}</p>
              </div>
              <Button variant="subtle" size="icon" icon={<X className="h-4 w-4" />} onClick={() => setSelectedProject(null)} />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-redwood-page">
                <p className="text-xs text-redwood-muted mb-1">Presupuesto</p>
                <p className="text-lg font-bold text-redwood-text">${selectedProject.budget.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-redwood-page">
                <p className="text-xs text-redwood-muted mb-1">Costo Real</p>
                <p className={`text-lg font-bold ${selectedProject.actualCost > selectedProject.budget ? 'text-redwood-danger' : 'text-redwood-text'}`}>
                  ${selectedProject.actualCost.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-redwood-page">
                <p className="text-xs text-redwood-muted mb-1">Ganancia Neta</p>
                <p className={`text-lg font-bold ${selectedProject.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedProject.profit >= 0 ? '+' : ''}${selectedProject.profit.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-redwood-page">
                <p className="text-xs text-redwood-muted mb-1">Margen</p>
                <p className={`text-lg font-bold ${selectedProject.profitMargin >= 15 ? 'text-green-600' : selectedProject.profitMargin >= 0 ? 'text-redwood-warning' : 'text-red-600'}`}>
                  {selectedProject.profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-redwood-muted">
              <div className="flex justify-between">
                <span>Horas presupuestadas</span>
                <span className="font-medium text-redwood-text">{selectedProject.budgetHours}h</span>
              </div>
              <div className="flex justify-between">
                <span>Horas reales</span>
                <span className="font-medium text-redwood-text">{selectedProject.actualHours}h</span>
              </div>
              <div className="flex justify-between">
                <span>Tarifa/hora</span>
                <span className="font-medium text-redwood-text">${selectedProject.hourlyRate}/h</span>
              </div>
              <div className="flex justify-between">
                <span>Tipo</span>
                <span className="font-medium text-redwood-text">{selectedProject.billable ? 'Facturable' : 'Interno'}</span>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Link href="/projects">
                <Button variant="subtle" size="compact">Ver en Proyectos</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
