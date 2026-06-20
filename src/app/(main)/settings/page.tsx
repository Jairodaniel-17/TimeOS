'use client';

import { Header, PageLayout, PageContent } from '@/components/layout';
import { Button, Tabs, Card, Input } from '@/components/ui';
import { Save, Check } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_PREFS = {
  weeklyReminder: true,
  pendingApproval: true,
  timesheetRejected: true,
};

function readOrgSettings() {
  if (typeof window === 'undefined') return null;
  const orgData = localStorage.getItem('timeos_org_settings');
  if (!orgData) return null;
  try {
    return JSON.parse(orgData) as { orgName?: string; timezone?: string; maxHours?: string; allowWeekend?: boolean };
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [orgName, setOrgName] = useState(() => readOrgSettings()?.orgName ?? 'TimeOS Demo');
  const [timezone, setTimezone] = useState(() => readOrgSettings()?.timezone ?? 'America/Mexico_City');
  const [maxHours, setMaxHours] = useState(() => readOrgSettings()?.maxHours ?? '12');
  const [allowWeekend, setAllowWeekend] = useState(() => {
    const aw = readOrgSettings()?.allowWeekend;
    return typeof aw === 'boolean' ? aw : true;
  });

  // Load per-user prefs when the user becomes available / changes. Adjusting
  // state during render with a previous-value guard (the React "storing
  // information from previous renders" pattern) avoids a setState-in-effect.
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  if (user && loadedUserId !== user.id) {
    setLoadedUserId(user.id);
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem(`timeos_prefs_${user.id}`)
      : null;
    if (stored) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      } catch { /* ignore */ }
    }
  }

  const handleSave = async () => {
    if (user) {
      localStorage.setItem(`timeos_prefs_${user.id}`, JSON.stringify(prefs));
      localStorage.setItem('timeos_org_settings', JSON.stringify({ orgName, timezone, maxHours, allowWeekend }));
      try {
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, preferences: prefs }),
        });
      } catch { /* non-critical */ }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageLayout>
      <Header
        title="Configuración"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Configuración' }]}
        actions={
          <Button
            variant={saved ? 'subtle' : 'primary'}
            icon={saved ? <Check className="h-4 w-4 text-green-600" /> : <Save className="h-4 w-4" />}
            onClick={handleSave}
          >
            {saved ? 'Guardado' : 'Guardar cambios'}
          </Button>
        }
      />
      <PageContent>
        <div className="max-w-4xl">
          <div className="border-b border-redwood-border mb-6">
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
                    <label className="text-xs font-medium text-redwood-muted">Nombre de la organización</label>
                    <Input className="mt-1" value={orgName} onChange={e => setOrgName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-redwood-muted">Zona horaria</label>
                    <Input className="mt-1" value={timezone} onChange={e => setTimezone(e.target.value)} />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'validation' && (
            <Card>
              <h3 className="text-sm font-semibold mb-4">Reglas de validación de horas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-redwood-page rounded-[14px]">
                  <div>
                    <p className="text-sm font-medium">Máximo de horas por día</p>
                    <p className="text-xs text-redwood-muted">Las entradas que excedan este límite mostrarán una advertencia</p>
                  </div>
                  <Input className="w-20" value={maxHours} onChange={e => setMaxHours(e.target.value)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-redwood-page rounded-[14px]">
                  <div>
                    <p className="text-sm font-medium">Permitir horas en fines de semana</p>
                    <p className="text-xs text-redwood-muted">Si está desactivado, las horas de sábado/domingo requerirán aprobación</p>
                  </div>
                  <input type="checkbox" checked={allowWeekend} onChange={e => setAllowWeekend(e.target.checked)} className="h-4 w-4" />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-semibold mb-4">Integración con NetSuite</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-redwood-muted">URL del endpoint</label>
                    <Input className="mt-1" placeholder="https://api.netsuite.com/..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-redwood-muted">API Key</label>
                    <Input className="mt-1" type="password" placeholder="••••••••••••" />
                  </div>
                  <Button variant="subtle">Probar conexión</Button>
                </div>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold mb-1">Webhook / Slack</h3>
                <p className="text-xs text-redwood-muted mb-4">Envía notificaciones automáticas a un canal de Slack cuando se aprueba o rechaza un timesheet.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-redwood-muted">Slack Webhook URL</label>
                    <Input className="mt-1" placeholder="https://hooks.slack.com/services/..." />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-redwood-page rounded-[14px]">
                    <input type="checkbox" disabled className="h-4 w-4 opacity-50" />
                    <span className="text-sm text-redwood-muted">Activar integración Slack <span className="text-xs">(próximamente)</span></span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-sm font-semibold mb-4">Preferencias de notificación</h3>
              <div className="space-y-3">
                {([
                  { key: 'weeklyReminder', label: 'Recordatorio de timesheet semanal', description: 'Recibe un recordatorio cada lunes para registrar tus horas.' },
                  { key: 'pendingApproval', label: 'Nueva aprobación pendiente', description: 'Notificación cuando un empleado envía su timesheet para revisión.' },
                  { key: 'timesheetRejected', label: 'Timesheet rechazado', description: 'Notificación cuando tu timesheet es rechazado o requiere cambios.' },
                ] as { key: keyof typeof DEFAULT_PREFS; label: string; description: string }[]).map(item => (
                  <div key={item.key} className="flex items-start justify-between p-3 bg-redwood-page rounded-[14px]">
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      <p className="text-xs text-redwood-muted mt-0.5">{item.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs[item.key]}
                      onChange={e => setPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-redwood-muted mt-4">Los cambios se guardan al pulsar &quot;Guardar cambios&quot;.</p>
            </Card>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
