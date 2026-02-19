'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button } from '@/components/ui';
import { Download, RefreshCw } from 'lucide-react';

const LuckysheetNoSSR = dynamic(() => import('@/components/LuckysheetWrapper'), { ssr: false });

interface Project {
  id: string;
  name: string;
  client?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress: number;
}

interface Task {
  id: string;
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  assigneeId?: string;
}

export default function SpreadsheetPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
      ]);
      
      const projectsData = await projectsRes.json();
      const tasksData = await tasksRes.json();
      
      if (projectsData.success) setProjects(projectsData.data);
      if (tasksData.success) setTasks(tasksData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const spreadsheetData = useMemo(() => {
    const projectHeaders = ['ID', 'Proyecto', 'Cliente', 'Estado', 'Inicio', 'Fin', 'Presupuesto', 'Avance %'];
    const taskHeaders = ['ID', 'Tarea', 'Proyecto', 'Inicio', 'Fin', 'Estado', 'Avance %'];

    const projectRows = projects.map(p => [
      p.id.substring(0, 8),
      p.name,
      p.client || '-',
      p.status,
      p.startDate || '-',
      p.endDate || '-',
      p.budget || 0,
      p.progress
    ]);

    const taskRows = tasks.map(t => [
      t.id.substring(0, 8),
      t.name,
      projects.find(p => p.id === t.projectId)?.name || '-',
      t.startDate,
      t.endDate,
      t.status,
      t.progress
    ]);

    const summaryData: string[][] = [
      ['Métricas', 'Valor'],
      ['Total Proyectos', String(projects.length)],
      ['Proyectos Activos', String(projects.filter(p => p.status === 'active').length)],
      ['Proyectos Completados', String(projects.filter(p => p.status === 'completed').length)],
      ['Total Tareas', String(tasks.length)],
      ['Tareas Completadas', String(tasks.filter(t => t.status === 'done').length)],
      ['Tareas en Progreso', String(tasks.filter(t => t.status === 'in_progress').length)],
    ];

    return [
      { name: 'Proyectos', data: [projectHeaders, ...projectRows] },
      { name: 'Tareas', data: [taskHeaders, ...taskRows] },
      { name: 'Resumen', data: summaryData },
    ];
  }, [projects, tasks]);

  const exportToExcel = () => {
    alert('Exportar a Excel - Funcionalidad en desarrollo');
  };

  const refreshData = () => {
    fetchData();
  };

  return (
    <PageLayout>
      <Header
        title="Hoja de Cálculo - Smartsheet Style"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Hoja de Cálculo' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="compact" icon={<RefreshCw className="h-4 w-4" />} onClick={refreshData}>
              Actualizar
            </Button>
            <Button variant="secondary" size="compact" icon={<Download className="h-4 w-4" />} onClick={exportToExcel}>
              Exportar Excel
            </Button>
          </div>
        }
      />
      <PageContent className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Cargando hoja de cálculo...</div>
          </div>
        ) : (
          <div className="w-full h-[calc(100vh-140px)]">
            <LuckysheetNoSSR data={spreadsheetData} />
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
