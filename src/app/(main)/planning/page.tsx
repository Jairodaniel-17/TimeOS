'use client';

import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { Plus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

const tasks = [
  { id: '1', name: 'Diseño inicial', assignee: 'María Rodríguez', progress: 100, start: 0, duration: 1 },
  { id: '2', name: 'Desarrollo frontend', assignee: 'Carlos López', progress: 35, start: 0.5, duration: 2.5 },
  { id: '3', name: 'Desarrollo backend', assignee: 'Pedro Sánchez', progress: 20, start: 0.5, duration: 3 },
  { id: '4', name: 'Testing', assignee: 'Laura Martínez', progress: 0, start: 3, duration: 2 },
  { id: '5', name: 'Deploy', assignee: 'Carlos López', progress: 0, start: 5, duration: 0.5 },
];

const weeks = ['Sem 08', 'Sem 09', 'Sem 10', 'Sem 11', 'Sem 12'];

export default function PlanningPage() {
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'var(--color-border-subtle)';
    if (progress < 34) return 'var(--color-warning)';
    if (progress < 67) return 'var(--color-primary)';
    return 'var(--color-success)';
  };

  return (
    <PageLayout>
      <Header
        title="Planificación"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Planificación' }]}
        actions={
          <>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
              Nueva tarea
            </Button>
            <div className="flex items-center gap-1 border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)]">
              <Button variant="ghost" size="icon" icon={<ZoomOut className="h-4 w-4" />} />
              <select className="h-8 border-0 bg-transparent text-sm px-2 focus:outline-none">
                <option value="week">Week</option>
                <option value="day">Day</option>
              </select>
              <Button variant="ghost" size="icon" icon={<ZoomIn className="h-4 w-4" />} />
            </div>
          </>
        }
      />
      <PageContent className="p-0">
        <div className="flex h-full">
          <div className="w-80 border-r border-[var(--color-border-subtle)] bg-white flex flex-col">
            <div className="grid grid-cols-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-xs font-medium text-[var(--color-text-secondary)]">
              <div className="px-3 py-2">ID</div>
              <div className="px-3 py-2 col-span-2">Tarea</div>
            </div>
            <div className="flex-1 overflow-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-3 border-b border-[var(--color-border-subtle)] text-sm cursor-pointer hover:bg-[var(--color-hover-row)]"
                >
                  <div className="px-3 py-3 text-[var(--color-text-secondary)]">{task.id}</div>
                  <div className="px-3 py-3 col-span-2">
                    <div className="font-medium">{task.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${task.progress}%`,
                            backgroundColor: getProgressColor(task.progress),
                          }}
                        />
                      </div>
                      <span className="text-xs text-[var(--color-text-secondary)]">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] bg-white px-4 py-2">
              <Button variant="ghost" size="icon" icon={<ChevronLeft className="h-4 w-4" />} />
              <span className="text-sm font-medium">Febrero - Marzo 2025</span>
              <Button variant="ghost" size="icon" icon={<ChevronRight className="h-4 w-4" />} />
            </div>

            <div className="flex-1 overflow-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] text-xs font-medium text-[var(--color-text-secondary)] sticky top-0">
                  {weeks.map((week) => (
                    <div key={week} className="px-4 py-2 border-r border-[var(--color-border-subtle)] last:border-r-0">
                      {week}
                    </div>
                  ))}
                </div>

                <div className="relative" style={{ height: `${tasks.length * 48}px` }}>
                  {weeks.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-[var(--color-border-subtle)] last:border-r-0"
                      style={{ left: `${(i + 1) * 20}%` }}
                    />
                  ))}

                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="absolute h-10 flex items-center"
                      style={{ top: `${index * 48 + 4}px`, width: '100%' }}
                    >
                      <div
                        className="absolute h-7 rounded-[var(--radius-sm)] cursor-pointer transition-all hover:shadow-md"
                        style={{
                          left: `${task.start * 20}%`,
                          width: `${task.duration * 20}%`,
                          backgroundColor: task.progress === 100 ? 'var(--color-success)' : 'var(--color-primary)',
                        }}
                      >
                        <div
                          className="h-full rounded-l-[var(--radius-sm)]"
                          style={{
                            width: `${task.progress}%`,
                            backgroundColor: 'rgba(255,255,255,0.3)',
                          }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium truncate">
                          {task.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
