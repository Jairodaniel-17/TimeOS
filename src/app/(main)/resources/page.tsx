'use client';

import { useState } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card } from '@/components/ui';
import { Filter, AlertTriangle } from 'lucide-react';

const weeks = ['Sem 05', 'Sem 06', 'Sem 07', 'Sem 08', 'Sem 09', 'Sem 10'];

const resources = [
  { id: '1', name: 'Carlos López', role: 'Developer', capacity: 40, allocated: 38, utilization: 95 },
  { id: '2', name: 'María Rodríguez', role: 'Designer', capacity: 40, allocated: 32, utilization: 80 },
  { id: '3', name: 'Pedro Sánchez', role: 'Developer', capacity: 40, allocated: 48, utilization: 120 },
  { id: '4', name: 'Laura Martínez', role: 'QA Engineer', capacity: 40, allocated: 28, utilization: 70 },
];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('heatmap');

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 50) return 'bg-[#E5F5ED] text-[var(--color-success)]';
    if (utilization < 80) return 'bg-[var(--color-primary-light)] text-[var(--color-primary)]';
    if (utilization <= 100) return 'bg-[#FFF4E5] text-[var(--color-warning)]';
    return 'bg-[#FDEAEA] text-[var(--color-error)]';
  };

  const generateWeekData = (base: number) => {
    const variation = Math.random() * 40 - 20;
    return Math.min(150, Math.max(20, base + variation));
  };

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
                              {resource.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{resource.name}</span>
                                {resource.utilization > 100 && (
                                  <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" />
                                )}
                              </div>
                              <span className="text-xs text-[var(--color-text-secondary)]">{resource.role}</span>
                            </div>
                          </div>
                        </td>
                        {weeks.map((week) => {
                          const utilization = generateWeekData(resource.utilization);
                          return (
                            <td key={week} className="px-2 py-3">
                              <div
                                className={`rounded-[var(--radius-sm)] px-2 py-1.5 text-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${getUtilizationColor(utilization)}`}
                              >
                                {utilization.toFixed(0)}%
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
          ) : (
            <Card>
              <p className="text-sm text-[var(--color-text-secondary)]">Vista en desarrollo...</p>
            </Card>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
