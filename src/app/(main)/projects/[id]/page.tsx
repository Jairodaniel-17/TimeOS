'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { PhaseTimeline } from '@/components/projects/PhaseTimeline';
import { PhaseApprovalModal } from '@/components/projects/PhaseApprovalModal';
import { 
  ArrowLeft, Edit2, Trash2, Calendar, DollarSign, Clock, 
  Building2, TrendingUp, CheckCircle
} from 'lucide-react';
import type { ProjectWithPhases, PhaseWithApproval } from '@/types';

interface ProjectDetail extends ProjectWithPhases {
  phases: PhaseWithApproval[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseWithApproval | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
      setCanApprove(user.role === 'admin' || user.role === 'manager');
    }
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const [projectRes, phasesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/phases`),
      ]);

      const projectData = await projectRes.json();
      const phasesData = await phasesRes.json();

      if (projectData.success) {
        setProject({
          ...projectData.data,
          phases: phasesData.success ? phasesData.data : [],
        });
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePhase = (phase: PhaseWithApproval) => {
    setSelectedPhase(phase);
    setShowApprovalModal(true);
  };

  const handlePhaseApproved = () => {
    fetchProject();
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/projects');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEdit = async (updates: Partial<ProjectDetail>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchProject();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge severity="success">Activo</Badge>;
      case 'on_hold': return <Badge severity="warning">En Pausa</Badge>;
      case 'completed': return <Badge severity="info">Completado</Badge>;
      case 'archived': return <Badge severity="error">Archivado</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <Header title="Cargando..." breadcrumbs={[{ label: 'TimeOS' }, { label: 'Proyectos' }]} />
        <PageContent className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </PageContent>
      </PageLayout>
    );
  }

  if (!project) {
    return (
      <PageLayout>
        <Header title="Proyecto no encontrado" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Proyectos' }]} />
        <PageContent className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-redwood-muted mb-4">El proyecto no existe o ha sido eliminado.</p>
            <Button variant="primary" onClick={() => router.push('/projects')}>
              Volver a Proyectos
            </Button>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const totalHours = project.phases?.reduce((sum, p) => sum + (p.actualHours || 0), 0) || 0;
  const totalCost = project.phases?.reduce((sum, p) => sum + (p.actualCost || 0), 0) || 0;
  const completedPhases = project.phases?.filter(p => p.status === 'completed').length || 0;
  const progress = project.phases?.length ? Math.round((completedPhases / project.phases.length) * 100) : 0;

  return (
    <PageLayout>
      <Header
        title={project.name}
        breadcrumbs={[
          { label: 'TimeOS' },
          { label: 'Proyectos', href: '/projects' },
          { label: project.name },
        ]}
        actions={
          <div className="flex gap-2">
            {canApprove && (
              <>
                <Button variant="subtle" icon={<Edit2 className="h-4 w-4" />} onClick={() => setShowEditModal(true)}>
                  Editar
                </Button>
                <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setShowDeleteConfirm(true)}>
                  Eliminar
                </Button>
              </>
            )}
          </div>
        }
      />
      
      <PageContent>
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/projects')} className="mb-4">
          Volver
        </Button>

        <Card className="mb-6">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-redwood-muted mb-1">
                <Building2 className="h-4 w-4" />
                Cliente
              </div>
              <p className="font-medium">{project.client || 'Sin cliente'}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-redwood-muted mb-1">
                <Calendar className="h-4 w-4" />
                Fechas
              </div>
              <p className="font-medium">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-redwood-muted mb-1">
                <DollarSign className="h-4 w-4" />
                Presupuesto
              </div>
              <p className="font-medium">${(project.budget || 0).toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-redwood-muted mb-1">
                <TrendingUp className="h-4 w-4" />
                Estado
              </div>
              {getStatusBadge(project.status || 'active')}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-badge-subtle-info-bg border-redwood-selected-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-redwood-info rounded-lg text-white">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-redwood-info">Fases Completadas</p>
                <p className="text-2xl font-bold text-redwood-text">{completedPhases}/{project.phases?.length || 10}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-badge-subtle-success-bg border-redwood-green/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-redwood-green rounded-lg text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-redwood-green">Horas Totales</p>
                <p className="text-2xl font-bold text-redwood-text">{totalHours}h</p>
              </div>
            </div>
          </Card>
          <Card className="bg-redwood-selected-bg border-redwood-selected-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-redwood-primary rounded-lg text-white">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-redwood-primary">Costo Real</p>
                <p className="text-2xl font-bold text-redwood-text">${totalCost.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-badge-subtle-warning-bg border-redwood-warning/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-redwood-warning rounded-lg text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-redwood-warning">Progreso</p>
                <p className="text-2xl font-bold text-redwood-text">{progress}%</p>
              </div>
            </div>
          </Card>
        </div>

        <PhaseTimeline 
          phases={project.phases || []} 
          onApprovePhase={handleApprovePhase}
          canApprove={canApprove}
        />

        {showApprovalModal && selectedPhase && (
          <PhaseApprovalModal
            phase={selectedPhase}
            projectId={projectId}
            currentUserId={currentUserId}
            onClose={() => {
              setShowApprovalModal(false);
              setSelectedPhase(null);
            }}
            onApproved={handlePhaseApproved}
          />
        )}

        {showEditModal && (
          <EditProjectModal
            project={project}
            onClose={() => setShowEditModal(false)}
            onSave={handleEdit}
          />
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-redwood-muted mb-6">
                ¿Estás seguro de que deseas eliminar el proyecto &ldquo;{project.name}&rdquo;? Esta acción eliminará todas las fases, tareas y registros asociados.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="subtle" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Eliminar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

function EditProjectModal({ project, onClose, onSave }: { 
  project: ProjectDetail; 
  onClose: () => void; 
  onSave: (updates: Partial<ProjectDetail>) => void;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    client: string;
    status: 'active' | 'on_hold' | 'completed' | 'archived';
    startDate: string;
    endDate: string;
    budget: number;
    budgetHours: number;
    hourlyRate: number;
    billable: boolean;
  }>({
    name: project.name,
    code: project.code,
    client: project.client || '',
    status: (project.status as 'active' | 'on_hold' | 'completed' | 'archived') || 'active',
    startDate: project.startDate || '',
    endDate: project.endDate || '',
    budget: project.budget || 0,
    budgetHours: project.budgetHours || 0,
    hourlyRate: project.hourlyRate || 100,
    billable: project.billable,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Editar Proyecto</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Código</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.client}
              onChange={e => setFormData({ ...formData, client: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'on_hold' | 'completed' | 'archived' })}
            >
              <option value="active">Activo</option>
              <option value="on_hold">En Pausa</option>
              <option value="completed">Completado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Fin</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Presupuesto ($)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.budget}
              onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Horas Presupuestadas</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.budgetHours}
              onChange={e => setFormData({ ...formData, budgetHours: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tarifa/Hora ($)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.hourlyRate}
              onChange={e => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.billable}
                onChange={e => setFormData({ ...formData, billable: e.target.checked })}
              />
              <span>Facturable</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="subtle" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onSave(formData)}>Guardar</Button>
        </div>
      </Card>
    </div>
  );
}
