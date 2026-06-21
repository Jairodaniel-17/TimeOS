import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Aislamiento multi-tenant del data layer.
//
// Verifica que `luma-docs` scopea TODA lectura/escritura por la organización
// del request (header `x-org-id` que inyecta el middleware). Una org no debe
// poder leer, actualizar ni borrar datos de otra (IDOR cerrado).
// ---------------------------------------------------------------------------

// Org "actual" del request, controlada por cada test.
const ctx = vi.hoisted(() => ({ org: null as string | null }));

// next/headers → controla currentOrgId() vía ctx.org.
vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (k: string) => (k === 'x-org-id' ? ctx.org : null),
  }),
}));

// Luma en memoria: un Map por colección. findDocs filtra por igualdad exacta,
// igual que el backend real (sobre el que se apoya el scope server-side).
const store = vi.hoisted(() => ({ cols: new Map<string, Map<string, Record<string, unknown>>>() }));
vi.mock('../src/lib/luma', () => ({
  luma: {
    findDocs: async (col: string, filter: Record<string, unknown> | undefined) => {
      const c = store.cols.get(col) ?? new Map();
      let arr = [...c.values()];
      if (filter) arr = arr.filter(doc => Object.entries(filter).every(([k, v]) => doc[k] === v));
      return arr.map(doc => ({ id: doc.id as string, doc }));
    },
    getDoc: async (col: string, id: string) => {
      const doc = store.cols.get(col)?.get(id);
      return doc ? { id, doc } : null;
    },
    putDoc: async (col: string, id: string, doc: Record<string, unknown>) => {
      if (!store.cols.has(col)) store.cols.set(col, new Map());
      store.cols.get(col)!.set(id, doc);
    },
    deleteDoc: async (col: string, id: string) => {
      store.cols.get(col)?.delete(id);
    },
  },
}));

import {
  createProject, getProjects, getProjectById, updateProject,
  createTaskTimeEntry, deleteTaskTimeEntry, getTaskTimeEntries,
} from '../src/lib/luma-docs';

const baseProject = { name: 'P', code: 'C', billable: true, status: 'active' };

beforeEach(() => {
  store.cols.clear();
  ctx.org = null;
});

describe('multi-tenancy — scope por orgId', () => {
  it('createProject estampa el orgId del request', async () => {
    ctx.org = 'org_a';
    await createProject({ id: 'p1', ...baseProject });
    expect(store.cols.get('projects')!.get('p1')!.orgId).toBe('org_a');
  });

  it('getProjects solo devuelve proyectos de la org del request', async () => {
    ctx.org = 'org_a';
    await createProject({ id: 'pa', ...baseProject });
    ctx.org = 'org_b';
    await createProject({ id: 'pb', ...baseProject });

    ctx.org = 'org_a';
    const a = await getProjects();
    expect(a.map(p => p.id)).toEqual(['pa']);

    ctx.org = 'org_b';
    const b = await getProjects();
    expect(b.map(p => p.id)).toEqual(['pb']);
  });

  it('getProjectById de otra org devuelve null (IDOR cerrado)', async () => {
    ctx.org = 'org_b';
    await createProject({ id: 'pb', ...baseProject });

    ctx.org = 'org_a';
    expect(await getProjectById('pb')).toBeNull();

    ctx.org = 'org_b';
    expect(await getProjectById('pb')).not.toBeNull();
  });

  it('updateProject de otra org no muta y devuelve null', async () => {
    ctx.org = 'org_b';
    await createProject({ id: 'pb', ...baseProject });

    ctx.org = 'org_a';
    expect(await updateProject('pb', { name: 'hacked' })).toBeNull();

    ctx.org = 'org_b';
    expect((await getProjectById('pb'))!.name).toBe('P');
  });

  it('sin org en contexto, las listas son fail-closed ([])', async () => {
    ctx.org = 'org_a';
    await createProject({ id: 'pa', ...baseProject });

    ctx.org = null;
    expect(await getProjects()).toEqual([]);
  });

  it('deleteTaskTimeEntry de otra org es no-op', async () => {
    ctx.org = 'org_b';
    await createTaskTimeEntry({ id: 'tte1', taskId: 't1', userId: 'u1', projectId: 'pb', hours: 4, date: '2026-06-20', billable: true, weekNumber: 25, year: 2026 });

    ctx.org = 'org_a';
    await deleteTaskTimeEntry('tte1');

    ctx.org = 'org_b';
    const entries = await getTaskTimeEntries({ taskId: 't1' });
    expect(entries).toHaveLength(1);
  });
});
