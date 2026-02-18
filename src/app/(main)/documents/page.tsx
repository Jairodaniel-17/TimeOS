'use client';

import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button } from '@/components/ui';
import { Upload, Download, Trash2, FileText, Folder } from 'lucide-react';

const folders = [
  { id: 'all', name: 'Todos los documentos', icon: Folder },
  { id: 'exports', name: 'Exportaciones', icon: Folder },
  { id: 'templates', name: 'Plantillas', icon: Folder },
];

const documents = [
  { id: '1', name: 'Timesheet_Semana08.xlsx', type: 'xlsx', createdBy: 'Ana García', size: '24 KB' },
  { id: '2', name: 'Reporte_Mensual.pdf', type: 'pdf', createdBy: 'Carlos López', size: '156 KB' },
];

export default function DocumentsPage() {
  return (
    <PageLayout>
      <Header
        title="Documentos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Documentos' }]}
        actions={
          <Button variant="primary" icon={<Upload className="h-4 w-4" />}>
            Subir archivo
          </Button>
        }
      />
      <PageContent className="p-0">
        <div className="flex h-full">
          <div className="w-64 border-r border-[var(--color-border-subtle)] bg-white p-4">
            <nav className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-page)]"
                >
                  <folder.icon className="h-4 w-4" />
                  {folder.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[var(--color-bg-page)] border-b border-[var(--color-border-subtle)]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-6 py-3">Nombre</th>
                    <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3">Tipo</th>
                    <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3">Creado por</th>
                    <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] px-4 py-3">Tamaño</th>
                    <th className="text-right text-xs font-medium text-[var(--color-text-secondary)] px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--color-hover-row)] cursor-pointer">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{doc.type === 'xlsx' ? '📊' : '📄'}</span>
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{doc.type.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{doc.createdBy}</td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{doc.size}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" icon={<Download className="h-4 w-4" />} />
                          <Button variant="ghost" size="icon" icon={<Trash2 className="h-4 w-4 text-[var(--color-error)]" />} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
