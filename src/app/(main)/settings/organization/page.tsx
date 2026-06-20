'use client';

import { useEffect, useState } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Card } from '@/components/ui';
import { Building2, Crown, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OrgMember {
  id: string; name: string; email: string; role: string; isActive: boolean;
}
interface OrgRow {
  id: string; name: string; slug: string; plan: 'free' | 'pro' | 'enterprise';
  ownerName: string; memberCount: number; members: OrgMember[];
}

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-redwood-page text-redwood-muted',
  pro: 'bg-badge-subtle-info-bg text-redwood-primary',
  enterprise: 'bg-badge-subtle-success-bg text-redwood-green',
};
const ROLE_LABEL: Record<string, string> = { admin: 'Admin', manager: 'Manager', member: 'Miembro' };

export default function OrganizationPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizations')
      .then(r => r.json())
      .then(d => { if (d.success) setOrgs(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // El usuario ve su organización primero (multi-tenant).
  const mine = orgs.find(o => o.id === user?.orgId);
  const ordered = mine ? [mine, ...orgs.filter(o => o.id !== mine.id)] : orgs;

  return (
    <PageLayout>
      <Header title="Organización" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Sistema' }, { label: 'Organización' }]} />
      <PageContent>
        {loading ? (
          <div className="space-y-4">{[0, 1].map(i => <div key={i} className="h-40 rounded-[14px] animate-pulse bg-redwood-solid-bg" />)}</div>
        ) : ordered.length === 0 ? (
          <Card><p className="text-sm text-redwood-muted py-8 text-center">Sin organizaciones.</p></Card>
        ) : (
          <div className="space-y-5">
            {ordered.map(org => (
              <Card key={org.id} padding="none">
                <div className="flex items-start justify-between p-5 border-b border-redwood-border">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-oracle-sidebar flex items-center justify-center text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-redwood-text">{org.name}</h3>
                        {org.id === user?.orgId && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-badge-subtle-info-bg text-redwood-primary">Tu organización</span>}
                      </div>
                      <p className="text-xs text-redwood-muted mt-0.5">/{org.slug} · <span className="inline-flex items-center gap-1"><Crown className="h-3 w-3" />{org.ownerName}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_STYLES[org.plan]}`}>{org.plan}</span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-redwood-muted mb-3">
                    <UsersIcon className="h-3.5 w-3.5" /> {org.memberCount} {org.memberCount === 1 ? 'miembro' : 'miembros'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {org.members.map(m => (
                      <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-redwood-page">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-oracle-sidebar text-[11px] font-semibold text-white">
                          {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-redwood-text truncate">{m.name}</p>
                          <p className="text-xs text-redwood-muted truncate">{m.email}</p>
                        </div>
                        <span className="text-[11px] text-redwood-muted">{ROLE_LABEL[m.role] || m.role}</span>
                        {!m.isActive && <span className="text-[10px] text-redwood-danger">inactivo</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
