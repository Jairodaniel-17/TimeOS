'use client';

import { Card, Badge } from '@/components/ui';
import { CheckCircle, Circle, Clock, DollarSign, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import type { PhaseWithApproval } from '@/types';

interface PhaseTimelineProps {
  phases: PhaseWithApproval[];
  onApprovePhase: (phase: PhaseWithApproval) => void;
  canApprove: boolean;
}

export function PhaseTimeline({ phases, onApprovePhase, canApprove }: PhaseTimelineProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-redwood-green" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-redwood-primary" />;
      default:
        return <Circle className="h-5 w-5 text-redwood-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge severity="success">Completado</Badge>;
      case 'in_progress':
        return <Badge severity="info">En Progreso</Badge>;
      default:
        return <Badge severity="warning">Pendiente</Badge>;
    }
  };

  const totalHours = phases.reduce((sum, p) => sum + (p.actualHours || 0), 0);
  const totalCost = phases.reduce((sum, p) => sum + (p.actualCost || 0), 0);
  const completedCount = phases.filter(p => p.status === 'completed').length;
  const progress = Math.round((completedCount / phases.length) * 100);

  return (
    <div className="space-y-4">
      <Card className="bg-redwood-selected-bg border-redwood-selected-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-redwood-text">Progreso del Proyecto</h3>
            <p className="text-sm text-redwood-muted">{completedCount} de {phases.length} fases completadas</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-redwood-primary">{progress}%</p>
              <p className="text-xs text-redwood-muted">Avance</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-redwood-green">{totalHours}h</p>
              <p className="text-xs text-redwood-muted">Horas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-redwood-primary">${totalCost.toLocaleString()}</p>
              <p className="text-xs text-redwood-muted">Costo</p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-redwood-solid-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-redwood-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-redwood-border" />
        
        {phases.map((phase, index) => (
          <div key={phase.id} className="relative pl-12 pb-6 last:pb-0">
            <div className="absolute left-4 -ml-2 w-5 h-5 bg-redwood-surface rounded-full flex items-center justify-center">
              {getStatusIcon(phase.status)}
            </div>
            
            <Card 
              className={clsx(
                'transition-all duration-200',
                phase.status === 'completed' && 'border-redwood-green/30 bg-badge-subtle-success-bg',
                phase.status === 'in_progress' && 'border-redwood-primary/30 bg-badge-subtle-info-bg',
                expandedPhase === phase.id && 'ring-2 ring-redwood-primary'
              )}
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-redwood-muted w-6">{index + 1}.</span>
                  <h4 className="font-medium text-redwood-text">{phase.name}</h4>
                  {getStatusBadge(phase.status)}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <span className="text-redwood-muted">{phase.actualHours || 0}h</span>
                    <span className="mx-1">·</span>
                    <span className="text-redwood-muted">${(phase.actualCost || 0).toLocaleString()}</span>
                  </div>
                  {expandedPhase === phase.id ? (
                    <ChevronDown className="h-4 w-4 text-redwood-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-redwood-muted" />
                  )}
                </div>
              </div>
              
              {expandedPhase === phase.id && (
                <div className="mt-4 pt-4 border-t border-redwood-border">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-redwood-surface p-3 rounded-lg border border-redwood-border">
                      <div className="flex items-center gap-2 text-redwood-muted text-xs mb-1">
                        <Clock className="h-3 w-3" />
                        Horas
                      </div>
                      <p className="text-lg font-semibold">{phase.actualHours || 0}h</p>
                    </div>
                    <div className="bg-redwood-surface p-3 rounded-lg border border-redwood-border">
                      <div className="flex items-center gap-2 text-redwood-muted text-xs mb-1">
                        <DollarSign className="h-3 w-3" />
                        Costo
                      </div>
                      <p className="text-lg font-semibold">${(phase.actualCost || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-redwood-surface p-3 rounded-lg border border-redwood-border">
                      <div className="flex items-center gap-2 text-redwood-muted text-xs mb-1">
                        <FileText className="h-3 w-3" />
                        Tareas
                      </div>
                      <p className="text-lg font-semibold">{phase.taskCount || 0}</p>
                    </div>
                  </div>
                  
                  {phase.status === 'completed' && phase.approval && (
                    <div className="bg-badge-subtle-success-bg p-3 rounded-lg mb-4">
                      <p className="text-sm text-redwood-green">
                        <strong>Aprobado:</strong> {new Date(phase.approval.approvedAt).toLocaleDateString()}
                      </p>
                      {phase.approval.callPerson && (
                        <p className="text-sm text-redwood-green mt-1">
                          Llamada con: {phase.approval.callPerson} - {phase.approval.callDate} {phase.approval.callTime}
                        </p>
                      )}
                      {phase.approval.notes && (
                        <p className="text-sm text-redwood-green mt-1">{phase.approval.notes}</p>
                      )}
                      {phase.approvalFiles && phase.approvalFiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {phase.approvalFiles.map(file => (
                            <a
                              key={file.id}
                              href={file.data ? `data:${file.type};base64,${file.data}` : `/api/approval-files/${file.id}`}
                              download={file.name}
                              className="text-xs text-redwood-green underline hover:opacity-80"
                            >
                              {file.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {phase.status !== 'completed' && canApprove && (
                      <button
                        onClick={() => onApprovePhase(phase)}
                        className="px-4 py-2 bg-redwood-green text-white rounded-lg hover:opacity-90 text-sm font-medium"
                      >
                        {phase.status === 'pending' ? 'Iniciar Fase' : 'Aprobar Fase'}
                      </button>
                    )}
                    {phase.tasks && phase.tasks.length > 0 && (
                      <button
                        className="px-4 py-2 border border-redwood-border rounded-lg hover:bg-redwood-hover-bg text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        Ver {phase.tasks.length} tareas
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
