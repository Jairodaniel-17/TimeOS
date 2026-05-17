'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button } from '@/components/ui';
import { Upload, Download, Trash2, Folder, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── types ──────────────────────────────────────────────────────────────────

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  sizeFormatted: string;
  uploadedBy: string;
  uploadedAt: string;
}

// ─── constants ───────────────────────────────────────────────────────────────

const folders = [
  { id: 'all',       name: 'Todos los documentos' },
  { id: 'exports',   name: 'Exportaciones' },
  { id: 'templates', name: 'Plantillas' },
] as const;

type FolderId = (typeof folders)[number]['id'];

// ─── helpers ─────────────────────────────────────────────────────────────────

function fileIcon(type: string): string {
  const t = type.toLowerCase();
  if (t === 'xlsx' || t === 'xls' || t === 'csv') return '📊';
  if (t === 'pdf') return '📄';
  if (t === 'docx' || t === 'doc') return '📝';
  if (t === 'pptx' || t === 'ppt') return '📑';
  if (t === 'jpg' || t === 'jpeg' || t === 'png' || t === 'gif' || t === 'svg') return '🖼️';
  if (t === 'zip' || t === 'rar' || t === '7z') return '🗜️';
  return '📁';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

// ─── component ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderId>('all');
  const [error, setError] = useState<string | null>(null);

  // ── fetch list ─────────────────────────────────────────────────────────────

  const fetchDocuments = useCallback(async (folder: FolderId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents?folder=${folder}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Error al cargar documentos');
      setDocuments(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments(activeFolder);
  }, [activeFolder, fetchDocuments]);

  // ── folder click ───────────────────────────────────────────────────────────

  const handleFolderClick = (id: FolderId) => {
    if (id !== activeFolder) setActiveFolder(id);
  };

  // ── upload ─────────────────────────────────────────────────────────────────

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset so the same file can be re-uploaded if needed
    e.target.value = '';

    setUploading(true);
    setError(null);
    try {
      const content = await readFileAsBase64(file);
      const ext = file.name.split('.').pop() ?? 'bin';

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: ext,
          content,
          folder: activeFolder,
          uploadedBy: user?.name ?? 'Usuario',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Error al subir el archivo');
      await fetchDocuments(activeFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  // ── download ───────────────────────────────────────────────────────────────

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadingId(doc.id);
    setError(null);
    try {
      const res = await fetch(`/api/documents?id=${doc.id}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Error al descargar');

      const content: string = json.data?.content;
      if (!content) throw new Error('El documento no tiene contenido descargable');

      const a = document.createElement('a');
      a.href = content; // base64 dataURL
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar');
    } finally {
      setDownloadingId(null);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Error al eliminar');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <PageLayout>
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <Header
        title="Documentos"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Documentos' }]}
        actions={
          <Button
            variant="primary"
            icon={<Upload className="h-4 w-4" />}
            loading={uploading}
            onClick={handleUploadClick}
            disabled={uploading}
          >
            Subir archivo
          </Button>
        }
      />

      <PageContent className="p-0">
        <div className="flex h-full">
          {/* ── sidebar ────────────────────────────────────────────────── */}
          <div className="w-64 border-r border-redwood-border bg-redwood-surface p-4 flex-shrink-0">
            <nav className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderClick(folder.id)}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm transition-colors',
                    activeFolder === folder.id
                      ? 'bg-redwood-selected-bg text-redwood-primary font-semibold'
                      : 'text-redwood-muted hover:bg-redwood-page',
                  ].join(' ')}
                >
                  <Folder
                    className={[
                      'h-4 w-4 flex-shrink-0',
                      activeFolder === folder.id ? 'text-redwood-primary' : '',
                    ].join(' ')}
                  />
                  {folder.name}
                </button>
              ))}
            </nav>
          </div>

          {/* ── main area ──────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* error banner */}
            {error && (
              <div className="mx-6 mt-4 px-4 py-3 rounded-[10px] bg-[var(--color-error-bg,#fef2f2)] border border-[var(--color-error,#ef4444)] text-[var(--color-error,#ef4444)] text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-redwood-muted">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm">Cargando documentos…</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-redwood-muted gap-3">
                <Folder className="h-10 w-10 opacity-30" />
                <p className="text-sm">No hay documentos en esta carpeta.</p>
                <Button
                  variant="outlined"
                  size="compact"
                  icon={<Upload className="h-4 w-4" />}
                  onClick={handleUploadClick}
                  disabled={uploading}
                >
                  Subir el primero
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-redwood-page border-b border-redwood-border z-10">
                    <tr>
                      <th className="text-left text-xs font-medium text-redwood-muted px-6 py-3">Nombre</th>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">Tipo</th>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">Creado por</th>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">Fecha</th>
                      <th className="text-left text-xs font-medium text-redwood-muted px-4 py-3">Tamaño</th>
                      <th className="text-right text-xs font-medium text-redwood-muted px-6 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-redwood-border">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-redwood-hover-bg">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl leading-none">{fileIcon(doc.type)}</span>
                            <span className="text-sm font-medium truncate max-w-[260px]" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-redwood-muted uppercase">{doc.type}</td>
                        <td className="px-4 py-3 text-sm text-redwood-muted">{doc.uploadedBy}</td>
                        <td className="px-4 py-3 text-sm text-redwood-muted whitespace-nowrap">
                          {formatDate(doc.uploadedAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-redwood-muted whitespace-nowrap">
                          {doc.sizeFormatted}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="subtle"
                              size="icon"
                              icon={
                                downloadingId === doc.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Download className="h-4 w-4" />
                              }
                              onClick={() => handleDownload(doc)}
                              disabled={downloadingId === doc.id || deletingId === doc.id}
                              title="Descargar"
                            />
                            <Button
                              variant="subtle"
                              size="icon"
                              icon={
                                deletingId === doc.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
                              }
                              onClick={() => handleDelete(doc.id)}
                              disabled={deletingId === doc.id || downloadingId === doc.id}
                              title="Eliminar"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
