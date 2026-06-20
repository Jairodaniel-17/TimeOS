'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card } from '@/components/ui';
import { AlertTriangle, Loader2, Plus, Search, X, Pencil, Trash2, User, Calendar, Clock, Briefcase } from 'lucide-react';
import type { Resource, ResourceAllocation, Project } from '@/types';
import { getWeekNumber, getCurrentYear } from '@/lib/utils';

interface ResourceWithUtilization extends Resource {
  totalAllocated: number;
  utilization: number;
  allocationsByWeek: Record<string, number>;
}

interface AllocationWithDetails extends ResourceAllocation {
  resourceName?: string;
  resourceSkills?: string[];
  projectName?: string;
  utilization?: number;
}

function buildWeekLabels(currentWeek: number): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const w = currentWeek - 2 + i;
    return `Sem ${String(w > 0 ? w : w + 52).padStart(2, '0')}`;
  });
}

export default function ResourcesPage() {
  const weeks = buildWeekLabels(getWeekNumber());
  const [activeTab, setActiveTab] = useState('heatmap');
  const [resources, setResources] = useState<ResourceWithUtilization[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<AllocationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<AllocationWithDetails | null>(null);
  const [allocationForm, setAllocationForm] = useState({
    resourceId: '',
    projectId: '',
    weekNumber: getWeekNumber(),
    year: getCurrentYear(),
    allocatedHours: 8,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterResource, setFilterResource] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const currentWeek = getWeekNumber();
        const currentYear = getCurrentYear();
        const weeks = buildWeekLabels(currentWeek);

        const [resourcesRes, allocationsRes, projectsRes] = await Promise.all([
          fetch('/api/resources'),
          fetch(`/api/allocations`),
          fetch('/api/projects'),
        ]);

        const resourcesData = await resourcesRes.json();
        const allocationsData = await allocationsRes.json();
        const projectsData = await projectsRes.json();

        if (resourcesData.success && allocationsData.success && projectsData.success) {
          const resourcesList: Resource[] = resourcesData.data;
          const allAllocations: ResourceAllocation[] = allocationsData.data;
          const projectsList: Project[] = projectsData.data;

          setAllResources(resourcesList);
          setAllProjects(projectsList);

          const currentWeekAllocations = allAllocations.filter(a =>
            a.weekNumber === currentWeek && a.year === currentYear
          );

          const resourcesWithUtilization: ResourceWithUtilization[] = resourcesList.map(resource => {
            const resourceAllocations = currentWeekAllocations.filter(a => a.resourceId === resource.id);
            const totalAllocated = resourceAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);

            const allocationsByWeek: Record<string, number> = {};
            weeks.forEach((week, index) => {
              const targetWeek = currentWeek - 2 + index;
              const weekAllocations = allAllocations.filter(a =>
                a.weekNumber === targetWeek && a.year === currentYear && a.resourceId === resource.id
              );
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

          const allocationsWithDetails: AllocationWithDetails[] = allAllocations.map(a => {
            const resource = resourcesList.find(r => r.id === a.resourceId);
            const project = projectsList.find(p => p.id === a.projectId);
            return {
              ...a,
              resourceName: resource?.user?.name || 'Unknown',
              resourceSkills: resource?.skills || [],
              projectName: project?.name || 'Unknown Project',
              utilization: resource ? (a.allocatedHours / resource.capacity) * 100 : 0,
            };
          });

          setResources(resourcesWithUtilization);
          setAllocations(allocationsWithDetails);
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

  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => {
      const matchesSearch = !searchQuery || 
        a.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = !filterProject || a.projectId === filterProject;
      const matchesResource = !filterResource || a.resourceId === filterResource;
      return matchesSearch && matchesProject && matchesResource;
    });
  }, [allocations, searchQuery, filterProject, filterResource]);

  const openCreateModal = () => {
    setEditingAllocation(null);
    setAllocationForm({
      resourceId: '',
      projectId: '',
      weekNumber: getWeekNumber(),
      year: getCurrentYear(),
      allocatedHours: 8,
    });
    setFormError(null);
    setShowAllocationModal(true);
  };

  const openEditModal = (allocation: AllocationWithDetails) => {
    setEditingAllocation(allocation);
    setAllocationForm({
      resourceId: allocation.resourceId,
      projectId: allocation.projectId,
      weekNumber: allocation.weekNumber,
      year: allocation.year,
      allocatedHours: allocation.allocatedHours,
    });
    setFormError(null);
    setShowAllocationModal(true);
  };

  const handleSaveAllocation = async () => {
    if (!allocationForm.resourceId || !allocationForm.projectId) {
      setFormError('Por favor selecciona un recurso y un proyecto');
      return;
    }
    if (allocationForm.allocatedHours <= 0) {
      setFormError('Las horas asignadas deben ser mayores a 0');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingAllocation) {
        const res = await fetch('/api/allocations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAllocation.id,
            allocatedHours: allocationForm.allocatedHours,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } else {
        const res = await fetch('/api/allocations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(allocationForm),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      }
      
      const [resourcesRes, allocationsRes, projectsRes] = await Promise.all([
        fetch('/api/resources'),
        fetch('/api/allocations'),
        fetch('/api/projects'),
      ]);
      
      const resourcesData = await resourcesRes.json();
      const allocationsData = await allocationsRes.json();
      const projectsData = await projectsRes.json();

      if (resourcesData.success && allocationsData.success && projectsData.success) {
        const resourcesList: Resource[] = resourcesData.data;
        const allAllocations: ResourceAllocation[] = allocationsData.data;
        const projectsList: Project[] = projectsData.data;
        
        setAllResources(resourcesList);
        setAllProjects(projectsList);
        
        const currentWeek = getWeekNumber();
        const currentYear = getCurrentYear();
        const saveWeeks = buildWeekLabels(currentWeek);
        const currentWeekAllocations = allAllocations.filter(a =>
          a.weekNumber === currentWeek && a.year === currentYear
        );

        const resourcesWithUtilization: ResourceWithUtilization[] = resourcesList.map(resource => {
          const resourceAllocations = currentWeekAllocations.filter(a => a.resourceId === resource.id);
          const totalAllocated = resourceAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);

          const allocationsByWeek: Record<string, number> = {};
          saveWeeks.forEach((week, index) => {
            const targetWeek = currentWeek - 2 + index;
            const weekAllocations = allAllocations.filter(a =>
              a.weekNumber === targetWeek && a.year === currentYear && a.resourceId === resource.id
            );
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

        const allocationsWithDetails: AllocationWithDetails[] = allAllocations.map(a => {
          const resource = resourcesList.find(r => r.id === a.resourceId);
          const project = projectsList.find(p => p.id === a.projectId);
          return {
            ...a,
            resourceName: resource?.user?.name || 'Unknown',
            resourceSkills: resource?.skills || [],
            projectName: project?.name || 'Unknown Project',
            utilization: resource ? (a.allocatedHours / resource.capacity) * 100 : 0,
          };
        });

        setResources(resourcesWithUtilization);
        setAllocations(allocationsWithDetails);
      }
      
      setShowAllocationModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar la asignación');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (deletingIds.has(id)) return;
    if (!confirm('¿Eliminar este recurso? Se perderán todas sus asignaciones.')) return;
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAllResources(prev => prev.filter(r => r.id !== id));
      setResources(prev => prev.filter(r => r.id !== id));
      setAllocations(prev => prev.filter(a => a.resourceId !== id));
    } catch (err) {
      console.error('Error deleting resource:', err);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteAllocation = async (id: string) => {
    if (deletingIds.has(id)) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta asignación?')) return;

    setDeletingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/allocations?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setAllocations(prev => prev.filter(a => a.id !== id));
      
      const currentWeek = getWeekNumber();
      const currentYear = getCurrentYear();
      
      setResources(prev => prev.map(r => {
        const resourceAllocations = allocations.filter(a => 
          a.resourceId === r.id && a.id !== id && 
          a.weekNumber === currentWeek && a.year === currentYear
        );
        const totalAllocated = resourceAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
        return {
          ...r,
          totalAllocated,
          utilization: (totalAllocated / r.capacity) * 100,
        };
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la asignación');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 50) return 'bg-badge-subtle-success-bg text-redwood-green';
    if (utilization < 80) return 'bg-badge-subtle-info-bg text-redwood-primary';
    if (utilization <= 100) return 'bg-badge-subtle-warning-bg text-redwood-warning';
    return 'bg-badge-subtle-danger-bg text-redwood-danger';
  };

  if (loading) {
    return (
      <PageLayout>
        <Header
          title="Recursos"
          breadcrumbs={[{ label: 'TimeOS' }, { label: 'Recursos' }]}
        />
        <PageContent>
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 w-28 rounded-[14px] animate-pulse bg-redwood-solid-bg" />
            ))}
            <div className="h-9 w-32 rounded-[14px] animate-pulse bg-redwood-solid-bg ml-auto" />
          </div>
          <div className="h-10 rounded-[14px] animate-pulse bg-redwood-solid-bg mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-14 rounded-[14px] animate-pulse bg-redwood-solid-bg" style={{ opacity: 1 - i * 0.07 }} />
            ))}
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
      />
      <PageContent className="p-0">
        <div className="border-b border-redwood-border bg-redwood-surface px-6 py-2">
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
                  <thead className="bg-redwood-page">
                    <tr>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3 sticky left-0 bg-redwood-page border-r border-redwood-border min-w-[200px]">
                        Recurso
                      </th>
                      {weeks.map((week) => (
                        <th key={week} className="text-center text-xs font-medium text-redwood-muted px-2 py-3 min-w-[80px]">
                          {week}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-redwood-border">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="cursor-pointer hover:bg-redwood-hover-bg transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-redwood-surface border-r border-redwood-border">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-medium text-redwood-primary">
                              {resource.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{resource.user?.name}</span>
                                {resource.utilization > 100 && (
                                  <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" />
                                )}
                              </div>
                              <span className="text-xs text-redwood-muted">
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
                                className={`rounded-[10px] px-2 py-1.5 text-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${getUtilizationColor(utilization)}`}
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
                  <thead className="bg-redwood-page">
                    <tr>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                        Recurso
                      </th>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                        Capacidad (h/semana)
                      </th>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                        Asignado
                      </th>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                        Utilización
                      </th>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                        Skills
                      </th>
                      <th className="text-right text-xs font-medium text-redwood-muted px-4 py-3">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-redwood-border">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-redwood-hover-bg">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-medium text-redwood-primary">
                              {resource.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <span className="text-sm font-medium">{resource.user?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{resource.capacity}h</td>
                        <td className="px-4 py-3 text-sm">{resource.totalAllocated}h</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-redwood-border rounded-full overflow-hidden w-24">
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
                                className="text-xs px-2 py-1 bg-redwood-page rounded-full text-redwood-muted"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="subtle"
                            size="icon"
                            icon={<Trash2 className="h-4 w-4 text-[var(--color-error)]" />}
                            loading={deletingIds.has(resource.id)}
                            onClick={() => handleDeleteResource(resource.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-redwood-muted" />
                    <input
                      type="text"
                      placeholder="Buscar recurso o proyecto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 min-h-[40px] py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  >
                    <option value="">Todos los proyectos</option>
                    {allProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterResource}
                    onChange={(e) => setFilterResource(e.target.value)}
                    className="min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  >
                    <option value="">Todos los recursos</option>
                    {allResources.map((r) => (
                      <option key={r.id} value={r.id}>{r.user?.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={openCreateModal}
                >
                  Nueva Asignación
                </Button>
              </div>

              <Card padding="none">
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead className="bg-redwood-page">
                      <tr>
                        <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3 sticky left-0 bg-redwood-page border-r border-redwood-border">
                          Recurso
                        </th>
                        <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                          Proyecto
                        </th>
                        <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                          Semana
                        </th>
                        <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                          Horas Asignadas
                        </th>
                        <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">
                          Utilization
                        </th>
                        <th className="text-right text-xs font-medium text-redwood-muted px-4 py-3">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-redwood-border">
                      {filteredAllocations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-redwood-muted">
                            <div className="flex flex-col items-center gap-2">
                              <Briefcase className="h-8 w-8 opacity-50" />
                              <p className="text-sm">No se encontraron asignaciones</p>
                              <Button variant="subtle" size="compact" onClick={openCreateModal}>
                                Crear primera asignación
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredAllocations.map((allocation) => (
                          <tr key={allocation.id} className="hover:bg-redwood-hover-bg transition-colors">
                            <td className="px-4 py-3 sticky left-0 bg-redwood-surface border-r border-redwood-border">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-medium text-redwood-primary">
                                  {allocation.resourceName?.split(' ').map(n => n[0]).join('') || '?'}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{allocation.resourceName}</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {allocation.resourceSkills?.slice(0, 2).map((skill) => (
                                      <span key={skill} className="text-xs px-1.5 py-0.5 bg-redwood-page rounded text-redwood-muted">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-redwood-muted" />
                                <span className="text-sm">{allocation.projectName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-redwood-muted" />
                                <span className="text-sm">
                                  Sem {allocation.weekNumber}/{allocation.year}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-redwood-muted" />
                                <span className="text-sm font-medium">{allocation.allocatedHours}h</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-redwood-border rounded-full overflow-hidden w-20">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(allocation.utilization || 0, 100)}%`,
                                      backgroundColor: (allocation.utilization || 0) > 100 ? 'var(--color-error)' : 
                                        (allocation.utilization || 0) > 80 ? 'var(--color-warning)' : 'var(--color-success)',
                                    }}
                                  />
                                </div>
                                <span className={`text-xs font-medium ${
                                  (allocation.utilization || 0) > 100 ? 'text-[var(--color-error)]' : ''
                                }`}>
                                  {Math.round(allocation.utilization || 0)}%
                                </span>
                                {(allocation.utilization || 0) > 100 && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-error)]" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="subtle"
                                  size="icon"
                                  icon={<Pencil className="h-4 w-4" />}
                                  disabled={deletingIds.has(allocation.id)}
                                  onClick={() => openEditModal(allocation)}
                                  className="h-8 w-8"
                                />
                                <Button
                                  variant="subtle"
                                  size="icon"
                                  icon={<Trash2 className="h-4 w-4" />}
                                  loading={deletingIds.has(allocation.id)}
                                  onClick={() => handleDeleteAllocation(allocation.id)}
                                  className="h-8 w-8 text-redwood-danger hover:bg-badge-subtle-danger-bg"
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {filteredAllocations.length > 0 && (
                <div className="flex items-center justify-between text-sm text-redwood-muted">
                  <span>Mostrando {filteredAllocations.length} asignación(es)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {showAllocationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editingAllocation ? 'Editar Asignación' : 'Nueva Asignación'}
                </h3>
                <Button variant="subtle" size="icon" icon={<X className="h-5 w-5" />} onClick={() => setShowAllocationModal(false)} />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <User className="inline h-4 w-4 mr-1" />
                    Recurso
                  </label>
                  <select
                    value={allocationForm.resourceId}
                    onChange={(e) => setAllocationForm({ ...allocationForm, resourceId: e.target.value })}
                    disabled={!!editingAllocation}
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors disabled:bg-redwood-page"
                  >
                    <option value="">Seleccionar recurso...</option>
                    {allResources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.user?.name} ({r.capacity}h/semana)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Briefcase className="inline h-4 w-4 mr-1" />
                    Proyecto
                  </label>
                  <select
                    value={allocationForm.projectId}
                    onChange={(e) => setAllocationForm({ ...allocationForm, projectId: e.target.value })}
                    disabled={!!editingAllocation}
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors disabled:bg-redwood-page"
                  >
                    <option value="">Seleccionar proyecto...</option>
                    {allProjects.filter(p => p.status === 'active').map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Semana
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="53"
                      value={allocationForm.weekNumber}
                      onChange={(e) => setAllocationForm({ ...allocationForm, weekNumber: parseInt(e.target.value) || 1 })}
                      className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Año</label>
                    <input
                      type="number"
                      min="2020"
                      max="2030"
                      value={allocationForm.year}
                      onChange={(e) => setAllocationForm({ ...allocationForm, year: parseInt(e.target.value) || getCurrentYear() })}
                      className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Horas Asignadas
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="80"
                    step="0.5"
                    value={allocationForm.allocatedHours}
                    onChange={(e) => setAllocationForm({ ...allocationForm, allocatedHours: parseFloat(e.target.value) || 0 })}
                    className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-redwood-border bg-redwood-surface text-sm text-redwood-text placeholder:text-redwood-muted focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20 transition-colors"
                  />
                  {allocationForm.resourceId && (
                    <p className="text-xs text-redwood-muted mt-1">
                      Capacidad del recurso: {allResources.find(r => r.id === allocationForm.resourceId)?.capacity}h/semana
                    </p>
                  )}
                </div>

                {formError && (
                  <div className="p-3 bg-badge-subtle-danger-bg border border-redwood-danger rounded-[10px] text-sm text-redwood-danger">
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="subtle" onClick={() => setShowAllocationModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleSaveAllocation} loading={saving}>
                  {editingAllocation ? 'Guardar Cambios' : 'Crear Asignación'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
