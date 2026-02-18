'use client';

import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card, Input } from '@/components/ui';
import { Save } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <PageLayout>
      <Header
        title="Configuración"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Configuración' }]}
        actions={
          <Button variant="primary" icon={<Save className="h-4 w-4" />}>
            Guardar cambios
          </Button>
        }
      />
      <PageContent>
        <div className="max-w-4xl">
          <div className="border-b border-[var(--color-border-subtle)] mb-6">
            <Tabs
              tabs={[
                { id: 'general', label: 'General' },
                { id: 'validation', label: 'Reglas de validación' },
                { id: 'integrations', label: 'Integraciones' },
                { id: 'notifications', label: 'Notificaciones' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>

          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-semibold mb-4">Información de la cuenta</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                      Nombre de la organización
                    </label>
                    <Input className="mt-1" defaultValue="TimeOS Demo" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                      Zona horaria
                    </label>
                    <Input className="mt-1" defaultValue="America/Mexico_City" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'validation' && (
            <Card>
              <h3 className="text-sm font-semibold mb-4">Reglas de validación de horas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[var(--color-bg-page)] rounded-[var(--radius-md)]">
                  <div>
                    <p className="text-sm font-medium">Máximo de horas por día</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Las entradas que excedan este límite mostrarán una advertencia
                    </p>
                  </div>
                  <Input className="w-20" defaultValue="12" />
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--color-bg-page)] rounded-[var(--radius-md)]">
                  <div>
                    <p className="text-sm font-medium">Permitir horas en fines de semana</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Si está desactivado, las horas de sábado/domingo requerirán aprobación
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card>
              <h3 className="text-sm font-semibold mb-4">Integración con NetSuite</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                    URL del endpoint
                  </label>
                  <Input className="mt-1" placeholder="https://api.netsuite.com/..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                    API Key
                  </label>
                  <Input className="mt-1" type="password" placeholder="••••••••••••" />
                </div>
                <Button variant="secondary">Probar conexión</Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-sm font-semibold mb-4">Preferencias de notificación</h3>
              <div className="space-y-3">
                {[
                  { label: 'Recordatorio de timesheet semanal', default: true },
                  { label: 'Nueva aprobación pendiente', default: true },
                  { label: 'Timesheet rechazado', default: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-[var(--color-bg-page)] rounded-[var(--radius-md)]">
                    <span className="text-sm">{item.label}</span>
                    <input type="checkbox" defaultChecked={item.default} className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
