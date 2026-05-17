'use client';

import { useState, useRef } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { X, Upload, FileText, Image, File, Trash2, Phone, Calendar, User, MessageSquare } from 'lucide-react';
import type { PhaseWithApproval } from '@/types';

interface PhaseApprovalModalProps {
  phase: PhaseWithApproval;
  projectId: string;
  currentUserId: string;
  onClose: () => void;
  onApproved: () => void;
}

export function PhaseApprovalModal({ phase, projectId, currentUserId, onClose, onApproved }: PhaseApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Array<{ name: string; type: string; size: number; data: string }>>([]);
  const [formData, setFormData] = useState({
    callDate: '',
    callTime: '',
    callPerson: '',
    callNotes: '',
    notes: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    for (const file of Array.from(selectedFiles)) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const data = base64.split(',')[1];
        setFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data,
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/${phase.phaseId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: currentUserId,
          callDate: formData.callDate,
          callTime: formData.callTime,
          callPerson: formData.callPerson,
          callNotes: formData.callNotes,
          notes: formData.notes,
          files,
        }),
      });

      if (res.ok) {
        onApproved();
        onClose();
      }
    } catch (error) {
      console.error('Error approving phase:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Aprobar Fase</h3>
            <p className="text-sm text-redwood-muted">{phase.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-redwood-selected-bg p-4 rounded-lg border border-redwood-selected-border">
            <div className="flex items-center gap-2 text-redwood-primary font-medium mb-2">
              <Calendar className="h-4 w-4" />
              Fecha de Aprobación
            </div>
            <p className="text-redwood-primary">{new Date().toLocaleDateString()}</p>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium text-redwood-text mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Evidencia de Llamada (Opcional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-redwood-muted mb-1">
                  Fecha de Llamada
                </label>
                <input
                  type="date"
                  className="w-full border border-redwood-border bg-redwood-surface text-redwood-text rounded-lg px-3 py-2 focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={formData.callDate}
                  onChange={e => setFormData({ ...formData, callDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-redwood-muted mb-1">
                  Hora de Llamada
                </label>
                <input
                  type="time"
                  className="w-full border border-redwood-border bg-redwood-surface text-redwood-text rounded-lg px-3 py-2 focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  value={formData.callTime}
                  onChange={e => setFormData({ ...formData, callTime: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-redwood-muted mb-1">
                  Persona Contactada
                </label>
                <input
                  type="text"
                  className="w-full border border-redwood-border bg-redwood-surface text-redwood-text rounded-lg px-3 py-2 focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  placeholder="Nombre de la persona con quien se habló"
                  value={formData.callPerson}
                  onChange={e => setFormData({ ...formData, callPerson: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-redwood-muted mb-1">
                  Notas de la Llamada
                </label>
                <textarea
                  className="w-full border border-redwood-border bg-redwood-surface text-redwood-text rounded-lg px-3 py-2 focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
                  rows={2}
                  placeholder="Detalles de la conversación..."
                  value={formData.callNotes}
                  onChange={e => setFormData({ ...formData, callNotes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium text-redwood-text mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notas Generales
            </h4>
            <textarea
              className="w-full border border-redwood-border bg-redwood-surface text-redwood-text rounded-lg px-3 py-2 focus:outline-none focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20"
              rows={3}
              placeholder="Observaciones adicionales..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium text-redwood-text mb-4 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Archivos de Evidencia
            </h4>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-redwood-border rounded-lg p-6 hover:border-redwood-primary/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-redwood-muted mx-auto mb-2" />
              <p className="text-sm text-redwood-muted">Click para subir archivos</p>
              <p className="text-xs text-redwood-muted">Imágenes, PDFs (capturas de correo, etc.)</p>
            </button>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-redwood-surface-soft p-3 rounded-lg border border-redwood-border">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-redwood-muted">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[var(--color-alert-bg)] p-4 rounded-lg border border-[var(--color-alert-border)]">
            <div className="flex items-start gap-2">
              <div className="text-redwood-warning mt-0.5">⚠️</div>
              <div className="text-sm text-[var(--color-alert-text)]">
                <strong>Importante:</strong> Al aprobar esta fase, se registrará la fecha, hora y toda la evidencia proporcionada. Esta acción no se puede deshacer.
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="subtle" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Aprobar Fase
          </Button>
        </div>
      </Card>
    </div>
  );
}
