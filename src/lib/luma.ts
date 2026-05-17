const LUMA_API_URL = process.env.LUMA_API_URL || 'https://luma.deepgen.qzz.io';
const LUMA_API_KEY = process.env.LUMA_API_KEY || 'AmyRose#Sonic@Amor';

type CacheEntry = { data: unknown; expires: number };

export class LumaClient {
  private baseUrl: string;
  private headers: HeadersInit;
  private cache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<unknown>>();
  private readonly CACHE_TTL = 30_000; // 30 seconds

  constructor(baseUrl: string = LUMA_API_URL, apiKey: string = LUMA_API_KEY) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }

  private fromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { this.cache.delete(key); return null; }
    return entry.data as T;
  }

  private toCache(key: string, data: unknown): void {
    // Evict old entries if cache grows too large
    if (this.cache.size > 500) {
      const now = Date.now();
      for (const [k, v] of this.cache) { if (now > v.expires) this.cache.delete(k); }
    }
    this.cache.set(key, { data, expires: Date.now() + this.CACHE_TTL });
  }

  invalidateCollection(collection: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`find:${collection}:`) || key.startsWith(`get:${collection}:`)) {
        this.cache.delete(key);
      }
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // SQL Operations
  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const response = await this.request<{ rows: T[] }>('/v1/sql/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
    return response.rows;
  }

  async exec(sql: string, params: unknown[] = []): Promise<{ rowsAffected: number }> {
    const response = await this.request<{ rows_affected: number }>('/v1/sql/exec', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
    return { rowsAffected: response.rows_affected };
  }

  // State Management
  async getState<T = unknown>(key: string): Promise<{ value: T; revision: number } | null> {
    try {
      const response = await this.request<{ value: T; revision: number }>(`/v1/state/${encodeURIComponent(key)}`);
      return response;
    } catch {
      return null;
    }
  }

  async setState<T = unknown>(key: string, value: T, ifRevision?: number): Promise<{ revision: number }> {
    const body: Record<string, unknown> = { value };
    if (ifRevision !== undefined) {
      body.if_revision = ifRevision;
    }
    const response = await this.request<{ revision: number }>(`/v1/state/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return response;
  }

  async deleteState(key: string): Promise<boolean> {
    const response = await this.request<{ deleted: boolean }>(`/v1/state/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    return response.deleted;
  }

  async listStates(prefix?: string, limit?: number): Promise<Array<{ key: string; value: unknown; revision: number }>> {
    const params = new URLSearchParams();
    if (prefix) params.set('prefix', prefix);
    if (limit) params.set('limit', String(limit));
    const queryString = params.toString();
    return this.request(`/v1/state${queryString ? `?${queryString}` : ''}`);
  }

  // Document Store
  async getDoc<T = unknown>(collection: string, id: string): Promise<{ doc: T; id: string; revision: number } | null> {
    const cacheKey = `get:${collection}:${id}`;
    const cached = this.fromCache<{ doc: T; id: string; revision: number }>(cacheKey);
    if (cached !== null) return cached;

    if (this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey) as Promise<{ doc: T; id: string; revision: number } | null>;
    }

    const promise = this.request<{ doc: T; id: string; revision: number }>(`/v1/doc/${collection}/${encodeURIComponent(id)}`)
      .then(result => {
        this.toCache(cacheKey, result);
        this.inFlight.delete(cacheKey);
        return result;
      }).catch(() => {
        this.inFlight.delete(cacheKey);
        return null;
      });

    this.inFlight.set(cacheKey, promise);
    return promise;
  }

  async putDoc<T = unknown>(collection: string, id: string, doc: T): Promise<{ id: string; revision: number }> {
    const result = await this.request<{ id: string; revision: number }>(`/v1/doc/${collection}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(doc),
    });
    // Update single-doc cache with new value, invalidate collection-level findDocs cache
    this.toCache(`get:${collection}:${id}`, { doc, id, revision: result.revision });
    this.invalidateCollection(collection);
    return result;
  }

  async deleteDoc(collection: string, id: string): Promise<void> {
    await this.request(`/v1/doc/${collection}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    this.cache.delete(`get:${collection}:${id}`);
    this.invalidateCollection(collection);
  }

  async findDocs<T = unknown>(collection: string, filter?: Record<string, unknown>, limit?: number): Promise<Array<{ doc: T; id: string; revision: number }>> {
    const cacheKey = `find:${collection}:${JSON.stringify(filter ?? null)}:${limit ?? ''}`;
    const cached = this.fromCache<Array<{ doc: T; id: string; revision: number }>>(cacheKey);
    if (cached !== null) return cached;

    if (this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey) as Promise<Array<{ doc: T; id: string; revision: number }>>;
    }

    const promise = this.request<{ documents: Array<{ doc: T; id: string; revision: number }> }>(
      `/v1/doc/${collection}/find`,
      { method: 'POST', body: JSON.stringify({ filter, limit }) }
    ).then(response => {
      this.toCache(cacheKey, response.documents);
      this.inFlight.delete(cacheKey);
      return response.documents;
    }).catch(err => {
      this.inFlight.delete(cacheKey);
      throw err;
    });

    this.inFlight.set(cacheKey, promise);
    return promise;
  }

  // Vector Operations
  async createCollection(name: string, dim: number, metric: 'cosine' | 'dot' = 'cosine'): Promise<void> {
    await this.request(`/v1/vector/${name}`, {
      method: 'POST',
      body: JSON.stringify({ dim, metric }),
    });
  }

  async upsertVector(collection: string, id: string, vector: number[], meta?: Record<string, unknown>): Promise<void> {
    await this.request(`/v1/vector/${collection}/upsert`, {
      method: 'POST',
      body: JSON.stringify({ id, vector, meta }),
    });
  }

  async searchVectors(
    collection: string,
    vector: number[],
    k: number,
    filters?: Record<string, unknown>
  ): Promise<Array<{ id: string; score: number; meta?: unknown }>> {
    const response = await this.request<{ hits: Array<{ id: string; score: number; meta?: unknown }> }>(
      `/v1/vector/${collection}/search`,
      {
        method: 'POST',
        body: JSON.stringify({ vector, k, filters, include_meta: true }),
      }
    );
    return response.hits;
  }

  // RAG Search
  async ragSearch(query: string, topK: number = 10, filters?: Record<string, unknown>): Promise<{
    query: string;
    results: Array<{ document: { content: string; metadata: unknown }; score: number }>;
  }> {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK, filters }),
    });
  }
}

export const luma = new LumaClient();
