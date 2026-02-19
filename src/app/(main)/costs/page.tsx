'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, KPICard, Badge } from '@/components/ui';
import { Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, AlertTriangle } from 'lucide-react';
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
      // Fetch projects with costs
      const projectsRes = await fetch('/api/projects?withCosts=true');
      const projectsData = await projectsRes.json();
      
      if (projectsData.success) {
        const projectsWithCosts = projectsData.data || [];
        setProjects(projectsWithCosts);
        
        // Calculate summary
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

      // Fetch resources with costs
      const resourcesRes = await fetch('/api/resources?withCosts=true');
      const resourcesData = await resourcesRes.json();
      
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
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
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
              <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchCostData}>
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
                icon={<DollarSign className="h-5 w-5" />}
              />
              <KPICard
                label="Costo Real"
                value={`$${summary.totalActualCost.toLocaleString()}`}
                trend={parseFloat(utilization as string) > 100 ? 'up' : 'down'}
                trendValue={`${utilization}% utilizado`}
                icon={<BarChart3 className="h-5 w-5" />}
              />
              <KPICard
                label="Ganancia Neta"
                value={`$${summary.totalProfit.toLocaleString()}`}
                trend={summary.totalProfit >= 0 ? 'up' : 'down'}
                trendValue={`${summary.averageProfitMargin.toFixed(1)}% margen`}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <KPICard
                label="Proyectos Rentables"
                value={`${summary.profitableProjects}/${projects.length}`}
                trend={summary.lossProjects > 0 ? 'down' : 'stable'}
                trendValue={summary.lossProjects > 0 ? `${summary.lossProjects} con pérdida` : 'Todos rentables'}
                icon={<PieChart className="h-5 w-5" />}
              />
            </div>

            {/* Budget vs Actual Chart */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
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
                          <span className="text-[var(--color-text-primary)] truncate flex-1">{project.name}</span>
                          <span className={`text-xs ${overBudget ? 'text-red-600' : 'text-[var(--color-text-secondary)]'}`}>
                            ${project.actualCost.toLocaleString()} / ${project.budget.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              overBudget ? 'bg-red-500' : 'bg-[var(--color-primary)]'
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
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
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
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-hover-row)] cursor-pointer transition-colors"
                          onClick={() => setSelectedProject(project)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                {project.name}
                              </span>
                              <Badge severity={status.severity}>{status.label}</Badge>
                            </div>
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              {project.client || 'Sin cliente'} · {project.billable ? 'Facturable' : 'Interno'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {project.profit >= 0 ? '+' : ''}${project.profit.toLocaleString()}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)]">
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
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Costos por Recurso
                  </h3>
                  <Link href="/resources">
                    <Button variant="ghost" size="compact">Ver todos</Button>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--color-border-subtle)]">
                        <th className="text-left py-2 text-xs font-medium text-[var(--color-text-secondary)]">Recurso</th>
                        <th className="text-right py-2 text-xs font-medium text-[var(--color-text-secondary)]">Tarifa/Hora</th>
                        <th className="text-right py-2 text-xs font-medium text-[var(--color-text-secondary)]">Horas Totales</th>
                        <th className="text-right py-2 text-xs font-medium text-[var(--color-text-secondary)]">Costo Total</th>
                        <th className="text-left py-2 text-xs font-medium text-[var(--color-text-secondary)]">Proyectos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {resources.slice(0, 5).map(resource => (
                        <tr key={resource.id} className="hover:bg-[var(--color-hover-row)]">
                          <td className="py-3 text-sm text-[var(--color-text-primary)]">{resource.userName}</td>
                          <td className="py-3 text-sm text-[var(--color-text-primary)] text-right">
                            ${resource.hourlyRate}/h
                          </td>
                          <td className="py-3 text-sm text-[var(--color-text-primary)] text-right">
                            {resource.totalHours}h
                          </td>
                          <td className="py-3 text-sm font-medium text-[var(--color-text-primary)] text-right">
                            ${resource.totalCost.toLocaleString()}
                          </td>
                          <td className="py-3 text-sm text-[var(--color-text-secondary)]">
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
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                Todos los Proyectos - Detalle Financiero
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <th className="text-left py-2 text-xs font-medium text-[var(--color-text-secondary)]">Proyecto</th>
                      <th className="text-left py-2 text-xs font-medium text-[var(--color-text-secondary)]">Cliente</th>
                      <th className="text-right py-2 text-xs font-medium text-[var(--color-text-secondary)]">Presupuesto</th>
                      <th className="text-right py-2 text-xs font-medium text-[var(--color-text-secondary)]">Costo Real</th>
                      <th className="text-right py-2 text-xs font-medium text-[var(--color-text-secondary)]">Ganancia</th>
                      <th className="text-right py-2 text-xs font-medium text-[var(--color-text-secondary)]">Margen</th>
                      <th className="text-center py-2 text-xs font-medium text-[var(--color-text-secondary)]">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {projects.map(project => {
                      const status = getProfitabilityStatus(project.profitMargin || 0);
                      return (
                        <tr key={project.id} className="hover:bg-[var(--color-hover-row)]">
                          <td className="py-3 text-sm font-medium text-[var(--color-text-primary)]">
                            {project.name}
                            <div className="text-xs text-[var(--color-text-secondary)]">{project.code}</div>
                          </td>
                          <td className="py-3 text-sm text-[var(--color-text-secondary)]">
                            {project.client || '—'}
                          </td>
                          <td className="py-3 text-sm text-[var(--color-text-primary)] text-right">
                            ${project.budget.toLocaleString()}
                          </td>
                          <td className="py-3 text-sm text-[var(--color-text-primary)] text-right">
                            ${project.actualCost.toLocaleString()}
                          </td>
                          <td className={`py-3 text-sm font-medium text-right ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {project.profit >= 0 ? '+' : ''}${project.profit.toLocaleString()}
                          </td>
                          <td className="py-3 text-sm text-[var(--color-text-primary)] text-right">
                            {project.profitMargin.toFixed(1)}%
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
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              No hay datos de costos disponibles
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
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
    </PageLayout>
  );
}
