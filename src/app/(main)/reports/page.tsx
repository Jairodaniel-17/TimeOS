import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { Download, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  return (
    <PageLayout>
      <Header
        title="Reportes"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Reportes' }]}
        actions={
          <>
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />}>
              Actualizar
            </Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
              Exportar
            </Button>
          </>
        }
      />
      <PageContent>
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-base font-semibold text-[var(--color-text-primary)]">
            Arrastra campos para comenzar
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm">
            Usa el panel de la izquierda para configurar filas, columnas y valores de tu tabla dinámica.
          </p>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
