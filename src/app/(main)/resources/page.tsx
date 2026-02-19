'use client';

import { useState, useEffect } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card } from '@/components/ui';
import { Filter, AlertTriangle, Loader2 } from 'lucide-react';
import type { Resource, ResourceAllocation } from '@/types';
import { getWeekNumber, getCurrentYear } from '@/lib/utils';

const weeks = ['Sem 05', 'Sem 06', 'Sem 07', 'Sem 08', 'Sem 09', 'Sem 10'];

interface ResourceWithUtilization extends Resource {
  totalAllocated: number;
  utilization: number;
  allocationsByWeek: Record<string, number>;
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('heatmap');
  const [resources, setResources] = useState<ResourceWithUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const currentWeek = getWeekNumber();
        const currentYear = getCurrentYear();
        
        // Fetch resources and allocations
        const [resourcesRes, allocationsRes] = await Promise.all([
          fetch('/api/resources'),
          fetch(`/api/allocations?weekNumber=${currentWeek}&year=${currentYear}`),
        ]);

        const resourcesData = await resourcesRes.json();
        const allocationsData = await allocationsRes.json();

        if (resourcesData.success && allocationsData.success) {
          const resourcesList: Resource[] = resourcesData.data;
          const allocations: ResourceAllocation[] = allocationsData.data;

          // Calculate utilization for each resource
          const resourcesWithUtilization: ResourceWithUtilization[] = resourcesList.map(resource => {
            const resourceAllocations = allocations.filter(a => a.resourceId === resource.id);
            const totalAllocated = resourceAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
            
            // Create weekly allocation map
            const allocationsByWeek: Record<string, number> = {};
            weeks.forEach((week, index) => {
              const weekAllocations = resourceAllocations.filter(a => {
                // Simulate different weeks by using index
                const weekOffset = index - 3; // Center around current week
                const targetWeek = currentWeek + weekOffset;
                return a.weekNumber === targetWeek && a.year === currentYear;
              });
              const weekHours = weekAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
              allocationsByWeek[week] = (weekHours / resource.capacity) * 100;
            });

            return {
              ...resource,
              totalAllocated,
              utilization: (totalAllocated / resource.capacity) * 100,
              allocationsByWeek,
            };
          });

          setResources(resourcesWithUtilization);
        } else {
          setError('Error al cargar los datos');
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 50) return 'bg-[#E5F5ED] text-[var(--color-success)]';
    if (utilization < 80) return 'bg-[var(--color-primary-light)] text-[var(--color-primary)]';
    if (utilization <= 100) return 'bg-[#FFF4E5] text-[var(--color-warning)]';
    return 'bg-[#FDEAEA] text-[var(--color-error)]';
  };

  if (loading) {
    return (
      <PageLayout>
        <Header
          title="Recursos"
          breadcrumbs={[{ label: 'TimeOS' }, { label: 'Recursos' }]}
        />
        <PageContent className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando...</span>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <Header
          title="Recursos"
          breadcrumbs={[{ label: 'TimeOS' }, { label: 'Recursos' }]}
        />
        <PageContent className="flex items-center justify-center">
          <div className="text-[var(--color-error)]">{error}</div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Recursos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Recursos' }]}
        actions={
          <Button variant="secondary" icon={<Filter className="h-4 w-4" />}>
            Filtros
          </Button>
        }
      />
      <PageContent className="p-0">
        <div className="border-b border-[var(--color-border-subtle)] bg-white px-6 py-2">
          <Tabs
            tabs={[
              { id: 'heatmap', label: 'Heatmap' },
              { id: 'capacity', label: 'Capacidad' },
              { id: 'assignments', label: 'Asignaciones' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="p-6">
          {activeTab === 'heatmap' ? (
            <Card padding="none">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-bg-page)]">
                    <tr>
                      <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3 sticky left-0 bg-[var(--color-bg-page)] border-r border-[var(--color-border-subtle)] min-w-[200px]">
                        Recurso
                      </th>
                      {weeks.map((week) => (
                        <th key={week} className="text-center text-xs font-medium text-[var(--color-text-secondary)] px-2 py-3 min-w-[80px]">
                          {week}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="cursor-pointer hover:bg-[var(--color-hover-row)] transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-white border-r border-[var(--color-border-subtle)]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-medium text-[var(--color-primary)]">
                              {resource.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{resource.user?.name}</span>
                                {resource.utilization > 100 && (
                                  <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" />
                                )}
                              </div>
                              <span className="text-xs text-[var(--color-text-secondary)]">
                                {resource.skills?.slice(0, 2).join(', ') || 'Sin skills'}
                              </span>
                            </div>
                          </div>
                        </td>
                        {weeks.map((week) => {
                          const utilization = resource.allocationsByWeek[week] || 0;
                          return (
                            <td key={week} className="px-2 py-3">
                              <div
                                className={`rounded-[var(--radius-sm)] px-2 py-1.5 text-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${getUtilizationColor(utilization)}`}
                              >
                                {Math.round(utilization)}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : activeTab === 'capacity' ? (
            <Card padding="none">
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-bg-page)]">
                    <tr>
                      <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3">
                        Recurso
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3">
                        Capacidad (h/semana)
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3">
                        Asignado
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3">
                        Utilización
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3">
                        Skills
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-[var(--color-hover-row)]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-medium text-[var(--color-primary)]">
                              {resource.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <span className="text-sm font-medium">{resource.user?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{resource.capacity}h</td>
                        <td className="px-4 py-3 text-sm">{resource.totalAllocated}h</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden w-24">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(resource.utilization, 100)}%`,
                                  backgroundColor: resource.utilization > 100 ? 'var(--color-error)' : 
                                    resource.utilization > 80 ? 'var(--color-warning)' : 'var(--color-success)',
                                }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${
                              resource.utilization > 100 ? 'text-[var(--color-error)]' : ''
                            }`}>
                              {Math.round(resource.utilization)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {resource.skills?.map((skill) => (
                              <span
                                key={skill}
                                className="text-xs px-2 py-1 bg-[var(--color-bg-page)] rounded-full text-[var(--color-text-secondary)]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-[var(--color-text-secondary)]">Vista de asignaciones en desarrollo...</p>
            </Card>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
